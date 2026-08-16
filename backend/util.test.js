import jwt from 'jsonwebtoken';
import { getToken, isAuth, isAdmin, calculateMonthlyPlanTotal } from './util';
import config from './config';

const buildResponse = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

const buildUser = (overrides = {}) => ({
  _id: 'user-id-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  isAdmin: false,
  ...overrides,
});

describe('getToken', () => {
  test('signs a token carrying the user identity fields', () => {
    // Arrange
    const user = buildUser();

    // Act
    const result = jwt.verify(getToken(user), config.JWT_SECRET);

    // Assert
    expect(result).toMatchObject({
      _id: 'user-id-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      isAdmin: false,
    });
  });

  test('marks admin users in the token payload', () => {
    const token = getToken(buildUser({ isAdmin: true }));

    expect(jwt.verify(token, config.JWT_SECRET).isAdmin).toBe(true);
  });

  test('expires the token 48 hours after issuing it', () => {
    const decoded = jwt.verify(getToken(buildUser()), config.JWT_SECRET);

    expect(decoded.exp - decoded.iat).toBe(48 * 60 * 60);
  });

  test('produces a token that fails verification under a different secret', () => {
    const token = getToken(buildUser());

    expect(() => jwt.verify(token, 'another-secret')).toThrow('invalid signature');
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
    expect(req.user).toMatchObject({ _id: user._id, email: user.email });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('responds 401 when no authorization header is supplied', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Token is not supplied.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the token is not verifiable', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: { authorization: 'Bearer not-a-real-token' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when the token is signed with a foreign secret', () => {
    const foreignToken = jwt.sign({ _id: 'x' }, 'foreign-secret');
    const res = buildResponse();
    const next = jest.fn();

    isAuth({ headers: { authorization: `Bearer ${foreignToken}` } }, res, next);

    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid Token' });
  });
});

describe('isAdmin', () => {
  test('calls next when the authenticated user is an admin', () => {
    // Arrange
    const req = { user: buildUser({ isAdmin: true }) };
    const res = buildResponse();
    const next = jest.fn();

    // Act
    isAdmin(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('responds 401 when the authenticated user is not an admin', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAdmin({ user: buildUser({ isAdmin: false }) }, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ message: 'Admin Token is not valid.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('responds 401 when no user is attached to the request', () => {
    const res = buildResponse();
    const next = jest.fn();

    isAdmin({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('calculateMonthlyPlanTotal', () => {
  test('sums each order item plan price multiplied by its quantity', () => {
    // Arrange
    const orderItems = [
      { qty: 2, plan: { id: 'go5g', name: 'Go5G', monthlyPrice: 75 } },
      { qty: 1, plan: { id: 'go5g-next', name: 'Go5G Next', monthlyPrice: 100 } },
    ];

    // Act
    const result = calculateMonthlyPlanTotal(orderItems);

    // Assert
    expect(result).toBe(250);
  });

  test('ignores order items without a plan', () => {
    const orderItems = [
      { qty: 3, plan: null },
      { qty: 1, plan: { id: 'go5g-plus', name: 'Go5G Plus', monthlyPrice: 90 } },
    ];

    expect(calculateMonthlyPlanTotal(orderItems)).toBe(90);
  });

  test('coerces string quantities and prices sent by the client', () => {
    const orderItems = [{ qty: '2', plan: { id: 'go5g', name: 'Go5G', monthlyPrice: '75' } }];

    expect(calculateMonthlyPlanTotal(orderItems)).toBe(150);
  });

  test('returns 0 for an empty or missing item list', () => {
    expect(calculateMonthlyPlanTotal([])).toBe(0);
    expect(calculateMonthlyPlanTotal()).toBe(0);
  });
});
