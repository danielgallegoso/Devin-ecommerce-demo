import { fireEvent } from '@testing-library/react';
import ShippingScreen from './ShippingScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const address = {
  address: '1 Main St',
  city: 'Bellevue',
  postalCode: '98006',
  country: 'USA',
};

const submitAddress = ({ getByLabelText, getByText }) => {
  fireEvent.change(getByLabelText('Address'), { target: { value: address.address } });
  fireEvent.change(getByLabelText('City'), { target: { value: address.city } });
  fireEvent.change(getByLabelText('Postal Code'), {
    target: { value: address.postalCode },
  });
  fireEvent.change(getByLabelText('Country'), { target: { value: address.country } });
  fireEvent.click(getByText('Continue'));
};

describe('ShippingScreen', () => {
  test('saves the entered address to the cart', () => {
    // Arrange
    const utils = renderWithStore(ShippingScreen);

    // Act
    submitAddress(utils);

    // Assert
    expect(utils.store.getState().cart.shipping).toEqual(address);
  });

  test('advances the customer to the payment step', () => {
    const utils = renderWithStore(ShippingScreen);

    submitAddress(utils);

    expect(utils.history.push).toHaveBeenCalledWith('payment');
  });

  test('keeps the cart items while saving the address', () => {
    const utils = renderWithStore(ShippingScreen, {
      preloadedState: {
        cart: {
          cartItems: [{ product: 'product-1', price: 100, qty: 1 }],
          shipping: {},
          payment: {},
        },
      },
    });

    submitAddress(utils);

    expect(utils.store.getState().cart.cartItems).toHaveLength(1);
  });
});
