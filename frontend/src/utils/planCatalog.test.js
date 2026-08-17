import {
  PLANS,
  MAX_LINES,
  getPlanById,
  getPricePerLine,
  calculatePlanMonthlyTotal,
} from './planCatalog';

describe('getPlanById', () => {
  test('returns the plan matching the given id', () => {
    // Arrange
    const planId = 'go5g';

    // Act
    const plan = getPlanById(planId);

    // Assert
    expect(plan.name).toBe('Go5G');
  });

  test('returns undefined for an unknown plan id', () => {
    expect(getPlanById('magenta-max')).toBeUndefined();
  });
});

describe('getPricePerLine', () => {
  test('returns the per-line price for the selected line count', () => {
    // Arrange
    const plan = getPlanById('go5g-plus');
    const lines = 3;

    // Act
    const pricePerLine = getPricePerLine(plan, lines);

    // Assert
    expect(pricePerLine).toBe(60);
  });

  test('returns the single-line price at the lowest supported line count', () => {
    expect(getPricePerLine(getPlanById('essentials'), 1)).toBe(50);
  });

  test('returns the discounted price at the highest supported line count', () => {
    expect(getPricePerLine(getPlanById('essentials'), MAX_LINES)).toBe(27.5);
  });

  test('throws an error when the plan is missing', () => {
    expect(() => getPricePerLine(undefined, 2)).toThrow('Plan is required');
  });

  test('throws an error when the line count is below the minimum', () => {
    expect(() => getPricePerLine(getPlanById('go5g'), 0)).toThrow(
      'Line count must be a whole number between 1 and 4'
    );
  });

  test('throws an error when the line count is above the maximum', () => {
    expect(() => getPricePerLine(getPlanById('go5g'), 5)).toThrow(
      'Line count must be a whole number between 1 and 4'
    );
  });

  test('throws an error when the line count is fractional', () => {
    expect(() => getPricePerLine(getPlanById('go5g'), 2.5)).toThrow(
      'Line count must be a whole number between 1 and 4'
    );
  });
});

describe('calculatePlanMonthlyTotal', () => {
  test('multiplies the per-line price by the number of lines', () => {
    // Arrange
    const plan = getPlanById('go5g');
    const lines = 2;

    // Act
    const total = calculatePlanMonthlyTotal(plan, lines);

    // Assert
    expect(total).toBeCloseTo(120, 2);
  });

  test('equals the per-line price for a single line', () => {
    expect(calculatePlanMonthlyTotal(getPlanById('go5g-plus'), 1)).toBeCloseTo(90, 2);
  });

  test('totals fractional per-line prices without rounding errors', () => {
    expect(calculatePlanMonthlyTotal(getPlanById('essentials'), 4)).toBeCloseTo(110, 2);
  });

  test('throws an error when the line count is unsupported', () => {
    expect(() => calculatePlanMonthlyTotal(getPlanById('essentials'), 9)).toThrow(
      'Line count must be a whole number between 1 and 4'
    );
  });
});

describe('PLANS', () => {
  test('exposes exactly three plans with unique ids', () => {
    // Arrange
    const ids = PLANS.map((plan) => plan.id);

    // Act
    const uniqueIds = new Set(ids);

    // Assert
    expect(PLANS).toHaveLength(3);
    expect(uniqueIds.size).toBe(3);
  });

  test('prices every supported line count for every plan', () => {
    PLANS.forEach((plan) => {
      for (let lines = 1; lines <= MAX_LINES; lines += 1) {
        expect(typeof getPricePerLine(plan, lines)).toBe('number');
      }
    });
  });
});
