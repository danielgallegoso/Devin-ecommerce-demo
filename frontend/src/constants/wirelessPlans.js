export const PLAN_ELIGIBLE_CATEGORY = 'Phones';

export const WIRELESS_PLANS = [
  {
    id: 'go5g',
    name: 'Go5G',
    monthlyPrice: 75,
    features: ['Unlimited talk, text & data', '50GB premium data', '15GB hotspot'],
  },
  {
    id: 'go5g-plus',
    name: 'Go5G Plus',
    monthlyPrice: 90,
    features: ['Unlimited premium data', '50GB hotspot', 'Netflix on Us'],
  },
  {
    id: 'go5g-next',
    name: 'Go5G Next',
    monthlyPrice: 100,
    features: ['Unlimited premium data', 'Upgrade-ready yearly', '50GB hotspot'],
  },
];

export function isPlanEligible(category) {
  return category === PLAN_ELIGIBLE_CATEGORY;
}

export function getPlanById(planId) {
  const plan = WIRELESS_PLANS.find((x) => x.id === planId);
  if (!plan) {
    throw new Error(`Unknown wireless plan: ${planId}`);
  }
  return plan;
}

export function resolvePlanSelection(category, planId) {
  if (!isPlanEligible(category) || !planId) {
    return null;
  }
  const { id, name, monthlyPrice } = getPlanById(planId);
  return { id, name, monthlyPrice };
}
