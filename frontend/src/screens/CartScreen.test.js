import React from 'react';
import Axios from 'axios';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import CartScreen from './CartScreen';
import { cartReducer } from '../reducers/cartReducers';

jest.mock('axios');
jest.mock('js-cookie', () => ({ set: jest.fn(), get: jest.fn(), remove: jest.fn() }));

const cable = {
  product: 'p1',
  name: '6 ft USB-C Cable',
  image: '/images/cable.png',
  price: 100,
  countInStock: 5,
  qty: 2,
};
const glass = {
  product: 'p2',
  name: 'Tempered Glass Protector',
  image: '/images/glass.png',
  price: 25.5,
  countInStock: 10,
  qty: 4,
};

const renderCartScreen = ({ cartItems = [], search = '', id = undefined } = {}) => {
  const store = createStore(
    combineReducers({ cart: cartReducer }),
    { cart: { cartItems, shipping: {}, payment: {} } },
    applyMiddleware(thunk)
  );
  const history = { push: jest.fn() };
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <CartScreen match={{ params: { id } }} location={{ search }} history={history} />
      </MemoryRouter>
    </Provider>
  );
  const subtotalText = () =>
    utils.container.querySelector('.cart-action h3').textContent.replace(/\s+/g, ' ').trim();
  return { ...utils, store, history, subtotalText };
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('CartScreen', () => {
  test('shows the subtotal and item count for the items in the cart', () => {
    // Arrange
    const cartItems = [cable, glass];

    // Act
    const { subtotalText } = renderCartScreen({ cartItems });

    // Assert
    expect(subtotalText()).toBe('Subtotal ( 6 items) : $ 302');
  });

  test('tells the customer the cart is empty when there are no items', () => {
    const { getByText } = renderCartScreen({ cartItems: [] });

    expect(getByText('Cart is empty')).toBeTruthy();
  });

  test('disables checkout while the cart is empty', () => {
    const { getByText } = renderCartScreen({ cartItems: [] });

    expect(getByText('Proceed to Checkout').disabled).toBe(true);
  });

  test('enables checkout once the cart has an item', () => {
    const { getByText } = renderCartScreen({ cartItems: [cable] });

    expect(getByText('Proceed to Checkout').disabled).toBe(false);
  });

  test('sends the customer to sign-in with a shipping redirect on checkout', () => {
    const { getByText, history } = renderCartScreen({ cartItems: [cable] });

    fireEvent.click(getByText('Proceed to Checkout'));

    expect(history.push).toHaveBeenCalledWith('/signin?redirect=shipping');
  });

  test('removes an item from the cart and recalculates the subtotal', () => {
    const { getAllByText, queryByText, subtotalText } = renderCartScreen({
      cartItems: [cable, glass],
    });

    fireEvent.click(getAllByText('Delete')[0]);

    expect(queryByText('6 ft USB-C Cable')).toBeNull();
    expect(subtotalText()).toBe('Subtotal ( 4 items) : $ 102');
  });

  test('recalculates the subtotal when the quantity of an item changes', async () => {
    Axios.get.mockResolvedValue({ data: { ...cable, _id: cable.product } });
    const { container, subtotalText } = renderCartScreen({ cartItems: [cable] });

    fireEvent.change(container.querySelector('select'), { target: { value: '3' } });

    await wait(() => expect(subtotalText()).toBe('Subtotal ( 3 items) : $ 300'));
  });

  test('adds the product from the route to the cart on load', async () => {
    Axios.get.mockResolvedValue({ data: { ...glass, _id: glass.product, qty: undefined } });

    const { findByText } = renderCartScreen({ id: 'p2', search: '?qty=2' });

    expect(Axios.get).toHaveBeenCalledWith('/api/products/p2');
    expect(await findByText('Tempered Glass Protector')).toBeTruthy();
  });
});
