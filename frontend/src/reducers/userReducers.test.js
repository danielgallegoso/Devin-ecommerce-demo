import {
  userSigninReducer,
  userRegisterReducer,
  userUpdateReducer,
} from './userReducers';
import {
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_LOGOUT,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_UPDATE_REQUEST,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_FAIL,
} from '../constants/userConstants';

const userInfo = { _id: 'user-1', name: 'Ada Lovelace', token: 'jwt-token' };

describe('userSigninReducer', () => {
  test('flags loading while the sign-in request is in flight', () => {
    // Arrange
    const action = { type: USER_SIGNIN_REQUEST };

    // Act
    const result = userSigninReducer({}, action);

    // Assert
    expect(result).toEqual({ loading: true });
  });

  test('stores the signed-in user on success', () => {
    const result = userSigninReducer({ loading: true }, {
      type: USER_SIGNIN_SUCCESS,
      payload: userInfo,
    });

    expect(result).toEqual({ loading: false, userInfo });
  });

  test('stores the error message on failure', () => {
    const result = userSigninReducer({ loading: true }, {
      type: USER_SIGNIN_FAIL,
      payload: 'Request failed with status code 401',
    });

    expect(result).toEqual({ loading: false, error: 'Request failed with status code 401' });
  });

  test('clears the state on logout', () => {
    const result = userSigninReducer({ userInfo }, { type: USER_LOGOUT });

    expect(result).toEqual({});
  });

  test('returns the current state for an unknown action', () => {
    const state = { userInfo };

    expect(userSigninReducer(state, { type: 'UNKNOWN' })).toBe(state);
  });
});

describe('userRegisterReducer', () => {
  test('flags loading while the registration request is in flight', () => {
    expect(userRegisterReducer({}, { type: USER_REGISTER_REQUEST })).toEqual({ loading: true });
  });

  test('stores the registered user on success', () => {
    const result = userRegisterReducer({}, { type: USER_REGISTER_SUCCESS, payload: userInfo });

    expect(result).toEqual({ loading: false, userInfo });
  });

  test('stores the error message on failure', () => {
    const result = userRegisterReducer({}, { type: USER_REGISTER_FAIL, payload: 'Email taken' });

    expect(result).toEqual({ loading: false, error: 'Email taken' });
  });
});

describe('userUpdateReducer', () => {
  test('flags loading while the update request is in flight', () => {
    expect(userUpdateReducer({}, { type: USER_UPDATE_REQUEST })).toEqual({ loading: true });
  });

  test('stores the updated user on success', () => {
    const result = userUpdateReducer({}, { type: USER_UPDATE_SUCCESS, payload: userInfo });

    expect(result).toEqual({ loading: false, userInfo });
  });

  test('stores the error message on failure', () => {
    const result = userUpdateReducer({}, { type: USER_UPDATE_FAIL, payload: 'Network Error' });

    expect(result).toEqual({ loading: false, error: 'Network Error' });
  });
});
