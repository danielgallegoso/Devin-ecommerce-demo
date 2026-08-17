import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
import Order from '../models/orderModel';
import Product from '../models/productModel';
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

const createProduct = (overrides = {}) =>
  Product.create({
    name: 'Phone A',
    image: '/images/a.jpg',
    brand: 'T-Mobile',
    price: 200,
    category: 'Phones',
    countInStock: 5,
    description: 'A phone',
    rating: 0,
    numReviews: 0,
    ...overrides,
  });

const createOrder = (user, product) =>
  Order.create({
    user: user._id,
    orderItems: [
      {
        name: product.name,
        qty: 1,
        image: product.image,
        price: String(product.price),
        product: product._id,
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

describe('User password storage', () => {
  test('stores a bcrypt hash instead of the plaintext password', async () => {
    // Arrange
    const password = 'compiler';

    // Act
    const user = await createUser({ password });

    // Assert
    expect(user.password).not.toBe(password);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });
});

describe('POST /api/users/signin', () => {
  test('signs in a registered user with the correct password', async () => {
    // Arrange
    await createUser({ password: 'compiler' });

    // Act
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'ada@example.com', password: 'compiler' });

    // Assert
    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
  });

  test('responds 401 for a wrong password', async () => {
    await createUser({ password: 'compiler' });

    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'ada@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid Email or Password.' });
  });

  test('rejects a NoSQL operator payload instead of authenticating', async () => {
    await createUser({ password: 'compiler' });

    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid Email or Password.' });
  });
});

describe('PUT /api/users/:id', () => {
  test('responds 403 when updating another user account', async () => {
    // Arrange
    const attacker = await createUser();
    const victim = await createUser({ email: 'grace@example.com' });

    // Act
    const response = await request(app)
      .put(`/api/users/${victim._id}`)
      .set('Authorization', `Bearer ${getToken(attacker)}`)
      .send({ password: 'hijacked' });

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Not authorized.' });
  });

  test('lets a user update their own profile', async () => {
    const user = await createUser();

    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ name: 'Ada L' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Ada L' });
  });
});

describe('GET /api/orders/:id', () => {
  test("responds 403 when reading another user's order", async () => {
    // Arrange
    const owner = await createUser();
    const attacker = await createUser({ email: 'eve@example.com' });
    const product = await createProduct();
    const order = await createOrder(owner, product);

    // Act
    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(attacker)}`);

    // Assert
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: 'Not authorized.' });
  });

  test('returns the order to its owner', async () => {
    const owner = await createUser();
    const product = await createProduct();
    const order = await createOrder(owner, product);

    const response = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${getToken(owner)}`);

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(String(order._id));
  });

  test('responds 404 for an unknown order id', async () => {
    const user = await createUser();

    const response = await request(app)
      .get(`/api/orders/${mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${getToken(user)}`);

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/orders/:id/pay', () => {
  test("responds 403 when paying another user's order", async () => {
    const owner = await createUser();
    const attacker = await createUser({ email: 'eve@example.com' });
    const product = await createProduct();
    const order = await createOrder(owner, product);

    const response = await request(app)
      .put(`/api/orders/${order._id}/pay`)
      .set('Authorization', `Bearer ${getToken(attacker)}`)
      .send({ payerID: 'p1', orderID: 'o1', paymentID: 'pay1' });

    expect(response.status).toBe(403);
  });
});

describe('POST /api/orders', () => {
  test('ignores client supplied prices and recomputes them from the catalog', async () => {
    // Arrange
    const user = await createUser();
    const product = await createProduct({ price: 200 });

    // Act
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({
        orderItems: [{ product: product._id, qty: 2, price: '0.01' }],
        shipping: {
          address: '1 Main St',
          city: 'Bellevue',
          postalCode: '98006',
          country: 'USA',
        },
        payment: { paymentMethod: 'paypal' },
        itemsPrice: 0.02,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: 0.02,
      });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.itemsPrice).toBe(400);
    expect(response.body.data.totalPrice).toBeCloseTo(460, 2);
  });

  test('responds 400 when an order item references an unknown product', async () => {
    const user = await createUser();

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({
        orderItems: [{ product: mongoose.Types.ObjectId(), qty: 1 }],
        shipping: {
          address: '1 Main St',
          city: 'Bellevue',
          postalCode: '98006',
          country: 'USA',
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid Order Items.' });
  });
});

describe('POST /api/uploads', () => {
  test('responds 401 when the request is unauthenticated', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .attach('image', Buffer.from('fake'), 'evil.jpg');

    expect(response.status).toBe(401);
  });

  test('responds 401 for a signed-in user who is not an admin', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .attach('image', Buffer.from('fake'), 'evil.jpg');

    expect(response.status).toBe(401);
  });
});

describe('POST /api/products/:id/reviews', () => {
  test('uses the authenticated user name rather than the client supplied name', async () => {
    // Arrange
    const user = await createUser();
    const product = await createProduct();

    // Act
    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ name: 'T-Mobile Support', rating: 5, comment: 'Great phone' });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Ada Lovelace');
  });

  test('responds 400 for a rating outside 1-5', async () => {
    const user = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ rating: 99, comment: 'Great phone' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid Review Data.' });
  });
});

describe('GET /api/products', () => {
  test('treats a regex metacharacter search keyword as a literal string', async () => {
    // Arrange
    await createProduct({ name: 'Phone A' });

    // Act
    const response = await request(app).get('/api/products?searchKeyword=.*');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});
