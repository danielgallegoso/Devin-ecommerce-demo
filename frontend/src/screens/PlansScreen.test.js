import React from 'react';
import { render } from '@testing-library/react';
import PlansScreen from './PlansScreen';
import plans from '../data/plans';

describe('PlansScreen', () => {
  test('lists every advertised plan with its monthly price per line', () => {
    // Arrange
    const expected = plans.map((plan) => [plan.name, `$${plan.pricePerLine}`]);

    // Act
    const { getByText } = render(<PlansScreen />);

    // Assert
    expected.forEach(([name, price]) => {
      expect(getByText(name)).toBeInTheDocument();
      expect(getByText(price)).toBeInTheDocument();
    });
  });

  test('renders exactly three plans', () => {
    const { container } = render(<PlansScreen />);

    expect(container.querySelectorAll('.plan')).toHaveLength(3);
  });

  test('marks a single plan as the most popular option', () => {
    const { container } = render(<PlansScreen />);

    expect(container.querySelectorAll('.plan-badge')).toHaveLength(1);
  });

  test('states that taxes and fees are included only for the plans that include them', () => {
    const included = plans.filter((plan) => plan.taxesIncluded).length;

    const { getAllByText } = render(<PlansScreen />);

    expect(getAllByText('Taxes and fees included')).toHaveLength(included);
  });

  test('lists the key details of each plan', () => {
    const { container } = render(<PlansScreen />);

    const rendered = container.querySelectorAll('.plan-highlights li').length;
    expect(rendered).toBe(
      plans.reduce((total, plan) => total + plan.highlights.length, 0)
    );
  });
});
