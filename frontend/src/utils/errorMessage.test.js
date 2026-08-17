import { getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  test('prefers the message the server sent in the response body', () => {
    // Arrange
    const error = {
      message: 'Request failed with status code 401',
      response: { data: { message: 'Invalid Email or Password.' } },
    };

    // Act
    const result = getErrorMessage(error);

    // Assert
    expect(result).toBe('Invalid Email or Password.');
  });

  test('returns a plain-text response body when there is no message field', () => {
    expect(
      getErrorMessage({ message: 'Request failed', response: { data: 'Order Not Found.' } })
    ).toBe('Order Not Found.');
  });

  test('falls back to the axios error message when the server sent no body', () => {
    expect(getErrorMessage({ message: 'Network Error' })).toBe('Network Error');
  });

  test('ignores a blank response body', () => {
    expect(
      getErrorMessage({ message: 'Request failed', response: { data: '   ' } })
    ).toBe('Request failed');
  });

  test('returns a generic message when the error is missing', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong.');
  });

  test('returns a generic message when the error carries no usable text', () => {
    expect(getErrorMessage({})).toBe('Something went wrong.');
  });
});
