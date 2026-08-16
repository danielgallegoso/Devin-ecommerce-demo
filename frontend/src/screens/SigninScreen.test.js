import React from 'react';
import { fireEvent, wait } from '@testing-library/react';
import Axios from 'axios';
import SigninScreen from './SigninScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const routeProps = (overrides = {}) => ({
  location: { search: '' },
  history: { push: jest.fn() },
  ...overrides,
});

const fillCredentials = (getByLabelText, email, password) => {
  fireEvent.change(getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(getByLabelText('Password'), { target: { value: password } });
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SigninScreen', () => {
  test('signs the user in and stores them in the store on submit', async () => {
    // Arrange
    const userInfo = { _id: 'user-1', name: 'Ada Lovelace', token: 'jwt' };
    Axios.post.mockResolvedValue({ data: userInfo });
    const { getByLabelText, getByText, store } = renderWithStore(
      <SigninScreen {...routeProps()} />
    );

    // Act
    fillCredentials(getByLabelText, 'ada@example.com', 'secret');
    fireEvent.click(getByText('Signin'));

    // Assert
    await wait(() => expect(store.getState().userSignin.userInfo).toEqual(userInfo));
    expect(Axios.post).toHaveBeenCalledWith('/api/users/signin', {
      email: 'ada@example.com',
      password: 'secret',
    });
  });

  test('shows the error message when the credentials are rejected', async () => {
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const { getByLabelText, getByText, findByText } = renderWithStore(
      <SigninScreen {...routeProps()} />
    );

    fillCredentials(getByLabelText, 'ada@example.com', 'wrong');
    fireEvent.click(getByText('Signin'));

    expect(await findByText('Request failed with status code 401')).toBeInTheDocument();
  });

  test('redirects to the home page once a user is signed in', async () => {
    const props = routeProps();

    renderWithStore(<SigninScreen {...props} />, {
      preloadedState: { userSignin: { userInfo: { _id: 'user-1' } } },
    });

    await wait(() => expect(props.history.push).toHaveBeenCalledWith('/'));
  });

  test('redirects to the requested page from the redirect query parameter', async () => {
    const props = routeProps({ location: { search: '?redirect=shipping' } });

    renderWithStore(<SigninScreen {...props} />, {
      preloadedState: { userSignin: { userInfo: { _id: 'user-1' } } },
    });

    await wait(() => expect(props.history.push).toHaveBeenCalledWith('shipping'));
  });

  test('links to registration carrying the redirect target forward', () => {
    const props = routeProps({ location: { search: '?redirect=shipping' } });

    const { getByText } = renderWithStore(<SigninScreen {...props} />);

    expect(getByText('Create your T-Mobile ID')).toHaveAttribute(
      'href',
      '/register?redirect=shipping'
    );
  });
});
