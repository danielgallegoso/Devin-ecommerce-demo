import Axios from 'axios';
import { fireEvent, wait } from '@testing-library/react';
import SigninScreen from './SigninScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const userInfo = {
  _id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  token: 'signed-token',
};

const submitCredentials = ({ getByLabelText, getByText }) => {
  fireEvent.change(getByLabelText('Email'), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(getByLabelText('Password'), {
    target: { value: 'secret' },
  });
  fireEvent.click(getByText('Signin'));
};

describe('SigninScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits the typed credentials to the sign-in endpoint', async () => {
    // Arrange
    Axios.post.mockResolvedValue({ data: userInfo });
    const utils = renderWithStore(SigninScreen);

    // Act
    submitCredentials(utils);

    // Assert
    await wait(() =>
      expect(Axios.post).toHaveBeenCalledWith('/api/users/signin', {
        email: 'ada@example.com',
        password: 'secret',
      })
    );
  });

  test('stores the signed-in user in the session state', async () => {
    Axios.post.mockResolvedValue({ data: userInfo });
    const utils = renderWithStore(SigninScreen);

    submitCredentials(utils);

    await wait(() =>
      expect(utils.store.getState().userSignin.userInfo).toEqual(userInfo)
    );
  });

  test('returns the customer to the checkout step they came from', async () => {
    Axios.post.mockResolvedValue({ data: userInfo });
    const utils = renderWithStore(SigninScreen, {
      props: { location: { search: '?redirect=shipping' } },
    });

    submitCredentials(utils);

    await wait(() => expect(utils.history.push).toHaveBeenCalledWith('shipping'));
  });

  test('lands on the home page when there is no redirect target', async () => {
    Axios.post.mockResolvedValue({ data: userInfo });
    const utils = renderWithStore(SigninScreen);

    submitCredentials(utils);

    await wait(() => expect(utils.history.push).toHaveBeenCalledWith('/'));
  });

  test('shows the failure reason when the credentials are rejected', async () => {
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const utils = renderWithStore(SigninScreen);

    submitCredentials(utils);

    await wait(() =>
      expect(
        utils.getByText('Request failed with status code 401')
      ).toBeInTheDocument()
    );
  });

  test('does not navigate away when the credentials are rejected', async () => {
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const utils = renderWithStore(SigninScreen);

    submitCredentials(utils);

    await wait(() =>
      expect(utils.store.getState().userSignin.error).toBeDefined()
    );
    expect(utils.history.push).not.toHaveBeenCalled();
  });
});
