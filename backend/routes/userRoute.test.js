import request from 'supertest';
import app from '../app';
import User from '../models/userModel';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../testUtils/db';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(disconnectTestDb);

const registerPayload = (overrides = {}) => ({
  name: 'Grace Hopper',
  email: 'grace@example.com',
  password: 'compiler',
  ...overrides,
});

describe('POST /api/users/register', () => {
  test('creates the user and returns an authentication token', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send(registerPayload());

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      isAdmin: false,
    });
    expect(typeof response.body.token).toBe('string');
  });

  test('responds 409 when the email is already registered', async () => {
    await request(app).post('/api/users/register').send(registerPayload());

    const response = await request(app)
      .post('/api/users/register')
      .send(registerPayload({ name: 'Impostor' }));

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'Email is already registered.' });
    expect(await User.countDocuments()).toBe(1);
  });

  test('responds 400 when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({ email: 'nameless@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid User Data.' });
    expect(await User.countDocuments()).toBe(0);
  });
});
