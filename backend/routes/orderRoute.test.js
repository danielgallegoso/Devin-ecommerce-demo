import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Order from '../models/orderModel';
import User from '../models/userModel';
import { getToken } from '../util';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../testUtils/db';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const createUser = (overrides = {}) =>
  User.create({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'secret',
    isAdmin: false,
    ...overrides,
  });

const orderPayload = () => ({
  orderItems: [
    {
      name: 'Phone A',
      qty: 2,
      image: '/images/a.jpg',
      price: '100',
      product: mongoose.Types.ObjectId(),
    },
  ],
  shipping: {
    address: '1 Main St',
    city: 'Bellevue',
    postalCode: '98006',
    country: 'USA',
  },
  payment: { paymentMethod: 'paypal' },
  itemsPrice: 200,
  taxPrice: 30,
  shippingPrice: 0,
  totalPrice: 230,
});

const createOrder = (user) => Order.create({ ...orderPayload(), user: user._id });

describe('GET /api/orders', () => {
  test('returns every order for an admin', async () => {
    const admin = await createUser({ email: 'admin@example.com', isAdmin: true });
    const customer = await createUser();
    await createOrder(customer);

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  test('responds 401 for a signed-in user who is not an admin', async () => {
    const customer = await createUser();
    await createOrder(customer);

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${getToken(customer)}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Admin Token is not valid.' });
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const response = await request(app).get('/api/orders');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
  });
});

describe('GET /api/orders/mine', () => {
  test('returns only the orders owned by the signed-in user', async () => {
    const customer = await createUser();
    const other = await createUser({ email: 'grace@example.com' });
    await createOrder(customer);
    await createOrder(other);

    const response = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', `Bearer ${getToken(customer)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user).toBe(String(customer._id));
  });
});

describe('GET /api/orders/:id', () => {
  test('returns the order to the user who owns it', async () => {
    // Arrange
    const customer = await createUser();
    const order = await createOrder(customer);

    // Act
    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(customer)}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(String(order._id));
    expect(response.body.totalPrice).toBe(230);
  });

  test('returns any order to an admin', async () => {
    const admin = await createUser({ email: 'admin@example.com', isAdmin: true });
    const customer = await createUser();
    const order = await createOrder(customer);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(String(order._id));
  });

  test('responds 401 for a signed-in user who does not own the order', async () => {
    const owner = await createUser();
    const attacker = await createUser({ email: 'mallory@example.com' });
    const order = await createOrder(owner);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(attacker)}`);

    expect(response.status).toBe(401);
    expect(response.body.shipping).toBeUndefined();
  });

  test('responds 404 when the order does not exist', async () => {
    const customer = await createUser();

    const response = await request(app)
      .get(`/api/orders/${mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${getToken(customer)}`);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/orders', () => {
  test('creates the order for the signed-in user', async () => {
    // Arrange
    const customer = await createUser();

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(orderPayload());

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('New Order Created');
    expect(response.body.data.user).toBe(String(customer._id));
    expect(await Order.countDocuments()).toBe(1);
  });

  test('recomputes the totals from the order items instead of trusting the request body', async () => {
    const customer = await createUser();
    const tamperedPayload = {
      ...orderPayload(),
      itemsPrice: 1,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 1,
    };

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(tamperedPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.itemsPrice).toBeCloseTo(200, 2);
    expect(response.body.data.totalPrice).toBeCloseTo(230, 2);
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const response = await request(app).post('/api/orders').send(orderPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
    expect(await Order.countDocuments()).toBe(0);
  });
});

describe('PUT /api/orders/:id/pay', () => {
  const paymentResult = {
    payerID: 'PAYER-1',
    orderID: 'ORDER-1',
    paymentID: 'PAYMENT-1',
  };

  test('marks the owner\'s order as paid and records when it was paid', async () => {
    // Arrange
    const customer = await createUser();
    const order = await createOrder(customer);

    // Act
    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(paymentResult);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Order Paid.');
    const stored = await Order.findById(order._id);
    expect(stored.isPaid).toBe(true);
    expect(stored.paidAt).toBeInstanceOf(Date);
  });

  test('persists the payment result returned by the payment provider', async () => {
    const customer = await createUser();
    const order = await createOrder(customer);

    await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(paymentResult);

    const stored = await Order.findById(order._id);
    expect(stored.payment.paymentResult).toMatchObject(paymentResult);
  });

  test('responds 401 for a signed-in user who does not own the order', async () => {
    const owner = await createUser();
    const attacker = await createUser({ email: 'mallory@example.com' });
    const order = await createOrder(owner);

    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(attacker)}`)
      .send(paymentResult);

    expect(response.status).toBe(401);
    const stored = await Order.findById(order._id);
    expect(stored.isPaid).toBe(false);
  });

  test('responds 404 when the order does not exist', async () => {
    const customer = await createUser();

    const response = await request(app)
      .put(`/api/orders/${mongoose.Types.ObjectId()}/pay`)
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(paymentResult);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Order not found.' });
  });
});
