const MAX_DISCOUNTED_LINES = 4;

const PLANS = [
  {
    id: 'essentials',
    name: 'Essentials',
    tagline: 'Our best value unlimited plan.',
    pricePerLine: { 1: 60, 2: 45, 3: 35, 4: 30 },
    taxesIncluded: false,
    features: [
      'Unlimited talk, text and data on our 5G network',
      '50GB of premium data, then speeds may slow in congestion',
      '3G mobile hotspot data',
      'Unlimited talk and text in Mexico and Canada',
    ],
  },
  {
    id: 'experience-more',
    name: 'Experience More',
    tagline: 'More data, more perks, taxes and fees included.',
    pricePerLine: { 1: 85, 2: 70, 3: 55, 4: 45 },
    taxesIncluded: true,
    features: [
      'Unlimited premium data that never slows down',
      '60GB of high-speed mobile hotspot data',
      'Netflix on Us with 2 or more lines',
      '15GB of high-speed data in Mexico and Canada',
    ],
  },
  {
    id: 'experience-beyond',
    name: 'Experience Beyond',
    tagline: 'Our most data and the most perks.',
    pricePerLine: { 1: 100, 2: 85, 3: 70, 4: 60 },
    taxesIncluded: true,
    features: [
      'Unlimited premium data that never slows down',
      '250GB of high-speed mobile hotspot data',
      'Netflix, Apple TV+ and Hulu on Us',
      '30GB of high-speed data in Mexico and Canada',
    ],
  },
];

const getPricePerLine = (plan, lineCount) => {
  if (!Number.isInteger(lineCount)) {
    throw new Error('lineCount must be an integer');
  }
  if (lineCount < 1) {
    throw new Error('lineCount must be at least 1');
  }
  const tier = Math.min(lineCount, MAX_DISCOUNTED_LINES);
  return plan.pricePerLine[tier];
};

const calculateMonthlyTotal = (plan, lineCount) =>
  getPricePerLine(plan, lineCount) * lineCount;

export { PLANS, MAX_DISCOUNTED_LINES, getPricePerLine, calculateMonthlyTotal };
