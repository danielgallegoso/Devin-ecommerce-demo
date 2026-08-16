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
  category: 'Phones',
  plan: null,
  qty: 2,
};

const go5gPlus = { id: 'go5g-plus', name: 'Go5G Plus', monthlyPrice: 90 };

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

  test('offers the three wireless plans for a phone in the cart', () => {
    // Arrange
    const preloadedState = { cart: { cartItems: [cartItem], shipping: {}, payment: {} } };

    // Act
    const { getByLabelText } = renderWithStore(<CartScreen {...routeProps()} />, { preloadedState });
    const planSelect = getByLabelText('Wireless plan for Phone A');

    // Assert
    expect(planSelect.value).toBe('');
    expect(Array.from(planSelect.options).map((o) => o.value)).toEqual([
      '',
      'go5g',
      'go5g-plus',
      'go5g-next',
    ]);
  });

  test('does not offer a wireless plan for a product outside the phones category', () => {
    const accessory = { ...cartItem, category: 'Accessories', name: 'Case A' };
    const { queryByLabelText } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [accessory], shipping: {}, payment: {} } },
    });

    expect(queryByLabelText('Wireless plan for Case A')).toBeNull();
  });

  test('shows the monthly plan total alongside the item subtotal', () => {
    const withPlan = { ...cartItem, plan: go5gPlus };
    const { getByText } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [withPlan], shipping: {}, payment: {} } },
    });

    expect(getByText(/\$ 200/)).toBeInTheDocument();
    expect(getByText(/Wireless plans: \$ 180\/mo/)).toBeInTheDocument();
  });

  test('hides the monthly plan total when no item carries a plan', () => {
    const { queryByText } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [cartItem], shipping: {}, payment: {} } },
    });

    expect(queryByText(/Wireless plans:/)).toBeNull();
  });

  test('replaces the plan on the cart item when a different plan is selected', async () => {
    Axios.get.mockResolvedValue({ data: { _id: 'product-1', ...cartItem } });
    const { getByLabelText, store } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [cartItem], shipping: {}, payment: {} } },
    });

    fireEvent.change(getByLabelText('Wireless plan for Phone A'), {
      target: { value: 'go5g-next' },
    });

    await wait(() =>
      expect(store.getState().cart.cartItems[0].plan).toEqual({
        id: 'go5g-next',
        name: 'Go5G Next',
        monthlyPrice: 100,
      })
    );
  });

  test('clears the plan when the device-only option is selected again', async () => {
    // Arrange
    Axios.get.mockResolvedValue({ data: { _id: 'product-1', ...cartItem } });
    const withPlan = { ...cartItem, plan: go5gPlus };
    const { getByLabelText, queryByText, store } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [withPlan], shipping: {}, payment: {} } },
    });

    // Act
    fireEvent.change(getByLabelText('Wireless plan for Phone A'), { target: { value: '' } });

    // Assert
    await wait(() => expect(store.getState().cart.cartItems[0].plan).toBeNull());
    expect(queryByText(/Wireless plans:/)).toBeNull();
  });

  test('defaults the quantity to 1 when the route carries no qty query', async () => {
    Axios.get.mockResolvedValue({
      data: {
        _id: 'product-9',
        name: 'Phone Z',
        image: '/z.jpg',
        price: 50,
        countInStock: 2,
        category: 'Phones',
      },
    });
    const props = routeProps({
      match: { params: { id: 'product-9' } },
      location: { search: '?plan=go5g-plus' },
    });

    const { store } = renderWithStore(<CartScreen {...props} />, {
      preloadedState: { cart: { cartItems: [], shipping: {}, payment: {} } },
    });

    await wait(() => expect(store.getState().cart.cartItems).toHaveLength(1));
    expect(store.getState().cart.cartItems[0]).toMatchObject({ qty: 1, plan: go5gPlus });
  });

  test('keeps the selected plan when only the quantity changes', async () => {
    Axios.get.mockResolvedValue({ data: { _id: 'product-1', ...cartItem } });
    const withPlan = { ...cartItem, plan: go5gPlus };
    const { container, store } = renderWithStore(<CartScreen {...routeProps()} />, {
      preloadedState: { cart: { cartItems: [withPlan], shipping: {}, payment: {} } },
    });

    fireEvent.change(container.querySelector('select'), { target: { value: '3' } });

    await wait(() => expect(store.getState().cart.cartItems[0].qty).toBe('3'));
    expect(store.getState().cart.cartItems[0].plan).toEqual(go5gPlus);
  });

  test('adds the phone with the plan from the route query on mount', async () => {
    Axios.get.mockResolvedValue({
      data: {
        _id: 'product-9',
        name: 'Phone Z',
        image: '/z.jpg',
        price: 50,
        countInStock: 2,
        category: 'Phones',
      },
    });
    const props = routeProps({
      match: { params: { id: 'product-9' } },
      location: { search: '?qty=2&plan=go5g' },
    });

    const { store } = renderWithStore(<CartScreen {...props} />, {
      preloadedState: { cart: { cartItems: [], shipping: {}, payment: {} } },
    });

    await wait(() => expect(store.getState().cart.cartItems).toHaveLength(1));
    expect(store.getState().cart.cartItems[0]).toMatchObject({
      product: 'product-9',
      qty: 2,
      plan: { id: 'go5g', name: 'Go5G', monthlyPrice: 75 },
    });
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
