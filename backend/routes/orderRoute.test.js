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
  test('returns the order to the customer who owns it', async () => {
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

  test('returns the order to an admin', async () => {
    const customer = await createUser();
    const admin = await createUser({ email: 'admin@example.com', isAdmin: true });
    const order = await createOrder(customer);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(String(order._id));
  });

  test('responds 404 when a signed-in user requests an order owned by someone else', async () => {
    const owner = await createUser();
    const intruder = await createUser({ email: 'intruder@example.com' });
    const order = await createOrder(owner);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(intruder)}`);

    expect(response.status).toBe(404);
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const customer = await createUser();
    const order = await createOrder(customer);

    const response = await request(app).get(`/api/orders/${order._id}`);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
  });
});

describe('POST /api/orders', () => {
  test('creates the order for the signed-in user and returns it', async () => {
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
  });

  test('persists the submitted prices without recalculating them', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(orderPayload());

    const stored = await Order.findById(response.body.data._id);
    expect(stored.itemsPrice).toBeCloseTo(200, 2);
    expect(stored.taxPrice).toBeCloseTo(30, 2);
    expect(stored.shippingPrice).toBeCloseTo(0, 2);
    expect(stored.totalPrice).toBeCloseTo(230, 2);
  });

  test('stores the shipping address and payment method submitted at checkout', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(orderPayload());

    expect(response.body.data.shipping).toMatchObject({
      address: '1 Main St',
      city: 'Bellevue',
      postalCode: '98006',
      country: 'USA',
    });
    expect(response.body.data.payment.paymentMethod).toBe('paypal');
  });

  test('creates the order as unpaid and undelivered', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(orderPayload());

    expect(response.body.data.isPaid).toBe(false);
    expect(response.body.data.isDelivered).toBe(false);
  });

  test('responds 401 and stores nothing when the request is unauthenticated', async () => {
    const response = await request(app).post('/api/orders').send(orderPayload());

    expect(response.status).toBe(401);
    expect(await Order.countDocuments()).toBe(0);
  });
});

describe('PUT /api/orders/:id/pay', () => {
  const paymentResult = {
    payerID: 'PAYER-1',
    orderID: 'ORDER-1',
    paymentID: 'PAYMENT-1',
  };

  test('marks the order paid and records the payment result', async () => {
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
    expect(response.body.order.isPaid).toBe(true);
    expect(response.body.order.payment.paymentResult).toMatchObject(paymentResult);
  });

  test('stamps paidAt when the order is paid', async () => {
    const customer = await createUser();
    const order = await createOrder(customer);

    await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(paymentResult);

    const stored = await Order.findById(order._id);
    expect(stored.paidAt).toBeInstanceOf(Date);
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

  test('responds 404 and leaves the order unpaid when a different user tries to pay it', async () => {
    const owner = await createUser();
    const intruder = await createUser({ email: 'intruder@example.com' });
    const order = await createOrder(owner);

    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(intruder)}`)
      .send(paymentResult);

    expect(response.status).toBe(404);
    expect((await Order.findById(order._id)).isPaid).toBe(false);
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const customer = await createUser();
    const order = await createOrder(customer);

    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .send(paymentResult);

    expect(response.status).toBe(401);
  });
});
