import React from 'react';
import { fireEvent, wait } from '@testing-library/react';
import Axios from 'axios';
import CartScreen from './CartScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const cartItem = {
  product: 'product-1',
  name: 'Phone A',
  image: '/images/a.jpg',
  price: 100,
  countInStock: 5,
  qty: 2,
};

const routeProps = (overrides = {}) => ({
  match: { params: {} },
  location: { search: '' },
  history: { push: jest.fn() },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CartScreen', () => {
  test('shows the subtotal for the items in the cart', () => {
    // Arrange
    const preloadedState = { cart: { cartItems: [cartItem], shipping: {}, payment: {} } };

    // Act
    const { getByText } = renderWithStore(<CartScreen {...routeProps()} />, { preloadedState });

    // Assert
    expect(getByText(/Subtotal \( 2 items\)/)).toBeInTheDocument();
    expect(getByText(/\$ 200/)).toBeInTheDocument();
  });

  test('shows an empty-cart message and disables checkout when there is nothing in the cart', () => {
    const { getByText } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [], shipping: {}, payment: {} } },
    });

    expect(getByText('Cart is empty')).toBeInTheDocument();
    expect(getByText('Proceed to Checkout')).toBeDisabled();
  });

  test('removes the item from the cart when Delete is clicked', () => {
    const preloadedState = { cart: { cartItems: [cartItem], shipping: {}, payment: {} } };
    const { getByText, store } = renderWithStore(<CartScreen {...routeProps()} />, { preloadedState });

    fireEvent.click(getByText('Delete'));

    expect(store.getState().cart.cartItems).toHaveLength(0);
    expect(getByText('Cart is empty')).toBeInTheDocument();
  });

  test('updates the quantity of an item when a new quantity is selected', async () => {
    Axios.get.mockResolvedValue({ data: { _id: 'product-1', ...cartItem } });
    const preloadedState = { cart: { cartItems: [cartItem], shipping: {}, payment: {} } };
    const { container, store } = renderWithStore(<CartScreen {...routeProps()} />, { preloadedState });

    fireEvent.change(container.querySelector('select'), { target: { value: '4' } });

    await wait(() => expect(store.getState().cart.cartItems[0].qty).toBe('4'));
  });

  test('adds the product from the route to the cart on mount', async () => {
    Axios.get.mockResolvedValue({
      data: { _id: 'product-9', name: 'Phone Z', image: '/z.jpg', price: 50, countInStock: 2 },
    });
    const props = routeProps({ match: { params: { id: 'product-9' } }, location: { search: '?qty=3' } });

    const { store } = renderWithStore(<CartScreen {...props} />, {
      preloadedState: { cart: { cartItems: [], shipping: {}, payment: {} } },
    });

    await wait(() => expect(store.getState().cart.cartItems).toHaveLength(1));
    expect(Axios.get).toHaveBeenCalledWith('/api/products/product-9');
    expect(store.getState().cart.cartItems[0]).toMatchObject({ product: 'product-9', qty: 3 });
  });

  test('navigates to sign-in with a shipping redirect when checkout is clicked', () => {
    const props = routeProps();
    const { getByText } = renderWithStore(<CartScreen {...props} />, {
      preloadedState: { cart: { cartItems: [cartItem], shipping: {}, payment: {} } },
    });

    fireEvent.click(getByText('Proceed to Checkout'));

    expect(props.history.push).toHaveBeenCalledWith('/signin?redirect=shipping');
  });
});
