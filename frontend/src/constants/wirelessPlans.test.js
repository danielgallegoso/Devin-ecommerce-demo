import {
  WIRELESS_PLANS,
  PLAN_ELIGIBLE_CATEGORY,
  isPlanEligible,
  getPlanById,
  resolvePlanSelection,
} from './wirelessPlans';

describe('WIRELESS_PLANS', () => {
  test('offers exactly the three T-Mobile plans with their monthly prices', () => {
    // Arrange
    const expected = [
      { id: 'go5g', name: 'Go5G', monthlyPrice: 75 },
      { id: 'go5g-plus', name: 'Go5G Plus', monthlyPrice: 90 },
      { id: 'go5g-next', name: 'Go5G Next', monthlyPrice: 100 },
    ];

    // Act
    const summary = WIRELESS_PLANS.map(({ id, name, monthlyPrice }) => ({
      id,
      name,
      monthlyPrice,
    }));

    // Assert
    expect(summary).toEqual(expected);
  });

  test('gives every plan at least one listed feature', () => {
    WIRELESS_PLANS.forEach((plan) => {
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });
});

describe('isPlanEligible', () => {
  test('treats phones as plan eligible', () => {
    expect(isPlanEligible(PLAN_ELIGIBLE_CATEGORY)).toBe(true);
  });

  test('treats every other category as ineligible', () => {
    expect(isPlanEligible('Accessories')).toBe(false);
    expect(isPlanEligible('Tablets')).toBe(false);
    expect(isPlanEligible(undefined)).toBe(false);
  });
});

describe('getPlanById', () => {
  test('returns the plan matching the id', () => {
    // Arrange
    const planId = 'go5g-plus';

    // Act
    const result = getPlanById(planId);

    // Assert
    expect(result).toMatchObject({ name: 'Go5G Plus', monthlyPrice: 90 });
  });

  test('throws an error when the plan id is unknown', () => {
    expect(() => getPlanById('unlimited-everything')).toThrow(
      'Unknown wireless plan: unlimited-everything'
    );
  });
});

describe('resolvePlanSelection', () => {
  test('returns the selected plan for a phone', () => {
    // Arrange
    const category = 'Phones';
    const planId = 'go5g-next';

    // Act
    const result = resolvePlanSelection(category, planId);

    // Assert
    expect(result).toEqual({ id: 'go5g-next', name: 'Go5G Next', monthlyPrice: 100 });
  });

  test('returns null when a phone is added without choosing a plan', () => {
    expect(resolvePlanSelection('Phones', '')).toBeNull();
    expect(resolvePlanSelection('Phones', undefined)).toBeNull();
  });

  test('ignores a plan chosen for a product that cannot carry one', () => {
    expect(resolvePlanSelection('Accessories', 'go5g')).toBeNull();
  });

  test('throws an error when a phone is given an unknown plan id', () => {
    expect(() => resolvePlanSelection('Phones', 'go6g')).toThrow(
      'Unknown wireless plan: go6g'
    );
  });
});
