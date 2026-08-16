import { calculateItemsPrice, calculateMonthlyPlanTotal } from './cartPricing';

const item = (overrides = {}) => ({
  product: 'product-1',
  price: 100,
  qty: 1,
  plan: null,
  ...overrides,
});

describe('calculateItemsPrice', () => {
  test('multiplies each item price by its quantity', () => {
    // Arrange
    const cartItems = [item({ price: 100, qty: 2 }), item({ product: 'product-2', price: 25, qty: 1 })];

    // Act
    const result = calculateItemsPrice(cartItems);

    // Assert
    expect(result).toBe(225);
  });

  test('returns 0 for an empty cart', () => {
    expect(calculateItemsPrice([])).toBe(0);
  });

  test('handles decimal prices without rounding errors bleeding into the result', () => {
    expect(calculateItemsPrice([item({ price: 19.99, qty: 3 })])).toBeCloseTo(59.97, 2);
  });
});

describe('calculateMonthlyPlanTotal', () => {
  test('sums the monthly price of every selected plan by line', () => {
    // Arrange
    const cartItems = [
      item({ qty: 2, plan: { id: 'go5g', name: 'Go5G', monthlyPrice: 75 } }),
      item({
        product: 'product-2',
        qty: 1,
        plan: { id: 'go5g-next', name: 'Go5G Next', monthlyPrice: 100 },
      }),
    ];

    // Act
    const result = calculateMonthlyPlanTotal(cartItems);

    // Assert
    expect(result).toBe(250);
  });

  test('ignores items that have no plan attached', () => {
    const cartItems = [
      item({ qty: 3 }),
      item({ product: 'product-2', qty: 1, plan: { id: 'go5g', name: 'Go5G', monthlyPrice: 75 } }),
    ];

    expect(calculateMonthlyPlanTotal(cartItems)).toBe(75);
  });

  test('returns 0 when no item in the cart has a plan', () => {
    expect(calculateMonthlyPlanTotal([item(), item({ product: 'product-2' })])).toBe(0);
  });

  test('returns 0 for an empty cart', () => {
    expect(calculateMonthlyPlanTotal([])).toBe(0);
  });
});
