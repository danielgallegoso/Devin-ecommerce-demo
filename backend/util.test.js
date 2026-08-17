import jwt from 'jsonwebtoken';
import config from './config';
import { getToken, isAuth, isAdmin } from './util';

const buildUser = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
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
  test('signs the user identity and admin flag into the token', () => {
    // Arrange
    const user = buildUser({ isAdmin: true });

    // Act
    const token = getToken(user);

    // Assert
    expect(jwt.verify(token, config.JWT_SECRET)).toMatchObject({
      _id: user._id,
      email: 'ada@example.com',
      isAdmin: true,
    });
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
    expect(req.user).toMatchObject({ _id: user._id, email: 'ada@example.com' });
  });

  test('responds 401 with Invalid Token when the token is signed with another secret', () => {
    const forged = jwt.sign(buildUser({ isAdmin: true }), 'not-the-real-secret');
    const req = { headers: { authorization: `Bearer ${forged}` } };
    const res = buildResponse();
    const next = jest.fn();

    isAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 with Invalid Token when the token has expired', () => {
    const expired = jwt.sign(buildUser(), config.JWT_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = buildResponse();
    const next = jest.fn();

    isAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when no authorization header is supplied', () => {
    const req = { headers: {} };
    const res = buildResponse();
    const next = jest.fn();

    isAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Token is not supplied.' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('isAdmin', () => {
  test('calls next when the request user has the admin flag', () => {
    const req = { user: buildUser({ isAdmin: true }) };
    const res = buildResponse();
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('responds 401 when the request user is not an admin', () => {
    const req = { user: buildUser() };
    const res = buildResponse();
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Admin Token is not valid.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the request has no user at all', () => {
    const req = {};
    const res = buildResponse();
    const next = jest.fn();

    isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Admin Token is not valid.' });
    expect(next).not.toHaveBeenCalled();
  });
});
