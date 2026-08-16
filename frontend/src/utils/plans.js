export const MAX_LINES = 4;

export const PLANS = [
  {
    id: 'essentials',
    name: 'Essentials',
    tagline: 'Unlimited talk, text and data on our 5G network.',
    monthlyPriceByLineCount: { 1: 50, 2: 80, 3: 90, 4: 100 },
    features: [
      'Unlimited 5G & 4G LTE data',
      '50GB premium data, then slower speeds during congestion',
      '5GB high-speed mobile hotspot',
      'Unlimited talk & text in the US, Mexico & Canada',
      'Taxes & fees extra',
    ],
  },
  {
    id: 'go5g',
    name: 'Go5G',
    tagline: 'Upgrade-ready with taxes and fees included.',
    monthlyPriceByLineCount: { 1: 75, 2: 130, 3: 155, 4: 180 },
    popular: true,
    features: [
      'Unlimited premium 5G & 4G LTE data',
      'Taxes & fees included in your monthly price',
      '15GB high-speed mobile hotspot',
      'Netflix on Us with 2+ lines',
      'Upgrade-ready every 2 years',
    ],
  },
  {
    id: 'go5g-plus',
    name: 'Go5G Plus',
    tagline: 'Our best plan, with the most premium data and perks.',
    monthlyPriceByLineCount: { 1: 90, 2: 160, 3: 190, 4: 220 },
    features: [
      'Unlimited premium 5G & 4G LTE data',
      'Taxes & fees included in your monthly price',
      '50GB high-speed mobile hotspot',
      'Netflix & Apple TV+ on Us',
      'Upgrade-ready every year',
    ],
  },
];

export const getPlanPricing = (plan, lineCount) => {
  if (!Number.isInteger(lineCount) || lineCount < 1) {
    throw new Error('Line count must be a whole number of at least 1');
  }
  if (lineCount > MAX_LINES) {
    throw new Error(`Line count cannot exceed ${MAX_LINES}`);
  }
  const monthlyTotal = plan.monthlyPriceByLineCount[lineCount];
  return { monthlyTotal, pricePerLine: monthlyTotal / lineCount };
};

export const formatPrice = (amount) => `$${amount.toFixed(2)}`;
