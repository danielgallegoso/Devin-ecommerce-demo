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
  createUser({ name: 'T-Mobile Admin', email: 'admin@example.com', isAdmin: true });

const productPayload = (overrides = {}) => ({
  name: 'Galaxy S24 Ultra',
  price: 1299.99,
  image: '/images/tmobile/galaxy-s24-ultra.svg',
  brand: 'Samsung',
  category: 'Phones',
  countInStock: 12,
  description: 'Flagship Android phone',
  rating: 4.8,
  numReviews: 214,
  ...overrides,
});

const createProduct = (overrides = {}) => Product.create(productPayload(overrides));

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
    expect(response.body.data).toMatchObject({ name: 'Galaxy S24 Ultra', countInStock: 12 });
    expect(await Product.countDocuments()).toBe(1);
  });

  test('responds 401 for a signed-in user who is not an admin', async () => {
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
    const response = await request(app).post('/api/products').send(productPayload());

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
    expect(await Product.countDocuments()).toBe(0);
  });
});

describe('PUT /api/products/:id', () => {
  test('updates the product for an admin', async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`)
      .send(productPayload({ price: 1099.99, countInStock: 5 }));

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product Updated');
    const stored = await Product.findById(product._id);
    expect(stored.price).toBeCloseTo(1099.99, 2);
    expect(stored.countInStock).toBe(5);
  });

  test('responds 401 for a non-admin and leaves the product unchanged', async () => {
    const customer = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(customer)}`)
      .send(productPayload({ price: 1 }));

    expect(response.status).toBe(401);
    const stored = await Product.findById(product._id);
    expect(stored.price).toBeCloseTo(1299.99, 2);
  });
});

describe('DELETE /api/products/:id', () => {
  test('deletes the product for an admin', async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Product Deleted' });
    expect(await Product.countDocuments()).toBe(0);
  });

  test('responds 401 for a non-admin and keeps the product', async () => {
    const customer = await createUser();
    const product = await createProduct();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(customer)}`);

    expect(response.status).toBe(401);
    expect(await Product.countDocuments()).toBe(1);
  });

  test('responds 404 when the product does not exist', async () => {
    const admin = await createAdmin();
    const product = await createProduct();
    await Product.deleteOne({ _id: product._id });

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(404);
  });
});
