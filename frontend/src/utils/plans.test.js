import {
  PLANS,
  MAX_DISCOUNTED_LINES,
  getPricePerLine,
  calculateMonthlyTotal,
} from './plans';

const plan = (overrides = {}) => ({
  id: 'test-plan',
  name: 'Test Plan',
  tagline: 'A plan used by tests.',
  pricePerLine: { 1: 60, 2: 45, 3: 35, 4: 30 },
  taxesIncluded: false,
  features: ['Unlimited talk, text and data'],
  ...overrides,
});

describe('PLANS', () => {
  test('exposes a price for every line count up to the discount cap', () => {
    // Arrange
    const tiers = Array.from({ length: MAX_DISCOUNTED_LINES }, (_, i) => i + 1);

    // Act
    const prices = PLANS.map((p) => tiers.map((tier) => p.pricePerLine[tier]));

    // Assert
    prices.forEach((planPrices) => {
      expect(planPrices).toHaveLength(MAX_DISCOUNTED_LINES);
      planPrices.forEach((price) => expect(typeof price).toBe('number'));
    });
  });

  test('uses unique plan ids so React keys do not collide', () => {
    const ids = PLANS.map((p) => p.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  test('prices drop as lines are added on every plan', () => {
    PLANS.forEach((p) => {
      expect(p.pricePerLine[1]).toBeGreaterThan(p.pricePerLine[2]);
      expect(p.pricePerLine[2]).toBeGreaterThan(p.pricePerLine[3]);
      expect(p.pricePerLine[3]).toBeGreaterThan(p.pricePerLine[4]);
    });
  });
});

describe('getPricePerLine', () => {
  test('returns the tier price for the requested line count', () => {
    // Arrange
    const essentials = plan();

    // Act
    const price = getPricePerLine(essentials, 3);

    // Assert
    expect(price).toBe(35);
  });

  test('returns the single-line price for one line', () => {
    expect(getPricePerLine(plan(), 1)).toBe(60);
  });

  test('returns the cap tier price at the discount cap', () => {
    expect(getPricePerLine(plan(), MAX_DISCOUNTED_LINES)).toBe(30);
  });

  test('caps the discount tier beyond the maximum discounted lines', () => {
    expect(getPricePerLine(plan(), MAX_DISCOUNTED_LINES + 3)).toBe(30);
  });

  test('throws for zero lines', () => {
    expect(() => getPricePerLine(plan(), 0)).toThrow(
      'lineCount must be at least 1'
    );
  });

  test('throws for a negative line count', () => {
    expect(() => getPricePerLine(plan(), -2)).toThrow(
      'lineCount must be at least 1'
    );
  });

  test('throws for a fractional line count', () => {
    expect(() => getPricePerLine(plan(), 2.5)).toThrow(
      'lineCount must be an integer'
    );
  });

  test('throws for a non-numeric line count', () => {
    expect(() => getPricePerLine(plan(), '3')).toThrow(
      'lineCount must be an integer'
    );
  });

  test('throws for a missing line count', () => {
    expect(() => getPricePerLine(plan())).toThrow(
      'lineCount must be an integer'
    );
  });

  test('throws for NaN lines', () => {
    expect(() => getPricePerLine(plan(), NaN)).toThrow(
      'lineCount must be an integer'
    );
  });

  test('prices taxes-included plans from their own tier table', () => {
    const experienceMore = plan({
      id: 'experience-more',
      pricePerLine: { 1: 85, 2: 70, 3: 55, 4: 45 },
      taxesIncluded: true,
    });

    expect(getPricePerLine(experienceMore, 2)).toBe(70);
  });
});

describe('calculateMonthlyTotal', () => {
  test('multiplies the tier price by the number of lines', () => {
    // Arrange
    const essentials = plan();

    // Act
    const total = calculateMonthlyTotal(essentials, 3);

    // Assert
    expect(total).toBe(105);
  });

  test('equals the per-line price for a single line', () => {
    expect(calculateMonthlyTotal(plan(), 1)).toBe(60);
  });

  test('bills every line at the capped tier price above the cap', () => {
    expect(calculateMonthlyTotal(plan(), 6)).toBe(180);
  });

  test('keeps fractional tier prices free of floating point drift', () => {
    const fractional = plan({ pricePerLine: { 1: 19.99, 2: 15.55 } });

    expect(calculateMonthlyTotal(fractional, 2)).toBeCloseTo(31.1, 2);
  });

  test('throws for zero lines', () => {
    expect(() => calculateMonthlyTotal(plan(), 0)).toThrow(
      'lineCount must be at least 1'
    );
  });

  test('throws instead of returning NaN for a fractional line count', () => {
    expect(() => calculateMonthlyTotal(plan(), 1.5)).toThrow(
      'lineCount must be an integer'
    );
  });
});
