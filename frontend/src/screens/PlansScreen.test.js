import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import PlansScreen from './PlansScreen';

afterEach(cleanup);

const priceCardFor = (container, planName) =>
  Array.from(container.querySelectorAll('.plan-card')).find(
    (card) => card.querySelector('.plan-name').textContent === planName
  );

describe('PlansScreen', () => {
  test('shows the single-line price and monthly total for every plan by default', () => {
    // Arrange
    const expected = [
      { name: 'Essentials', price: '$50.00', total: '$50.00 per month for 1 line' },
      { name: 'Go5G', price: '$75.00', total: '$75.00 per month for 1 line' },
      { name: 'Go5G Plus', price: '$90.00', total: '$90.00 per month for 1 line' },
    ];

    // Act
    const { container } = render(<PlansScreen />);

    // Assert
    expected.forEach(({ name, price, total }) => {
      const card = priceCardFor(container, name);
      expect(card.querySelector('.plan-price').textContent).toContain(price);
      expect(card.querySelector('.plan-total').textContent).toContain(total);
    });
  });

  test('recalculates per-line price and monthly total when the line count changes', () => {
    // Arrange
    const { container, getByLabelText } = render(<PlansScreen />);

    // Act
    fireEvent.change(getByLabelText('Number of lines'), { target: { value: '4' } });

    // Assert
    const card = priceCardFor(container, 'Essentials');
    expect(card.querySelector('.plan-price').textContent).toContain('$27.50');
    expect(card.querySelector('.plan-total').textContent).toContain(
      '$110.00 per month for 4 lines'
    );
  });

  test('states whether taxes and fees are included in the quoted price', () => {
    // Arrange
    const { container } = render(<PlansScreen />);

    // Assert
    expect(priceCardFor(container, 'Essentials').querySelector('.plan-total').textContent).toContain(
      'plus taxes and fees'
    );
    expect(priceCardFor(container, 'Go5G').querySelector('.plan-total').textContent).toContain(
      'taxes and fees included'
    );
  });
});
