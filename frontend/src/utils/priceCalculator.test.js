import { calculateItemsPrice, calculateOrderPrices } from './priceCalculator';

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

describe('calculateOrderPrices', () => {
  test('charges shipping and tax for an order at or below the free shipping threshold', () => {
    // Arrange
    const cartItems = [{ price: 50, qty: 2 }];

    // Act
    const result = calculateOrderPrices(cartItems);

    // Assert
    expect(result).toEqual({
      itemsPrice: 100,
      shippingPrice: 10,
      taxPrice: 15,
      totalPrice: 125,
    });
  });

  test('waives shipping once the items price passes the threshold', () => {
    expect(calculateOrderPrices([{ price: 100.01, qty: 1 }]).shippingPrice).toBe(0);
  });

  test('returns shipping only for an empty cart', () => {
    expect(calculateOrderPrices([])).toEqual({
      itemsPrice: 0,
      shippingPrice: 10,
      taxPrice: 0,
      totalPrice: 10,
    });
  });

  test('keeps decimal totals accurate', () => {
    expect(calculateOrderPrices([{ price: 19.99, qty: 3 }]).totalPrice).toBeCloseTo(78.9655, 4);
  });
});
