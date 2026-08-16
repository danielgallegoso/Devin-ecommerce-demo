import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from './config';
import { getToken, isAuth, isAdmin } from './util';

const buildUser = (overrides = {}) => ({
  _id: mongoose.Types.ObjectId(),
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  isAdmin: false,
  ...overrides,
});

const buildResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('getToken', () => {
  test('signs a verifiable token carrying the user identity and admin flag', () => {
    // Arrange
    const user = buildUser({ isAdmin: true });

    // Act
    const token = getToken(user);

    // Assert
    expect(jwt.verify(token, config.JWT_SECRET)).toMatchObject({
      _id: String(user._id),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      isAdmin: true,
    });
  });

  test('produces a token that cannot be verified with a different secret', () => {
    const token = getToken(buildUser());

    expect(() => jwt.verify(token, 'a-different-secret')).toThrow(
      'invalid signature'
    );
  });
});

describe('isAuth', () => {
  test('attaches the decoded user to the request and calls next for a valid token', () => {
    // Arrange
    const user = buildUser();
    const req = { headers: { authorization: `Bearer ${getToken(user)}` } };
    const res = buildResponse();
    const next = jest.fn();

    // Act
    isAuth(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ email: 'ada@example.com', isAdmin: false });
  });

  test('responds 401 when no token is supplied', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Token is not supplied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the token signature has been tampered with', () => {
    const token = `${getToken(buildUser())}tampered`;
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the token has expired', () => {
    const expired = jwt.sign({ _id: 'abc' }, config.JWT_SECRET, {
      expiresIn: '-1s',
    });
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: { authorization: `Bearer ${expired}` } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid Token' });
  });
});

describe('isAdmin', () => {
  test('calls next when the authenticated user is an admin', () => {
    const next = jest.fn();

    isAdmin({ user: { isAdmin: true } }, buildResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('responds 401 when the authenticated user is not an admin', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAdmin({ user: { isAdmin: false } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Admin Token is not valid.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the request carries no authenticated user', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAdmin({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
