import { PLANS, MAX_LINES, getPlanPricing, formatPrice } from './plans';

const findPlan = (id) => PLANS.find((plan) => plan.id === id);

describe('PLANS', () => {
  test('exposes the three T-Mobile plans in ascending price order', () => {
    // Arrange
    const singleLinePrices = PLANS.map(
      (plan) => plan.monthlyPriceByLineCount[1]
    );

    // Act
    const sorted = [...singleLinePrices].sort((a, b) => a - b);

    // Assert
    expect(PLANS.map((plan) => plan.id)).toEqual([
      'essentials',
      'go5g',
      'go5g-plus',
    ]);
    expect(singleLinePrices).toEqual(sorted);
  });

  test('prices every plan for one through the maximum number of lines', () => {
    PLANS.forEach((plan) => {
      for (let lineCount = 1; lineCount <= MAX_LINES; lineCount += 1) {
        expect(typeof plan.monthlyPriceByLineCount[lineCount]).toBe('number');
      }
    });
  });
});

describe('getPlanPricing', () => {
  test('returns the single line price with no per line discount', () => {
    // Arrange
    const plan = findPlan('go5g');

    // Act
    const { monthlyTotal, pricePerLine } = getPlanPricing(plan, 1);

    // Assert
    expect(monthlyTotal).toBe(75);
    expect(pricePerLine).toBeCloseTo(75, 2);
  });

  test('splits the monthly total evenly across multiple lines', () => {
    // Arrange
    const plan = findPlan('essentials');

    // Act
    const { monthlyTotal, pricePerLine } = getPlanPricing(plan, 4);

    // Assert
    expect(monthlyTotal).toBe(100);
    expect(pricePerLine).toBeCloseTo(25, 2);
  });

  test('keeps repeating per line prices precise for three lines', () => {
    expect(getPlanPricing(findPlan('go5g'), 3).pricePerLine).toBeCloseTo(
      51.6667,
      4
    );
  });

  test('prices the most expensive plan at the maximum line count', () => {
    expect(getPlanPricing(findPlan('go5g-plus'), MAX_LINES).monthlyTotal).toBe(
      220
    );
  });

  test('throws an error when the line count is below one', () => {
    expect(() => getPlanPricing(findPlan('go5g'), 0)).toThrow(
      'Line count must be a whole number of at least 1'
    );
  });

  test('throws an error when the line count is not a whole number', () => {
    expect(() => getPlanPricing(findPlan('go5g'), 2.5)).toThrow(
      'Line count must be a whole number of at least 1'
    );
  });

  test('throws an error when the line count exceeds the maximum', () => {
    expect(() => getPlanPricing(findPlan('go5g'), MAX_LINES + 1)).toThrow(
      'Line count cannot exceed 4'
    );
  });
});

describe('formatPrice', () => {
  test('formats a whole dollar amount with two decimal places', () => {
    expect(formatPrice(50)).toBe('$50.00');
  });

  test('rounds a repeating decimal amount to cents', () => {
    expect(formatPrice(51.66666)).toBe('$51.67');
  });
});
