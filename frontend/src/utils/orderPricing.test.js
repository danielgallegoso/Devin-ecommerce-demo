import {
  calculateItemsPrice,
  calculateShippingPrice,
  calculateTaxPrice,
  calculateOrderPrices,
} from './orderPricing';

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

  test('handles the string quantity produced by the cart quantity select', () => {
    expect(calculateItemsPrice([cartItem({ price: 19.99, qty: '3' })])).toBeCloseTo(
      59.97,
      2
    );
  });
});

describe('calculateShippingPrice', () => {
  test('charges flat shipping below the free shipping threshold', () => {
    expect(calculateShippingPrice(99.99)).toBe(10);
  });

  test('charges flat shipping at exactly the threshold', () => {
    expect(calculateShippingPrice(100)).toBe(10);
  });

  test('is free above the threshold', () => {
    expect(calculateShippingPrice(100.01)).toBe(0);
  });

  test('charges flat shipping for an empty cart', () => {
    expect(calculateShippingPrice(0)).toBe(10);
  });
});

describe('calculateTaxPrice', () => {
  test('applies a 15% tax rate', () => {
    expect(calculateTaxPrice(200)).toBeCloseTo(30, 2);
  });

  test('taxes nothing on an empty cart', () => {
    expect(calculateTaxPrice(0)).toBe(0);
  });

  test('keeps floating point drift out of the result', () => {
    expect(calculateTaxPrice(19.99)).toBeCloseTo(2.9985, 4);
  });
});

describe('calculateOrderPrices', () => {
  test('totals items, free shipping and tax for a large order', () => {
    // Arrange
    const cartItems = [cartItem({ price: 199.99, qty: 2 })];

    // Act
    const prices = calculateOrderPrices(cartItems);

    // Assert
    expect(prices.itemsPrice).toBeCloseTo(399.98, 2);
    expect(prices.shippingPrice).toBe(0);
    expect(prices.taxPrice).toBeCloseTo(59.997, 3);
    expect(prices.totalPrice).toBeCloseTo(459.977, 3);
  });

  test('adds flat shipping for a small order', () => {
    const prices = calculateOrderPrices([cartItem({ price: 20, qty: 1 })]);

    expect(prices).toEqual({
      itemsPrice: 20,
      shippingPrice: 10,
      taxPrice: 3,
      totalPrice: 33,
    });
  });

  test('returns shipping-only totals for an empty cart', () => {
    const prices = calculateOrderPrices([]);

    expect(prices).toEqual({
      itemsPrice: 0,
      shippingPrice: 10,
      taxPrice: 0,
      totalPrice: 10,
    });
  });
});
