export const MAX_LINES = 8;

export const plans = [
  {
    id: 'essentials',
    name: 'Essentials',
    tagline: 'Our best value plan with unlimited talk, text and data.',
    data: 'Unlimited 5G & 4G LTE data',
    hotspot: '3G mobile hotspot data',
    highlights: [
      'Unlimited talk, text and data on our 5G network',
      '50GB premium data, then unlimited at slower speeds',
      'Unlimited texting in 210+ countries',
      'Taxes and fees extra',
    ],
    lineTotals: { 1: 60, 2: 90, 3: 105, 4: 120, 5: 150 },
    additionalLinePrice: 30,
  },
  {
    id: 'go5g',
    name: 'Go5G',
    tagline: 'Upgrade-ready with premium data and Netflix on us.',
    data: 'Unlimited premium 5G & 4G LTE data',
    hotspot: '15GB high-speed mobile hotspot',
    highlights: [
      'Unlimited premium data that never slows down',
      'Netflix on us with 2+ lines',
      '$5/month streaming credit toward Apple TV+',
      'Taxes and fees included',
    ],
    lineTotals: { 1: 75, 2: 130, 3: 155, 4: 180, 5: 205 },
    additionalLinePrice: 25,
  },
  {
    id: 'go5g-plus',
    name: 'Go5G Plus',
    tagline: 'Our most premium plan with the best upgrades and perks.',
    data: 'Unlimited premium 5G & 4G LTE data',
    hotspot: '50GB high-speed mobile hotspot',
    highlights: [
      'New phone upgrade every year',
      '50GB high-speed hotspot data',
      'Netflix and Apple TV+ on us',
      '5GB high-speed data in Canada and Mexico',
    ],
    lineTotals: { 1: 90, 2: 160, 3: 185, 4: 210, 5: 235 },
    additionalLinePrice: 25,
  },
];

export const getPlanById = (planId) => {
  const plan = plans.find((candidate) => candidate.id === planId);
  if (!plan) {
    throw new Error('Unknown plan: ' + planId);
  }
  return plan;
};

export const calculateMonthlyTotal = (plan, lines) => {
  if (!Number.isInteger(lines)) {
    throw new Error('Line count must be a whole number');
  }
  if (lines < 1 || lines > MAX_LINES) {
    throw new Error('Line count must be between 1 and ' + MAX_LINES);
  }
  const tiers = Object.keys(plan.lineTotals).map(Number);
  const highestTier = Math.max(...tiers);
  if (lines <= highestTier) {
    return plan.lineTotals[lines];
  }
  return (
    plan.lineTotals[highestTier] +
    (lines - highestTier) * plan.additionalLinePrice
  );
};

export const calculatePricePerLine = (plan, lines) =>
  calculateMonthlyTotal(plan, lines) / lines;
