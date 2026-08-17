import { userSigninReducer } from './userReducers';
import {
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_LOGOUT,
} from '../constants/userConstants';

const userInfo = {
  _id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  isAdmin: false,
  token: 'signed-token',
};

describe('userSigninReducer', () => {
  test('marks the sign-in request as loading', () => {
    // Arrange
    const state = {};

    // Act
    const result = userSigninReducer(state, { type: USER_SIGNIN_REQUEST });

    // Assert
    expect(result).toEqual({ loading: true });
  });

  test('stores the signed-in user on success', () => {
    const result = userSigninReducer(
      { loading: true },
      { type: USER_SIGNIN_SUCCESS, payload: userInfo }
    );

    expect(result).toEqual({ loading: false, userInfo });
  });

  test('does not expose a user when sign-in fails', () => {
    const result = userSigninReducer(
      { loading: true },
      { type: USER_SIGNIN_FAIL, payload: 'Request failed with status code 401' }
    );

    expect(result.userInfo).toBeUndefined();
  });

  test('reports the failure reason when sign-in fails', () => {
    const result = userSigninReducer(
      { loading: true },
      { type: USER_SIGNIN_FAIL, payload: 'Request failed with status code 401' }
    );

    expect(result).toEqual({
      loading: false,
      error: 'Request failed with status code 401',
    });
  });

  test('clears the whole session on logout', () => {
    const result = userSigninReducer(
      { loading: false, userInfo },
      { type: USER_LOGOUT }
    );

    expect(result).toEqual({});
  });

  test('drops a stale error alongside the user on logout', () => {
    const result = userSigninReducer(
      { loading: false, userInfo, error: 'previous failure' },
      { type: USER_LOGOUT }
    );

    expect(result.error).toBeUndefined();
  });

  test('returns the existing session untouched for an unknown action', () => {
    const state = { loading: false, userInfo };

    const result = userSigninReducer(state, { type: 'UNKNOWN' });

    expect(result).toBe(state);
  });
});
