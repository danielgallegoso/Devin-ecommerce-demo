export const MIN_LINES = 1;
export const MAX_LINES = 4;

export const PLANS = [
  {
    id: 'essentials',
    name: 'Essentials',
    tagline: 'Our most affordable unlimited plan.',
    pricePerLine: { 1: 50, 2: 37.5, 3: 30, 4: 27.5 },
    data: 'Unlimited talk, text & data',
    hotspot: '3G speeds hotspot',
    streaming: 'SD streaming',
    taxesIncluded: false,
    perks: [
      'Unlimited talk, text and data on our 5G network',
      'Unlimited 3G mobile hotspot data',
      'Talk, text and 2G data in Mexico and Canada',
    ],
  },
  {
    id: 'go5g',
    name: 'Go5G',
    tagline: 'Upgrade-ready with taxes and fees included.',
    pricePerLine: { 1: 75, 2: 60, 3: 50, 4: 43.75 },
    data: 'Unlimited premium data',
    hotspot: '15GB high-speed hotspot',
    streaming: 'Netflix on Us (standard, 2+ lines)',
    taxesIncluded: true,
    perks: [
      'Unlimited premium 5G data that never slows down',
      '15GB of high-speed mobile hotspot data',
      'New device upgrade every two years',
      'Taxes and fees included in the price',
    ],
  },
  {
    id: 'go5g-plus',
    name: 'Go5G Plus',
    tagline: 'Our best plan, with a yearly upgrade.',
    pricePerLine: { 1: 90, 2: 75, 3: 60, 4: 52.5 },
    data: 'Unlimited premium data',
    hotspot: '50GB high-speed hotspot',
    streaming: 'Netflix & Apple TV+ on Us',
    taxesIncluded: true,
    perks: [
      'Unlimited premium 5G data with no slowdowns, ever',
      '50GB of high-speed mobile hotspot data',
      'New device upgrade every year',
      '5GB of high-speed data in Mexico and Canada',
    ],
  },
];

export const getPlanById = (planId) => PLANS.find((plan) => plan.id === planId);

export const getPricePerLine = (plan, lines) => {
  if (!plan) {
    throw new Error('Plan is required');
  }
  if (!Number.isInteger(lines) || lines < MIN_LINES || lines > MAX_LINES) {
    throw new Error('Line count must be a whole number between 1 and 4');
  }
  return plan.pricePerLine[lines];
};

export const calculatePlanMonthlyTotal = (plan, lines) =>
  getPricePerLine(plan, lines) * lines;
