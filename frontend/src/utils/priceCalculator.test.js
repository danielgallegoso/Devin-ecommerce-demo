import { calculateItemsPrice, calculateOrderTotals } from './priceCalculator';

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

describe('calculateOrderTotals', () => {
  test('waives shipping and adds tax for a cart above the free shipping threshold', () => {
    // Arrange
    const cartItems = [{ price: 200, qty: 1 }];

    // Act
    const totals = calculateOrderTotals(cartItems);

    // Assert
    expect(totals.itemsPrice).toBeCloseTo(200, 2);
    expect(totals.shippingPrice).toBe(0);
    expect(totals.taxPrice).toBeCloseTo(30, 2);
    expect(totals.totalPrice).toBeCloseTo(230, 2);
  });

  test('charges the flat shipping fee below the free shipping threshold', () => {
    expect(calculateOrderTotals([{ price: 50, qty: 1 }])).toMatchObject({
      shippingPrice: 10,
    });
  });

  test('charges shipping at exactly the free shipping threshold', () => {
    expect(calculateOrderTotals([{ price: 100, qty: 1 }]).shippingPrice).toBe(10);
  });

  test('waives shipping one cent above the free shipping threshold', () => {
    expect(calculateOrderTotals([{ price: 100.01, qty: 1 }]).shippingPrice).toBe(0);
  });

  test('applies 15% tax to the items price only, not to shipping', () => {
    expect(calculateOrderTotals([{ price: 50, qty: 1 }]).taxPrice).toBeCloseTo(7.5, 2);
  });

  test('sums items, shipping and tax into the total price', () => {
    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculateOrderTotals([
      { price: 19.99, qty: 3 },
    ]);

    expect(totalPrice).toBeCloseTo(itemsPrice + shippingPrice + taxPrice, 5);
    expect(totalPrice).toBeCloseTo(78.9655, 4);
  });

  test('charges only shipping for an empty cart', () => {
    expect(calculateOrderTotals([])).toEqual({
      itemsPrice: 0,
      shippingPrice: 10,
      taxPrice: 0,
      totalPrice: 10,
    });
  });
});
