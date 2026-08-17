import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import config from '../config';
import User from '../models/userModel';
import { getToken } from '../util';
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

const createUser = (overrides = {}) =>
  User.create({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'secret',
    isAdmin: false,
    ...overrides,
  });

describe('POST /api/users/signin', () => {
  test('returns the user with a token that carries the stored isAdmin claim', async () => {
    // Arrange
    await createUser({ email: 'admin@example.com', isAdmin: true });

    // Act
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'admin@example.com', password: 'secret' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ email: 'admin@example.com', isAdmin: true });
    expect(jwt.verify(response.body.token, config.JWT_SECRET)).toMatchObject({
      email: 'admin@example.com',
      isAdmin: true,
    });
  });

  test('responds 401 when the password is wrong', async () => {
    await createUser();

    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'ada@example.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid Email or Password.' });
  });

  test('responds 401 when the email is not registered', async () => {
    const response = await request(app)
      .post('/api/users/signin')
      .send({ email: 'nobody@example.com', password: 'secret' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Invalid Email or Password.' });
  });
});

describe('PUT /api/users/:id', () => {
  test('updates the profile of the signed-in user and returns a fresh token', async () => {
    // Arrange
    const user = await createUser();

    // Act
    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ name: 'Ada King', email: 'ada.king@example.com' });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Ada King', email: 'ada.king@example.com' });
    expect(jwt.verify(response.body.token, config.JWT_SECRET).email).toBe('ada.king@example.com');
  });

  test('responds 401 when the token does not own the account being updated', async () => {
    const victim = await createUser();
    const attacker = await createUser({ email: 'mallory@example.com' });

    const response = await request(app)
      .put(`/api/users/${victim._id}`)
      .set('Authorization', `Bearer ${getToken(attacker)}`)
      .send({ email: 'attacker@example.com', password: 'hijacked' });

    expect(response.status).toBe(401);
    const stored = await User.findById(victim._id);
    expect(stored.email).toBe('ada@example.com');
    expect(stored.password).toBe('secret');
  });

  test('responds 404 when the account does not exist', async () => {
    const user = await createUser();
    await User.deleteOne({ _id: user._id });

    const response = await request(app)
      .put(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${getToken(user)}`)
      .send({ name: 'Ghost' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'User Not Found' });
  });
});
