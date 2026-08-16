import Axios from 'axios';
import Cookie from 'js-cookie';
import { signin, register, logout, update } from './userActions';
import {
  USER_SIGNIN_REQUEST,
  USER_SIGNIN_SUCCESS,
  USER_SIGNIN_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_LOGOUT,
  USER_UPDATE_REQUEST,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_FAIL,
} from '../constants/userConstants';

jest.mock('axios');
jest.mock('js-cookie');

const userInfo = { _id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com', token: 'jwt' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('signin', () => {
  test('dispatches request then success and stores the user cookie', async () => {
    // Arrange
    Axios.post.mockResolvedValue({ data: userInfo });
    const dispatch = jest.fn();

    // Act
    await signin('ada@example.com', 'secret')(dispatch);

    // Assert
    expect(Axios.post).toHaveBeenCalledWith('/api/users/signin', {
      email: 'ada@example.com',
      password: 'secret',
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: USER_SIGNIN_REQUEST,
      payload: { email: 'ada@example.com', password: 'secret' },
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: USER_SIGNIN_SUCCESS, payload: userInfo });
    expect(Cookie.set).toHaveBeenCalledWith('userInfo', JSON.stringify(userInfo));
  });

  test('dispatches failure with the error message when the credentials are rejected', async () => {
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const dispatch = jest.fn();

    await signin('ada@example.com', 'wrong')(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: USER_SIGNIN_FAIL,
      payload: 'Request failed with status code 401',
    });
    expect(Cookie.set).not.toHaveBeenCalled();
  });
});

describe('register', () => {
  test('dispatches request then success and stores the user cookie', async () => {
    Axios.post.mockResolvedValue({ data: userInfo });
    const dispatch = jest.fn();

    await register('Ada Lovelace', 'ada@example.com', 'secret')(dispatch);

    expect(Axios.post).toHaveBeenCalledWith('/api/users/register', {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret',
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: USER_REGISTER_REQUEST,
      payload: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'secret' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: USER_REGISTER_SUCCESS, payload: userInfo });
  });

  test('dispatches failure when registration is rejected', async () => {
    Axios.post.mockRejectedValue(new Error('Email already exists'));
    const dispatch = jest.fn();

    await register('Ada', 'ada@example.com', 'secret')(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: USER_REGISTER_FAIL,
      payload: 'Email already exists',
    });
  });
});

describe('update', () => {
  test('sends the bearer token of the signed-in user', async () => {
    Axios.put.mockResolvedValue({ data: userInfo });
    const getState = () => ({ userSignin: { userInfo } });

    await update({ userId: 'user-1', name: 'Ada L.', email: 'ada@example.com', password: 'secret' })(
      jest.fn(),
      getState
    );

    expect(Axios.put).toHaveBeenCalledWith(
      '/api/users/user-1',
      { name: 'Ada L.', email: 'ada@example.com', password: 'secret' },
      { headers: { Authorization: 'Bearer jwt' } }
    );
  });

  test('dispatches request then success and refreshes the user cookie', async () => {
    Axios.put.mockResolvedValue({ data: userInfo });
    const dispatch = jest.fn();

    await update({ userId: 'user-1', name: 'Ada L.' })(dispatch, () => ({
      userSignin: { userInfo },
    }));

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: USER_UPDATE_REQUEST,
      payload: { userId: 'user-1', name: 'Ada L.', email: undefined, password: undefined },
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: USER_UPDATE_SUCCESS, payload: userInfo });
    expect(Cookie.set).toHaveBeenCalledWith('userInfo', JSON.stringify(userInfo));
  });

  test('dispatches failure when the update request fails', async () => {
    Axios.put.mockRejectedValue(new Error('Network Error'));
    const dispatch = jest.fn();

    await update({ userId: 'user-1' })(dispatch, () => ({ userSignin: { userInfo } }));

    expect(dispatch).toHaveBeenLastCalledWith({
      type: USER_UPDATE_FAIL,
      payload: 'Network Error',
    });
  });
});

describe('logout', () => {
  test('removes the user cookie and dispatches the logout action', () => {
    const dispatch = jest.fn();

    logout()(dispatch);

    expect(Cookie.remove).toHaveBeenCalledWith('userInfo');
    expect(dispatch).toHaveBeenCalledWith({ type: USER_LOGOUT });
  });
});
