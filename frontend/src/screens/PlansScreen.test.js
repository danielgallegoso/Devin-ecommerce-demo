import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import PlansScreen from './PlansScreen';
import { PLANS, MAX_DISCOUNTED_LINES, calculateMonthlyTotal } from '../utils/plans';

afterEach(cleanup);

const lineButton = (container, count) =>
  Array.from(container.querySelectorAll('.plans-line-button')).find(
    (button) => button.textContent === String(count)
  );

const planCard = (container, planName) =>
  Array.from(container.querySelectorAll('.plan-card')).find(
    (card) => card.querySelector('.plan-name').textContent === planName
  );

describe('PlansScreen', () => {
  test('renders one card per plan with single-line pricing by default', () => {
    // Arrange
    const essentials = PLANS.find((plan) => plan.id === 'essentials');

    // Act
    const { container } = render(<PlansScreen />);

    // Assert
    expect(container.querySelectorAll('.plan-card')).toHaveLength(PLANS.length);
    const card = planCard(container, essentials.name);
    expect(card.querySelector('.plan-price').textContent).toContain(
      `$${essentials.pricePerLine[1]}`
    );
    expect(card.querySelector('.plan-total').textContent).toContain(
      `$${essentials.pricePerLine[1]} per month for 1 line`
    );
  });

  test('renders a line button for every discounted line count', () => {
    const { container } = render(<PlansScreen />);

    expect(container.querySelectorAll('.plans-line-button')).toHaveLength(
      MAX_DISCOUNTED_LINES
    );
  });

  test('marks a single line as selected on first render', () => {
    const { container } = render(<PlansScreen />);

    expect(lineButton(container, 1).className).toContain('selected');
    expect(lineButton(container, 2).className).not.toContain('selected');
  });

  test('reprices every plan when a different line count is picked', () => {
    // Arrange
    const { container } = render(<PlansScreen />);

    // Act
    fireEvent.click(lineButton(container, 3));

    // Assert
    PLANS.forEach((plan) => {
      const card = planCard(container, plan.name);
      expect(card.querySelector('.plan-price').textContent).toContain(
        `$${plan.pricePerLine[3]}`
      );
      expect(card.querySelector('.plan-total').textContent).toContain(
        `$${calculateMonthlyTotal(plan, 3)} per month for 3 lines`
      );
    });
  });

  test('moves the selected state to the picked line count', () => {
    const { container } = render(<PlansScreen />);

    fireEvent.click(lineButton(container, 4));

    expect(lineButton(container, 4).className).toContain('selected');
    expect(lineButton(container, 1).className).not.toContain('selected');
  });

  test('pluralizes the line count only above one line', () => {
    const { container } = render(<PlansScreen />);

    fireEvent.click(lineButton(container, 2));

    container.querySelectorAll('.plan-total').forEach((total) => {
      expect(total.textContent).toContain('for 2 lines');
    });
  });

  test('labels taxes and fees per plan', () => {
    const { container } = render(<PlansScreen />);

    PLANS.forEach((plan) => {
      const card = planCard(container, plan.name);
      expect(card.querySelector('.plan-taxes').textContent).toBe(
        plan.taxesIncluded ? 'Taxes and fees included' : 'Plus taxes and fees'
      );
    });
  });

  test('renders the hero heading and the pricing disclaimer', () => {
    const { container } = render(<PlansScreen />);

    expect(container.querySelector('.plans-hero h1').textContent).toBe(
      'Pick the plan that fits your family'
    );
    expect(container.querySelector('.plans-disclaimer').textContent).toBe(
      'Demo pricing shown with AutoPay. Coverage not available everywhere.'
    );
  });

  test('keeps the selection when the selected line count is clicked again', () => {
    // Arrange
    const { container } = render(<PlansScreen />);
    fireEvent.click(lineButton(container, 2));

    // Act
    fireEvent.click(lineButton(container, 2));

    // Assert
    expect(lineButton(container, 2).className).toContain('selected');
    expect(
      container.querySelectorAll('.plans-line-button.selected')
    ).toHaveLength(1);
  });

  test('labels the per-line price unit on every plan card', () => {
    const { container } = render(<PlansScreen />);

    const units = Array.from(
      container.querySelectorAll('.plan-price-unit')
    ).map((unit) => unit.textContent);

    expect(units).toEqual(PLANS.map(() => '/line per month'));
  });

  test('lists every feature of each plan', () => {
    const { container } = render(<PlansScreen />);

    PLANS.forEach((plan) => {
      const features = Array.from(
        planCard(container, plan.name).querySelectorAll('.plan-features li')
      ).map((item) => item.textContent);

      expect(features).toEqual(plan.features);
    });
  });
});
