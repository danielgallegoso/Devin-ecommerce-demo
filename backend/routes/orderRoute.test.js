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
