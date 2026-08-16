import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app';
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

const createAdmin = () =>
  createUser({ email: 'admin@example.com', isAdmin: true });

const productPayload = (overrides = {}) => ({
  name: 'Galaxy S24',
  price: 799.99,
  image: '/images/galaxy.jpg',
  brand: 'Samsung',
  category: 'Phones',
  countInStock: 5,
  description: 'A phone',
  rating: 4.5,
  numReviews: 3,
  ...overrides,
});

const createProduct = (overrides = {}) =>
  Product.create(productPayload(overrides));

describe('POST /api/products', () => {
  test('creates the product for an admin', async () => {
    // Arrange
    const admin = await createAdmin();

    // Act
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${getToken(admin)}`)
      .send(productPayload());

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('New Product Created');
    expect(response.body.data).toMatchObject({
      name: 'Galaxy S24',
      countInStock: 5,
    });
  });

  test('responds 401 and stores nothing for a signed-in non-admin', async () => {
    const customer = await createUser();

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(productPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Admin Token is not valid.' });
    expect(await Product.countDocuments()).toBe(0);
  });

  test('responds 401 when the request is unauthenticated', async () => {
    const response = await request(app)
      .post('/api/products')
      .send(productPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
  });
});

describe('PUT /api/products/:id', () => {
  test('updates the product fields for an admin', async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`)
      .send(productPayload({ name: 'Galaxy S24 Ultra', price: 1299.99, countInStock: 2 }));

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product Updated');
    const stored = await Product.findById(product._id);
    expect(stored.name).toBe('Galaxy S24 Ultra');
    expect(stored.price).toBeCloseTo(1299.99, 2);
    expect(stored.countInStock).toBe(2);
  });

  test('responds 401 and leaves the product unchanged for a non-admin', async () => {
    const customer = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(productPayload({ name: 'Hacked' }));

    expect(response.status).toBe(401);
    expect((await Product.findById(product._id)).name).toBe('Galaxy S24');
  });

  test('responds 500 when the product does not exist', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .put(`/api/products/${mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${getToken(admin)}`)
      .send(productPayload());

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/products/:id', () => {
  test('removes the product for an admin', async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Product Deleted' });
    expect(await Product.countDocuments()).toBe(0);
  });

  test('responds 401 and keeps the product for a non-admin', async () => {
    const customer = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(customer)}`);

    expect(response.status).toBe(401);
    expect(await Product.countDocuments()).toBe(1);
  });
});

describe('GET /api/products/:id', () => {
  test('returns the requested product without authentication', async () => {
    const product = await createProduct();

    const response = await request(app).get(`/api/products/${product._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Galaxy S24', brand: 'Samsung' });
  });

  test('responds 404 when the product does not exist', async () => {
    const response = await request(app).get(
      `/api/products/${mongoose.Types.ObjectId()}`
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Product Not Found.' });
  });
});
