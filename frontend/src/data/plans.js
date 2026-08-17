const plans = [
  {
    id: 'essentials',
    name: 'Essentials',
    tagline: 'Unlimited talk, text and data on our 5G network.',
    pricePerLine: 50,
    linesIncluded: 1,
    featured: false,
    highlights: [
      'Unlimited 5G & 4G LTE data',
      '50GB premium data, then unlimited at lower speeds',
      'Mobile hotspot at 3G speeds',
      'Unlimited talk & text to Mexico and Canada',
    ],
    taxesIncluded: false,
  },
  {
    id: 'magenta',
    name: 'Magenta',
    tagline: 'More premium data, plus Netflix on us.',
    pricePerLine: 70,
    linesIncluded: 1,
    featured: true,
    highlights: [
      'Unlimited 5G & 4G LTE data',
      '100GB premium data',
      '15GB high-speed mobile hotspot',
      'Netflix on us with 2+ lines',
      '5GB high-speed data in Mexico and Canada',
    ],
    taxesIncluded: true,
  },
  {
    id: 'magenta-max',
    name: 'Magenta MAX',
    tagline: 'Our best plan, with no data limits.',
    pricePerLine: 85,
    linesIncluded: 1,
    featured: false,
    highlights: [
      'Unlimited premium 5G & 4G LTE data — never slowed',
      '4K UHD video streaming',
      '40GB high-speed mobile hotspot',
      'Netflix on us with 2+ lines',
      'Unlimited in-flight Wi-Fi',
    ],
    taxesIncluded: true,
  },
];

export default plans;
