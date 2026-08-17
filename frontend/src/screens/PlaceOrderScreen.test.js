import React from 'react';
import { render, cleanup, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import PlaceOrderScreen from './PlaceOrderScreen';
import { cartReducer } from '../reducers/cartReducers';
import { orderCreateReducer } from '../reducers/orderReducers';
import { createOrder } from '../actions/orderActions';

jest.mock('../actions/orderActions', () => ({
  createOrder: jest.fn(() => ({ type: 'TEST_CREATE_ORDER' })),
}));

const shipping = {
  address: '1 Main St',
  city: 'Bellevue',
  postalCode: '98006',
  country: 'USA',
};
const payment = { paymentMethod: 'paypal' };

const renderPlaceOrderScreen = ({ cartItems = [], cart = {}, history = { push: jest.fn() } } = {}) => {
  const store = createStore(
    combineReducers({ cart: cartReducer, orderCreate: orderCreateReducer }),
    { cart: { cartItems, shipping, payment, ...cart }, orderCreate: {} },
    applyMiddleware(thunk)
  );
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <PlaceOrderScreen history={history} />
      </MemoryRouter>
    </Provider>
  );
  const summary = within(utils.container.querySelector('.placeorder-action'));
  const amountFor = (label) =>
    summary.getByText(label).parentElement.lastElementChild.textContent;
  return { ...utils, store, history, amountFor, summary };
};

afterEach(() => {
  cleanup();
  createOrder.mockClear();
});

describe('PlaceOrderScreen', () => {
  test('charges $10 shipping and 15% tax on a subtotal below the free shipping threshold', () => {
    // Arrange
    const cartItems = [{ product: 'p1', name: 'USB-C Cable', price: 25, qty: 2 }];

    // Act
    const { amountFor } = renderPlaceOrderScreen({ cartItems });

    // Assert
    expect(amountFor('Items')).toBe('$50');
    expect(amountFor('Shipping')).toBe('$10');
    expect(amountFor('Tax')).toBe('$7.5');
    expect(amountFor('Order Total')).toBe('$67.5');
  });

  test('gives free shipping when the subtotal is above $100', () => {
    const cartItems = [{ product: 'p1', name: 'JBL Charge 5', price: 100, qty: 2 }];

    const { amountFor } = renderPlaceOrderScreen({ cartItems });

    expect(amountFor('Shipping')).toBe('$0');
    expect(amountFor('Order Total')).toBe('$230');
  });

  test('still charges shipping when the subtotal is exactly $100', () => {
    const cartItems = [{ product: 'p1', name: 'Power Bank', price: 50, qty: 2 }];

    const { amountFor } = renderPlaceOrderScreen({ cartItems });

    expect(amountFor('Shipping')).toBe('$10');
    expect(amountFor('Order Total')).toBe('$125');
  });

  test('totals a multi-line cart across quantities', () => {
    const cartItems = [
      { product: 'p1', name: 'Tempered Glass Protector', price: 24.99, qty: 2 },
      { product: 'p2', name: '30W Fast Charger', price: 19.99, qty: 1 },
    ];

    const { amountFor } = renderPlaceOrderScreen({ cartItems });

    expect(Number(amountFor('Items').slice(1))).toBeCloseTo(69.97, 2);
    expect(Number(amountFor('Order Total').slice(1))).toBeCloseTo(90.4655, 4);
  });

  test('places the order with the prices shown to the customer', () => {
    const cartItems = [{ product: 'p1', name: 'USB-C Cable', price: 25, qty: 2 }];
    const { summary } = renderPlaceOrderScreen({ cartItems });

    fireEvent.click(summary.getByText('Place Order'));

    expect(createOrder).toHaveBeenCalledWith({
      orderItems: cartItems,
      shipping,
      payment,
      itemsPrice: 50,
      shippingPrice: 10,
      taxPrice: 7.5,
      totalPrice: 67.5,
    });
  });

  test('redirects to the shipping step when no shipping address has been saved', () => {
    const history = { push: jest.fn() };

    renderPlaceOrderScreen({ cart: { shipping: {} }, history });

    expect(history.push).toHaveBeenCalledWith('/shipping');
  });

  test('redirects to the payment step when no payment method has been selected', () => {
    const history = { push: jest.fn() };

    renderPlaceOrderScreen({ cart: { payment: {} }, history });

    expect(history.push).toHaveBeenCalledWith('/payment');
  });
});
