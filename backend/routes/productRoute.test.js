import request from 'supertest';
import app from '../app';
import Product from '../models/productModel';
import { getToken } from '../util';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../testUtils/db';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const adminToken = () =>
  getToken({
    _id: '5f9d88b3b3f1c40017a1b2c3',
    name: 'Admin',
    email: 'admin@example.com',
    isAdmin: true,
  });

const customerToken = () =>
  getToken({
    _id: '5f9d88b3b3f1c40017a1b2c4',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    isAdmin: false,
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
    rating: 0,
    numReviews: 0,
    reviews: [],
    ...overrides,
  });

describe('GET /api/products', () => {
  test('returns every product when no filters are supplied', async () => {
    // Arrange
    await createProduct({ name: 'Phone A' });
    await createProduct({ name: 'Phone B' });

    // Act
    const response = await request(app).get('/api/products');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('filters products by exact category', async () => {
    await createProduct({ name: 'Phone A', category: 'Phones' });
    await createProduct({ name: 'Tablet A', category: 'Tablets' });

    const response = await request(app).get('/api/products?category=Tablets');

    expect(response.body.map((p) => p.name)).toEqual(['Tablet A']);
  });

  test('matches the search keyword case-insensitively as a substring', async () => {
    await createProduct({ name: 'Galaxy Ultra' });
    await createProduct({ name: 'Pixel Pro' });

    const response = await request(app).get('/api/products?searchKeyword=galaxy');

    expect(response.body.map((p) => p.name)).toEqual(['Galaxy Ultra']);
  });

  test('sorts by ascending price when sortOrder is lowest', async () => {
    await createProduct({ name: 'Cheap', price: 10 });
    await createProduct({ name: 'Pricey', price: 900 });

    const response = await request(app).get('/api/products?sortOrder=lowest');

    expect(response.body.map((p) => p.name)).toEqual(['Cheap', 'Pricey']);
  });

  test('sorts by descending price for any other sortOrder value', async () => {
    await createProduct({ name: 'Cheap', price: 10 });
    await createProduct({ name: 'Pricey', price: 900 });

    const response = await request(app).get('/api/products?sortOrder=highest');

    expect(response.body.map((p) => p.name)).toEqual(['Pricey', 'Cheap']);
  });

  test('returns an empty list when nothing matches the filters', async () => {
    await createProduct({ category: 'Phones' });

    const response = await request(app).get('/api/products?category=Watches');

    expect(response.body).toEqual([]);
  });
});

describe('GET /api/products/:id', () => {
  test('returns the requested product', async () => {
    const product = await createProduct();

    const response = await request(app).get(`/api/products/${product._id}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Phone A');
  });

  test('responds 404 when the product does not exist', async () => {
    const response = await request(app).get('/api/products/5f9d88b3b3f1c40017a1b2ff');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Product Not Found.' });
  });
});

describe('GET /api/products/seed', () => {
  test('replaces the catalogue with the seed data outside production', async () => {
    // Arrange
    await createProduct({ name: 'Stale product' });

    // Act
    const response = await request(app).get('/api/products/seed');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.createdProducts.length).toBeGreaterThan(0);
    expect(await Product.countDocuments({ name: 'Stale product' })).toBe(0);
  });

  test('responds 404 in production so the catalogue cannot be wiped', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    await createProduct({ name: 'Live product' });

    const response = await request(app).get('/api/products/seed');

    process.env.NODE_ENV = originalNodeEnv;
    expect(response.status).toBe(404);
    expect(await Product.countDocuments({ name: 'Live product' })).toBe(1);
  });
});

describe('POST /api/products/:id/reviews', () => {
  test('stores the review and recalculates the average rating', async () => {
    // Arrange
    const product = await createProduct();

    // Act
    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ name: 'Ada', rating: 4, comment: 'Solid phone' });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Review saved successfully.');
    const updated = await Product.findById(product._id);
    expect(updated.numReviews).toBe(1);
    expect(updated.rating).toBe(4);
  });

  test('averages the ratings across all reviews', async () => {
    const product = await createProduct();
    const token = `Bearer ${customerToken()}`;

    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', token)
      .send({ name: 'Ada', rating: 5, comment: 'Great' });
    await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .set('Authorization', token)
      .send({ name: 'Grace', rating: 2, comment: 'Meh' });

    const updated = await Product.findById(product._id);
    expect(updated.numReviews).toBe(2);
    expect(updated.rating).toBeCloseTo(3.5, 5);
  });

  test('responds 401 when the reviewer is not authenticated', async () => {
    const product = await createProduct();

    const response = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .send({ name: 'Anon', rating: 5, comment: 'Nice' });

    expect(response.status).toBe(401);
  });

  test('responds 404 when reviewing a product that does not exist', async () => {
    const response = await request(app)
      .post('/api/products/5f9d88b3b3f1c40017a1b2ff/reviews')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ name: 'Ada', rating: 5, comment: 'Nice' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Product Not Found' });
  });
});

describe('POST /api/products', () => {
  test('creates a product for an admin', async () => {
    // Arrange
    const payload = {
      name: 'New Phone',
      price: 799,
      image: '/images/new.jpg',
      brand: 'T-Mobile',
      category: 'Phones',
      countInStock: 3,
      description: 'Brand new',
      rating: 0,
      numReviews: 0,
    };

    // Act
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send(payload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('New Product Created');
    expect(await Product.countDocuments({ name: 'New Phone' })).toBe(1);
  });

  test('responds 401 when a non-admin attempts to create a product', async () => {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ name: 'Sneaky' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Admin Token is not valid.' });
    expect(await Product.countDocuments()).toBe(0);
  });
});

describe('PUT /api/products/:id', () => {
  test('updates the product fields for an admin', async () => {
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        name: 'Renamed Phone',
        price: 250,
        image: '/images/a.jpg',
        brand: 'T-Mobile',
        category: 'Phones',
        countInStock: 9,
        description: 'Updated',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Product Updated');
    const updated = await Product.findById(product._id);
    expect(updated.name).toBe('Renamed Phone');
    expect(updated.countInStock).toBe(9);
  });

  test('responds 401 when a non-admin attempts an update', async () => {
    const product = await createProduct();

    const response = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${customerToken()}`)
      .send({ name: 'Sneaky' });

    expect(response.status).toBe(401);
  });

  test('responds 500 when the product to update does not exist', async () => {
    const response = await request(app)
      .put('/api/products/5f9d88b3b3f1c40017a1b2ff')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Ghost' });

    expect(response.status).toBe(500);
  });
});

describe('DELETE /api/products/:id', () => {
  test('removes the product for an admin', async () => {
    const product = await createProduct();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Product Deleted' });
    expect(await Product.countDocuments()).toBe(0);
  });

  test('responds 401 when a non-admin attempts a deletion', async () => {
    const product = await createProduct();

    const response = await request(app)
      .delete(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${customerToken()}`);

    expect(response.status).toBe(401);
    expect(await Product.countDocuments()).toBe(1);
  });
});
