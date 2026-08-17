import {
  calculateItemsPrice,
  calculateShippingPrice,
  calculateTaxPrice,
  calculateOrderTotal,
} from './priceCalculator';

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

describe('calculateShippingPrice', () => {
  test('is free above the free-shipping threshold', () => {
    // Arrange
    const itemsPrice = 100.01;

    // Act
    const result = calculateShippingPrice(itemsPrice);

    // Assert
    expect(result).toBe(0);
  });

  test('charges $10 at exactly the $100 threshold', () => {
    expect(calculateShippingPrice(100)).toBe(10);
  });

  test('charges $10 for an empty cart', () => {
    expect(calculateShippingPrice(0)).toBe(10);
  });
});

describe('calculateTaxPrice', () => {
  test('applies 15% tax to the items price', () => {
    expect(calculateTaxPrice(200)).toBeCloseTo(30, 2);
  });

  test('returns 0 tax for an empty cart', () => {
    expect(calculateTaxPrice(0)).toBe(0);
  });

  test('keeps float precision on decimal subtotals', () => {
    expect(calculateTaxPrice(19.99)).toBeCloseTo(2.9985, 4);
  });
});

describe('calculateOrderTotal', () => {
  test('sums items, shipping and tax for a cart below the free-shipping threshold', () => {
    // Arrange
    const itemsPrice = 50;

    // Act
    const result = calculateOrderTotal(itemsPrice);

    // Assert
    expect(result).toBeCloseTo(67.5, 2);
  });

  test('drops shipping from the total above the free-shipping threshold', () => {
    expect(calculateOrderTotal(200)).toBeCloseTo(230, 2);
  });
});
