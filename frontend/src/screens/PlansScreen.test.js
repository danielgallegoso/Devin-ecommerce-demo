import React from 'react';
import { render, cleanup, fireEvent, within } from '@testing-library/react';
import PlansScreen from './PlansScreen';

const renderPlansScreen = () => {
  const utils = render(<PlansScreen />);
  const planCard = (name) =>
    within(utils.getByText(name).closest('.plan-card'));
  const selectLines = (lines) =>
    fireEvent.change(utils.getByLabelText('How many lines do you need?'), {
      target: { value: String(lines) },
    });
  return { ...utils, planCard, selectLines };
};

afterEach(cleanup);

describe('PlansScreen', () => {
  test('shows the monthly price of every plan for a single line', () => {
    // Arrange
    const { planCard } = renderPlansScreen();

    // Act
    const prices = ['Essentials', 'Go5G', 'Go5G Plus'].map(
      (name) => planCard(name).getByText(/\/mo$/).textContent
    );

    // Assert
    expect(prices).toEqual(['$60.00/mo', '$75.00/mo', '$90.00/mo']);
  });

  test('reprices every plan when the customer changes the number of lines', () => {
    // Arrange
    const { planCard, selectLines } = renderPlansScreen();

    // Act
    selectLines(4);

    // Assert
    expect(planCard('Essentials').getByText(/\/mo$/).textContent).toBe(
      '$120.00/mo'
    );
    expect(planCard('Go5G').getByText(/\/mo$/).textContent).toBe('$180.00/mo');
    expect(planCard('Go5G Plus').getByText(/\/mo$/).textContent).toBe(
      '$210.00/mo'
    );
  });

  test('shows the per line price for the selected number of lines', () => {
    const { planCard, selectLines } = renderPlansScreen();

    selectLines(3);

    expect(
      planCard('Go5G').getByText('$51.67/mo per line for 3 lines')
    ).toBeTruthy();
  });

  test('prices additional lines beyond the published tiers', () => {
    const { planCard, selectLines } = renderPlansScreen();

    selectLines(6);

    expect(planCard('Essentials').getByText(/\/mo$/).textContent).toBe(
      '$180.00/mo'
    );
  });

  test('offers line counts from one up to the maximum of eight', () => {
    const { getByLabelText } = renderPlansScreen();

    const options = Array.from(
      getByLabelText('How many lines do you need?').options
    ).map((option) => option.value);

    expect(options).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  test('lists the key details of each plan', () => {
    const { planCard } = renderPlansScreen();

    const essentials = planCard('Essentials');

    expect(essentials.getByText('Unlimited 5G & 4G LTE data')).toBeTruthy();
    expect(essentials.getByText('3G mobile hotspot data')).toBeTruthy();
  });
});
