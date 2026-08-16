import { calculateItemsPrice } from './orderPricing';

const cartItem = (overrides = {}) => ({
  product: 'p1',
  name: 'T-Mobile Phone',
  price: 50,
  qty: 1,
  ...overrides,
});

describe('calculateItemsPrice', () => {
  test('sums price times quantity across cart items', () => {
    // Arrange
    const cartItems = [
      cartItem({ price: 50, qty: 2 }),
      cartItem({ product: 'p2', price: 25, qty: 3 }),
    ];

    // Act
    const itemsPrice = calculateItemsPrice(cartItems);

    // Assert
    expect(itemsPrice).toBe(175);
  });

  test('returns 0 for an empty cart', () => {
    expect(calculateItemsPrice([])).toBe(0);
  });

  test('handles string prices coming back from the API', () => {
    expect(calculateItemsPrice([cartItem({ price: '19.99', qty: 2 })])).toBeCloseTo(
      39.98,
      2
    );
  });
});
