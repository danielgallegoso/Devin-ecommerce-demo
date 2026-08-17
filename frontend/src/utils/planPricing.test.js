import {
  MAX_LINES,
  calculateMonthlyTotal,
  calculatePricePerLine,
  getPlanById,
  plans,
} from './planPricing';

describe('calculateMonthlyTotal', () => {
  test('charges the published total for the selected number of lines', () => {
    // Arrange
    const plan = getPlanById('go5g');
    const lines = 3;

    // Act
    const total = calculateMonthlyTotal(plan, lines);

    // Assert
    expect(total).toBe(155);
  });

  test('charges the single line price for one line', () => {
    expect(calculateMonthlyTotal(getPlanById('essentials'), 1)).toBe(60);
  });

  test('charges the published total at the highest published tier', () => {
    expect(calculateMonthlyTotal(getPlanById('essentials'), 5)).toBe(150);
  });

  test('adds the additional line price for the first line past the published tiers', () => {
    expect(calculateMonthlyTotal(getPlanById('essentials'), 6)).toBe(180);
  });

  test('adds the additional line price for every line past the published tiers', () => {
    expect(calculateMonthlyTotal(getPlanById('go5g-plus'), MAX_LINES)).toBe(310);
  });

  test('throws an error when the line count is below one', () => {
    expect(() => calculateMonthlyTotal(getPlanById('go5g'), 0)).toThrow(
      'Line count must be between 1 and 8'
    );
  });

  test('throws an error when the line count is above the maximum', () => {
    expect(() =>
      calculateMonthlyTotal(getPlanById('go5g'), MAX_LINES + 1)
    ).toThrow('Line count must be between 1 and 8');
  });

  test('throws an error when the line count is not a whole number', () => {
    expect(() => calculateMonthlyTotal(getPlanById('go5g'), 2.5)).toThrow(
      'Line count must be a whole number'
    );
  });
});

describe('calculatePricePerLine', () => {
  test('divides the monthly total across the selected lines', () => {
    // Arrange
    const plan = getPlanById('essentials');
    const lines = 4;

    // Act
    const pricePerLine = calculatePricePerLine(plan, lines);

    // Assert
    expect(pricePerLine).toBe(30);
  });

  test('keeps the fractional cents when the total does not divide evenly', () => {
    expect(calculatePricePerLine(getPlanById('essentials'), 3)).toBeCloseTo(
      35,
      2
    );
  });

  test('keeps the fractional cents for a total that splits unevenly', () => {
    expect(calculatePricePerLine(getPlanById('go5g'), 3)).toBeCloseTo(51.67, 2);
  });

  test('throws an error when the line count is invalid', () => {
    expect(() => calculatePricePerLine(getPlanById('go5g'), 0)).toThrow(
      'Line count must be between 1 and 8'
    );
  });
});

describe('getPlanById', () => {
  test('returns the plan matching the requested id', () => {
    // Arrange
    const planId = 'go5g-plus';

    // Act
    const plan = getPlanById(planId);

    // Assert
    expect(plan.name).toBe('Go5G Plus');
  });

  test('returns all three published plans', () => {
    expect(plans.map((plan) => plan.id)).toEqual([
      'essentials',
      'go5g',
      'go5g-plus',
    ]);
  });

  test('throws an error when the plan id is unknown', () => {
    expect(() => getPlanById('magenta-max')).toThrow(
      'Unknown plan: magenta-max'
    );
  });
});
