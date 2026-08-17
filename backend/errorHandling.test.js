import request from 'supertest';
import app from './app';
import Product from './models/productModel';
import User from './models/userModel';
import { getToken } from './util';
import { connectTestDb, clearTestDb, disconnectTestDb } from './testUtils/db';

beforeAll(connectTestDb);
afterEach(async () => {
  jest.restoreAllMocks();
  await clearTestDb();
});
afterAll(disconnectTestDb);

const createAdmin = () =>
  User.create({
    name: 'T-Mobile Admin',
    email: 'admin@example.com',
    password: 'secret',
    isAdmin: true,
  });

const createProduct = (overrides = {}) =>
  Product.create({
    name: 'Phone A',
    image: '/images/a.jpg',
    brand: 'T-Mobile',
    price: 100,
    category: 'Phones',
    countInStock: 5,
    description: 'A phone',
    ...overrides,
  });

const MISSING_ID = '5f8d0d55b54764421b7156da';

describe('unknown API routes', () => {
  test('responds 404 with a JSON message instead of the frontend bundle', async () => {
    // Arrange / Act
    const response = await request(app).get('/api/does-not-exist');

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Not Found: GET /api/does-not-exist',
    });
  });
});

describe('GET /api/products/:id', () => {
  test('responds 400 when the id is not a valid object id', async () => {
    const response = await request(app).get('/api/products/not-an-object-id');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid _id: not-an-object-id');
  });

  test('responds 404 when the product does not exist', async () => {
    const response = await request(app).get(`/api/products/${MISSING_ID}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Product Not Found.' });
  });
});

describe('GET /api/products', () => {
  test('responds 500 with a JSON message when the database query fails', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Product, 'find').mockImplementation(() => {
      throw new Error('database is down');
    });

    // Act
    const response = await request(app).get('/api/products');

    // Assert
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Internal Server Error' });
  });
});

describe('PUT /api/products/:id', () => {
  test('responds 404 when the product to update does not exist', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .put(`/api/products/${MISSING_ID}`)
      .set('Authorization', `Bearer ${getToken(admin)}`)
      .send({ name: 'Renamed' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Product Not Found.' });
  });

  test('responds 400 when the update violates the product schema', async () => {
    const admin = await createAdmin();
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${getToken(admin)}`)
      .send({ ...product.toObject(), price: 'free' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/price/);
  });
});

describe('DELETE /api/products/:id', () => {
  test('responds 404 when the product to delete does not exist', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .delete(`/api/products/${MISSING_ID}`)
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Product Not Found.' });
  });
});

describe('POST /api/uploads', () => {
  test('responds 400 when no image file is attached', async () => {
    const response = await request(app).post('/api/uploads');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'No image file was uploaded.' });
  });
});

describe('GET /api/users/createadmin', () => {
  test('responds 409 when the admin user already exists', async () => {
    await createAdmin();

    const response = await request(app).get('/api/users/createadmin');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Admin user already exists.' });
  });
});

describe('GET /api/orders/:id', () => {
  test('responds 400 when the order id is malformed', async () => {
    const admin = await createAdmin();

    const response = await request(app)
      .get('/api/orders/not-a-valid-id')
      .set('Authorization', `Bearer ${getToken(admin)}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid _id: not-a-valid-id');
  });
});
