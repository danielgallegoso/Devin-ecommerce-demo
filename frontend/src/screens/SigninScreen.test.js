import React from 'react';
import Axios from 'axios';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import SigninScreen from './SigninScreen';
import { userSigninReducer } from '../reducers/userReducers';

jest.mock('axios');
jest.mock('js-cookie', () => ({ set: jest.fn(), get: jest.fn(), remove: jest.fn() }));

const renderSigninScreen = ({ search = '' } = {}) => {
  const store = createStore(
    combineReducers({ userSignin: userSigninReducer }),
    { userSignin: {} },
    applyMiddleware(thunk)
  );
  const history = { push: jest.fn() };
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <SigninScreen location={{ search }} history={history} />
      </MemoryRouter>
    </Provider>
  );
  const signin = (email, password) => {
    fireEvent.change(utils.getByLabelText('Email'), { target: { value: email } });
    fireEvent.change(utils.getByLabelText('Password'), { target: { value: password } });
    fireEvent.click(utils.getByText('Signin'));
  };
  return { ...utils, store, history, signin };
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('SigninScreen', () => {
  test('signs the customer in with the submitted credentials', async () => {
    // Arrange
    Axios.post.mockResolvedValue({ data: { _id: 'u1', name: 'Dana', token: 'jwt-token' } });
    const { signin, store } = renderSigninScreen();

    // Act
    signin('dana@example.com', 'secret123');

    // Assert
    expect(Axios.post).toHaveBeenCalledWith('/api/users/signin', {
      email: 'dana@example.com',
      password: 'secret123',
    });
    await wait(() => expect(store.getState().userSignin.userInfo.token).toBe('jwt-token'));
  });

  test('returns the customer to the checkout step they came from after signing in', async () => {
    Axios.post.mockResolvedValue({ data: { _id: 'u1', name: 'Dana', token: 'jwt-token' } });
    const { signin, history } = renderSigninScreen({ search: '?redirect=shipping' });

    signin('dana@example.com', 'secret123');

    await wait(() => expect(history.push).toHaveBeenCalledWith('shipping'));
  });

  test('shows the failure and keeps the customer on the form when credentials are invalid', async () => {
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const { signin, history, findByText } = renderSigninScreen({ search: '?redirect=shipping' });

    signin('dana@example.com', 'wrong-password');

    expect(await findByText('Request failed with status code 401')).toBeTruthy();
    expect(history.push).not.toHaveBeenCalled();
  });

  test('keeps the checkout redirect on the link to registration', () => {
    const { getByText } = renderSigninScreen({ search: '?redirect=shipping' });

    expect(getByText('Create your T-Mobile ID').getAttribute('href')).toBe('/register?redirect=shipping');
  });
});
