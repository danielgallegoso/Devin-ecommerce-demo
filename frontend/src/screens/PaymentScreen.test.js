import { fireEvent } from '@testing-library/react';
import PaymentScreen from './PaymentScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const selectPaypalAndContinue = ({ container, getByText }) => {
  fireEvent.click(container.querySelector('#paymentMethod'));
  fireEvent.click(getByText('Continue'));
};

describe('PaymentScreen', () => {
  test('saves the chosen payment method to the cart', () => {
    // Arrange
    const utils = renderWithStore(PaymentScreen);

    // Act
    selectPaypalAndContinue(utils);

    // Assert
    expect(utils.store.getState().cart.payment).toEqual({ paymentMethod: 'paypal' });
  });

  test('advances the customer to the place-order step', () => {
    const utils = renderWithStore(PaymentScreen);

    selectPaypalAndContinue(utils);

    expect(utils.history.push).toHaveBeenCalledWith('placeorder');
  });

  test('keeps a previously saved shipping address when the payment method is saved', () => {
    const shipping = {
      address: '1 Main St',
      city: 'Bellevue',
      postalCode: '98006',
      country: 'USA',
    };
    const utils = renderWithStore(PaymentScreen, {
      preloadedState: { cart: { cartItems: [], shipping, payment: {} } },
    });

    selectPaypalAndContinue(utils);

    expect(utils.store.getState().cart.shipping).toEqual(shipping);
  });
});
