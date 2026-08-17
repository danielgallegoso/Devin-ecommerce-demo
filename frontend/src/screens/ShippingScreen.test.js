import React from 'react';
import { render, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import ShippingScreen from './ShippingScreen';
import { cartReducer } from '../reducers/cartReducers';

const renderShippingScreen = () => {
  const store = createStore(
    combineReducers({ cart: cartReducer }),
    { cart: { cartItems: [], shipping: {}, payment: {} } },
    applyMiddleware(thunk)
  );
  const history = { push: jest.fn() };
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <ShippingScreen history={history} />
      </MemoryRouter>
    </Provider>
  );
  const fillAddress = ({ address, city, postalCode, country }) => {
    fireEvent.change(utils.getByLabelText('Address'), { target: { value: address } });
    fireEvent.change(utils.getByLabelText('City'), { target: { value: city } });
    fireEvent.change(utils.getByLabelText('Postal Code'), { target: { value: postalCode } });
    fireEvent.change(utils.getByLabelText('Country'), { target: { value: country } });
  };
  const steps = within(utils.container.querySelector('.checkout-steps'));
  return { ...utils, store, history, fillAddress, steps };
};

afterEach(cleanup);

describe('ShippingScreen', () => {
  test('saves the submitted shipping address to the cart', () => {
    // Arrange
    const { fillAddress, getByText, store } = renderShippingScreen();
    fillAddress({
      address: '1 Main St',
      city: 'Bellevue',
      postalCode: '98006',
      country: 'USA',
    });

    // Act
    fireEvent.click(getByText('Continue'));

    // Assert
    expect(store.getState().cart.shipping).toEqual({
      address: '1 Main St',
      city: 'Bellevue',
      postalCode: '98006',
      country: 'USA',
    });
  });

  test('advances the customer to the payment step after saving the address', () => {
    const { fillAddress, getByText, history } = renderShippingScreen();
    fillAddress({ address: '1 Main St', city: 'Bellevue', postalCode: '98006', country: 'USA' });

    fireEvent.click(getByText('Continue'));

    expect(history.push).toHaveBeenCalledWith('payment');
  });

  test('marks sign-in and shipping as the completed checkout steps', () => {
    const { steps } = renderShippingScreen();

    expect(steps.getByText('Signin').className).toBe('active');
    expect(steps.getByText('Shipping').className).toBe('active');
    expect(steps.getByText('Payment').className).toBe('');
  });
});
