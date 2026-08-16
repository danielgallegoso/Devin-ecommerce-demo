import React from 'react';
import { render } from '@testing-library/react';
import CheckoutSteps from './CheckoutSteps';

describe('CheckoutSteps', () => {
  test('marks only the completed steps as active', () => {
    // Arrange
    const props = { step1: true, step2: true };

    // Act
    const { getByText } = render(<CheckoutSteps {...props} />);

    // Assert
    expect(getByText('Signin')).toHaveClass('active');
    expect(getByText('Shipping')).toHaveClass('active');
    expect(getByText('Payment')).not.toHaveClass('active');
    expect(getByText('Place Order')).not.toHaveClass('active');
  });

  test('renders every checkout step in order', () => {
    const { container } = render(<CheckoutSteps step1 />);

    expect(Array.from(container.querySelectorAll('.checkout-steps div')).map((d) => d.textContent))
      .toEqual(['Signin', 'Shipping', 'Payment', 'Place Order']);
  });

  test('marks no step active when no step flags are provided', () => {
    const { container } = render(<CheckoutSteps />);

    expect(container.querySelectorAll('.active')).toHaveLength(0);
  });

  test('marks all steps active on the final step of the wizard', () => {
    const { container } = render(<CheckoutSteps step1 step2 step3 step4 />);

    expect(container.querySelectorAll('.active')).toHaveLength(4);
  });
});
