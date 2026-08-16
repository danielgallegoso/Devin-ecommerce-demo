import request from 'supertest';
import app from '../app';
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

describe('POST /api/users/register', () => {
  test('creates the user and returns an authentication token', async () => {
    // Arrange
    const payload = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'compiler',
    };

    // Act
    const response = await request(app).post('/api/users/register').send(payload);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      isAdmin: false,
    });
    expect(typeof response.body.token).toBe('string');
    expect(await User.countDocuments()).toBe(1);
  });
});

describe('POST /api/users/signin', () => {
  test('returns the user with a token for matching credentials', async () => {
    await createUser();

    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'ada@example.com', password: 'secret' });

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('ada@example.com');
    expect(response.body.token).toBeDefined();
  });

  test('responds 401 when the password does not match', async () => {
    await createUser();

    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'ada@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid Email or Password.' });
  });

  test('responds 401 when the email is unknown', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'nobody@example.com', password: 'secret' });

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/users/:id', () => {
  test('updates the supplied fields for an authenticated user', async () => {
    // Arrange
    const user = await createUser();
    const token = getToken(user);

    // Act
    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ada L.', email: 'ada.l@example.com' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Ada L.', email: 'ada.l@example.com' });
  });

  test('keeps existing values for fields omitted from the request', async () => {
    const user = await createUser();

    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ name: 'Ada L.' });

    expect(response.body.email).toBe('ada@example.com');
  });

  test('responds 401 when no token is supplied', async () => {
    const user = await createUser();

    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .send({ name: 'Hacker' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Token is not supplied.' });
  });

  test('responds 404 when the user does not exist', async () => {
    const user = await createUser();
    const missingId = '5f9d88b3b3f1c40017a1b2c3';

    const response = await request(app)
      .put(`/api/users/${missingId}`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ name: 'Ghost' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User Not Found' });
  });
});
