import mongoose from 'mongoose';
import request from 'supertest';
import Order from '../models/orderModel';
// Registers the User schema so `GET /api/orders`'s populate('user') can resolve.
import '../models/userModel';
import { getToken } from '../util';
import { createTestApp } from '../testUtils/testApp';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../testUtils/db';
import orderRoute from './orderRoute';

const app = createTestApp('/api/orders', orderRoute);

const shopper = {
  _id: new mongoose.Types.ObjectId().toString(),
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  isAdmin: false,
};

const admin = {
  _id: new mongoose.Types.ObjectId().toString(),
  name: 'T-Mobile Admin',
  email: 'admin@example.com',
  isAdmin: true,
};

const authHeader = (user) => `Bearer ${getToken(user)}`;

const orderPayload = () => ({
  orderItems: [
    {
      name: 'T-Mobile Phone',
      qty: 2,
      image: '/images/phone.jpg',
      price: '199.99',
      product: new mongoose.Types.ObjectId().toString(),
    },
  ],
  shipping: {
    address: '1 Main St',
    city: 'Bellevue',
    postalCode: '98006',
    country: 'USA',
  },
  payment: { paymentMethod: 'paypal' },
  itemsPrice: 399.98,
  taxPrice: 59.997,
  shippingPrice: 0,
  totalPrice: 459.977,
});

const seedOrder = (overrides = {}) => {
  const order = new Order({ ...orderPayload(), user: shopper._id, ...overrides });
  return order.save();
};

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

describe('POST /api/orders', () => {
  test('creates an order owned by the authenticated user', async () => {
    // Arrange
    const payload = orderPayload();

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader(shopper))
      .send(payload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('New Order Created');
    const persisted = await Order.findById(response.body.data._id);
    expect(persisted.user.toString()).toBe(shopper._id);
    expect(persisted.totalPrice).toBeCloseTo(459.977, 3);
    expect(persisted.orderItems).toHaveLength(1);
    expect(persisted.isPaid).toBe(false);
    expect(persisted.isDelivered).toBe(false);
  });

  test('ignores a user id supplied in the body and uses the token identity', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader(shopper))
      .send({ ...orderPayload(), user: admin._id });

    expect(response.body.data.user).toBe(shopper._id);
  });

  test('responds 401 when no token is supplied', async () => {
    const response = await request(app).post('/api/orders').send(orderPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
    expect(await Order.countDocuments({})).toBe(0);
  });
});

describe('GET /api/orders/mine', () => {
  test('returns only the orders belonging to the authenticated user', async () => {
    // Arrange
    await seedOrder();
    await seedOrder({ user: admin._id });

    // Act
    const response = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', authHeader(shopper));

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user).toBe(shopper._id);
  });

  test('returns an empty list when the user has no orders', async () => {
    await seedOrder({ user: admin._id });

    const response = await request(app)
      .get('/api/orders/mine')
      .set('Authorization', authHeader(shopper));

    expect(response.body).toEqual([]);
  });
});

describe('GET /api/orders', () => {
  // Current behavior: the route is guarded by isAuth only, so any signed-in
  // shopper can list every order in the store. See issue tracking the missing
  // isAdmin guard.
  test('returns all orders to any authenticated user, including non-admins', async () => {
    await seedOrder();
    await seedOrder({ user: admin._id });

    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', authHeader(shopper));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe('GET /api/orders/:id', () => {
  test('returns the requested order', async () => {
    const order = await seedOrder();

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', authHeader(shopper));

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(order._id.toString());
  });

  test('responds 404 when the order does not exist', async () => {
    const missingId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/orders/${missingId}`)
      .set('Authorization', authHeader(shopper));

    expect(response.status).toBe(404);
    expect(response.text).toBe('Order Not Found.');
  });

  // Current behavior: ownership is not checked, so any authenticated user can
  // read another customer's order by id.
  test('returns another user order to an unrelated authenticated user', async () => {
    const order = await seedOrder({ user: admin._id });

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', authHeader(shopper));

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(order._id.toString());
  });
});

describe('DELETE /api/orders/:id', () => {
  test('deletes the order for an admin', async () => {
    // Arrange
    const order = await seedOrder();

    // Act
    const response = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', authHeader(admin));

    // Assert
    expect(response.status).toBe(200);
    expect(await Order.findById(order._id)).toBeNull();
  });

  test('responds 401 and keeps the order when the caller is not an admin', async () => {
    const order = await seedOrder();

    const response = await request(app)
      .delete(`/api/orders/${order._id}`)
      .set('Authorization', authHeader(shopper));

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Admin Token is not valid.' });
    expect(await Order.findById(order._id)).not.toBeNull();
  });
});

describe('PUT /api/orders/:id/pay', () => {
  test('marks the order paid and records the paypal payment result', async () => {
    // Arrange
    const order = await seedOrder();

    // Act
    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', authHeader(shopper))
      .send({ payerID: 'payer-1', orderID: 'order-1', paymentID: 'payment-1' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Order Paid.');
    const paidOrder = await Order.findById(order._id);
    expect(paidOrder.isPaid).toBe(true);
    expect(paidOrder.paidAt).toBeInstanceOf(Date);
    expect(paidOrder.payment.paymentMethod).toBe('paypal');
  });

  test('responds 404 when paying an order that does not exist', async () => {
    const response = await request(app)
      .put(`/api/orders/${new mongoose.Types.ObjectId()}/pay`)
      .set('Authorization', authHeader(shopper))
      .send({ payerID: 'payer-1' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Order not found.' });
  });
});
