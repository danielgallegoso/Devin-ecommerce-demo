import { getQueryValue, getRedirectPath, getQty } from './queryParams';

describe('getQueryValue', () => {
  test('returns the value after the first equals sign', () => {
    // Arrange
    const search = '?redirect=shipping';

    // Act
    const result = getQueryValue(search);

    // Assert
    expect(result).toBe('shipping');
  });

  test('returns the fallback when the search string is empty', () => {
    expect(getQueryValue('', 'default')).toBe('default');
  });

  test('returns an empty string by default when there is no search string', () => {
    expect(getQueryValue(undefined)).toBe('');
  });
});

describe('getRedirectPath', () => {
  test('returns the redirect target from the search string', () => {
    expect(getRedirectPath('?redirect=cart')).toBe('cart');
  });

  test('falls back to the site root when no redirect is present', () => {
    expect(getRedirectPath('')).toBe('/');
  });
});

describe('getQty', () => {
  test('returns the quantity as a number', () => {
    expect(getQty('?qty=3')).toBe(3);
  });

  test('defaults to a single item when no quantity is present', () => {
    expect(getQty('')).toBe(1);
  });
});
