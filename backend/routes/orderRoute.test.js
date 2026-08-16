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

const createOrder = (user, overrides = {}) =>
  Order.create({ ...orderPayload(), user: user._id, ...overrides });

describe('POST /api/orders', () => {
  test('creates an order owned by the authenticated user', async () => {
    // Arrange
    const user = await createUser();
    const payload = orderPayload();

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send(payload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('New Order Created');
    expect(response.body.data.totalPrice).toBe(230);
    expect(response.body.data.user).toBe(String(user._id));
  });

  test('marks a newly created order as unpaid and undelivered', async () => {
    const user = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send(orderPayload());

    expect(response.body.data.isPaid).toBe(false);
    expect(response.body.data.isDelivered).toBe(false);
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const response = await request(app).post('/api/orders').send(orderPayload());

    expect(response.status).toBe(401);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('stores the wireless plan chosen for a phone and totals it monthly', async () => {
    // Arrange
    const user = await createUser();
    const payload = orderPayload();
    payload.orderItems[0].plan = { id: 'go5g-plus', name: 'Go5G Plus', monthlyPrice: 90 };

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send(payload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.orderItems[0].plan).toEqual({
      id: 'go5g-plus',
      name: 'Go5G Plus',
      monthlyPrice: 90,
    });
    expect(response.body.data.monthlyPlanPrice).toBe(180);
  });

  test('adds up the plans across every line of a multi-item order', async () => {
    const user = await createUser();
    const payload = orderPayload();
    payload.orderItems[0].plan = { id: 'go5g', name: 'Go5G', monthlyPrice: 75 };
    payload.orderItems.push({
      name: 'Phone B',
      qty: 1,
      image: '/images/b.jpg',
      price: '200',
      product: mongoose.Types.ObjectId(),
      plan: { id: 'go5g-next', name: 'Go5G Next', monthlyPrice: 100 },
    });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send(payload);

    expect(response.body.data.monthlyPlanPrice).toBe(250);
  });

  test('records no monthly plan charge for a device-only order', async () => {
    const user = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send(orderPayload());

    expect(response.body.data.monthlyPlanPrice).toBe(0);
    expect(response.body.data.orderItems[0].plan).toBeNull();
  });

  test('recomputes the monthly plan charge instead of trusting the client', async () => {
    const user = await createUser();
    const payload = orderPayload();
    payload.orderItems[0].plan = { id: 'go5g', name: 'Go5G', monthlyPrice: 75 };
    payload.monthlyPlanPrice = 0;

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send(payload);

    expect(response.body.data.monthlyPlanPrice).toBe(150);
  });
});

describe('GET /api/orders/mine', () => {
  test('returns only the orders belonging to the authenticated user', async () => {
    // Arrange
    const ada = await createUser();
    const grace = await createUser({ email: 'grace@example.com', name: 'Grace' });
    await createOrder(ada);
    await createOrder(grace, { totalPrice: 999 });

    // Act
    const response = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', `Bearer ${getToken(ada)}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user).toBe(String(ada._id));
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const response = await request(app).get('/api/orders/mine');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  test('returns the requested order for an authenticated user', async () => {
    const user = await createUser();
    const order = await createOrder(user);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(user)}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(String(order._id));
  });

  test('responds 404 when the order does not exist', async () => {
    const user = await createUser();

    const response = await request(app)
      .get('/api/orders/5f9d88b3b3f1c40017a1b2ff')
      .set('Authorization', `Bearer ${getToken(user)}`);

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/orders/:id/pay', () => {
  test('marks the order as paid and records the PayPal payment result', async () => {
    // Arrange
    const user = await createUser();
    const order = await createOrder(user);

    // Act
    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ payerID: 'payer-1', orderID: 'order-1', paymentID: 'payment-1' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Order Paid.');
    const paid = await Order.findById(order._id);
    expect(paid.isPaid).toBe(true);
    expect(paid.paidAt).toBeInstanceOf(Date);
    expect(paid.payment.paymentMethod).toBe('paypal');
  });

  test('responds 404 when paying an order that does not exist', async () => {
    const user = await createUser();

    const response = await request(app)
      .put('/api/orders/5f9d88b3b3f1c40017a1b2ff/pay')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ payerID: 'payer-1' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Order not found.' });
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const user = await createUser();
    const order = await createOrder(user);

    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .send({ payerID: 'payer-1' });

    expect(response.status).toBe(401);
    expect((await Order.findById(order._id)).isPaid).toBe(false);
  });
});

describe('GET /api/orders', () => {
  test('lists all orders with their user populated for an admin', async () => {
    const admin = await createUser({ email: 'admin@example.com', isAdmin: true });
    await createOrder(admin);

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.email).toBe('admin@example.com');
  });
});

describe('DELETE /api/orders/:id', () => {
  test('deletes the order for an admin', async () => {
    const admin = await createUser({ email: 'admin@example.com', isAdmin: true });
    const order = await createOrder(admin);

    const response = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('responds 401 when a non-admin attempts a deletion', async () => {
    const user = await createUser();
    const order = await createOrder(user);

    const response = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(user)}`);

    expect(response.status).toBe(401);
    expect(await Order.countDocuments()).toBe(1);
  });
});
