import jwt from 'jsonwebtoken';
import config from './config';
import { getToken, isAuth, isAdmin } from './util';

const buildResponse = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const user = {
  _id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  isAdmin: false,
};

describe('getToken', () => {
  test('signs a token containing the user identity claims', () => {
    // Arrange
    const adminUser = { ...user, isAdmin: true };

    // Act
    const token = getToken(adminUser);

    // Assert
    const decoded = jwt.verify(token, config.JWT_SECRET);
    expect(decoded._id).toBe('user-1');
    expect(decoded.name).toBe('Ada Lovelace');
    expect(decoded.email).toBe('ada@example.com');
    expect(decoded.isAdmin).toBe(true);
  });

  test('sets a 48 hour expiry on the token', () => {
    const decoded = jwt.verify(getToken(user), config.JWT_SECRET);

    expect(decoded.exp - decoded.iat).toBe(48 * 60 * 60);
  });

  test('produces a token that fails verification under a different secret', () => {
    expect(() => jwt.verify(getToken(user), 'a-different-secret')).toThrow(
      'invalid signature',
    );
  });
});

describe('isAuth', () => {
  test('attaches the decoded user and calls next for a valid Bearer token', () => {
    // Arrange
    const req = { headers: { authorization: `Bearer ${getToken(user)}` } };
    const res = buildResponse();
    const next = jest.fn();

    // Act
    isAuth(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.email).toBe('ada@example.com');
    expect(res.statusCode).toBeNull();
  });

  test('responds 401 when the authorization header is missing', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: {} }, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Token is not supplied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the token signature is invalid', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: { authorization: 'Bearer not-a-real-token' } }, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the token is expired', () => {
    const expiredToken = jwt.sign({ _id: 'user-1' }, config.JWT_SECRET, {
      expiresIn: '-1s',
    });
    const res = buildResponse();

    isAuth({ headers: { authorization: `Bearer ${expiredToken}` } }, res, jest.fn());

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid Token' });
  });

  test('responds 401 when the scheme is not Bearer, because the first 7 characters are always dropped', () => {
    const res = buildResponse();

    isAuth({ headers: { authorization: getToken(user) } }, res, jest.fn());

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Invalid Token' });
  });
});

describe('isAdmin', () => {
  test('calls next when the request user carries the admin claim', () => {
    // Arrange
    const req = { user: { ...user, isAdmin: true } };
    const res = buildResponse();
    const next = jest.fn();

    // Act
    isAdmin(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  test('responds 401 when the request user is not an admin', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAdmin({ user }, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Admin Token is not valid.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when no user was attached to the request', () => {
    const res = buildResponse();

    isAdmin({}, res, jest.fn());

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: 'Admin Token is not valid.' });
  });
});
