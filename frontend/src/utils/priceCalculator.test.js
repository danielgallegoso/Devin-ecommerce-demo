import { calculateItemsPrice } from './priceCalculator';

describe('calculateItemsPrice', () => {
  test('sums price times quantity across cart items', () => {
    // Arrange
    const cartItems = [
      { price: 100, qty: 2 },
      { price: 25.5, qty: 4 },
    ];

    // Act
    const result = calculateItemsPrice(cartItems);

    // Assert
    expect(result).toBeCloseTo(302, 2);
  });

  test('returns 0 for an empty cart', () => {
    expect(calculateItemsPrice([])).toBe(0);
  });

  test('handles string prices coming back from the API', () => {
    expect(calculateItemsPrice([{ price: '19.99', qty: '3' }])).toBeCloseTo(59.97, 2);
  });
});
