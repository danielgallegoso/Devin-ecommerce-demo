import React from 'react';
import { fireEvent, wait } from '@testing-library/react';
import Axios from 'axios';
import PlaceOrderScreen from './PlaceOrderScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');

const go5gPlus = { id: 'go5g-plus', name: 'Go5G Plus', monthlyPrice: 90 };

const cartItem = (overrides = {}) => ({
  product: 'product-1',
  name: 'Phone A',
  image: '/images/a.jpg',
  price: 100,
  countInStock: 5,
  category: 'Phones',
  plan: null,
  qty: 2,
  ...overrides,
});

const shipping = { address: '1 Main St', city: 'Bellevue', postalCode: '98006', country: 'USA' };
const payment = { paymentMethod: 'paypal' };

const routeProps = (overrides = {}) => ({
  history: { push: jest.fn() },
  ...overrides,
});

const amountShownFor = (getByText, label) =>
  Number(getByText(label).nextSibling.textContent.replace('$', ''));

const placeOrderButton = (getByText) => getByText('Place Order', { selector: 'button' });

const cartState = (cartItems, overrides = {}) => ({
  cart: { cartItems, shipping, payment, ...overrides },
  userSignin: { userInfo: { _id: 'user-1', token: 'jwt' } },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PlaceOrderScreen', () => {
  test('summarizes the shipping, payment and price totals of the cart', () => {
    // Arrange
    const preloadedState = cartState([cartItem()]);

    // Act
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState,
    });

    // Assert
    expect(getByText(/1 Main St/)).toBeInTheDocument();
    expect(getByText(/Payment Method: paypal/)).toBeInTheDocument();
    expect(getByText('$200')).toBeInTheDocument();
    expect(getByText('$0')).toBeInTheDocument();
    expect(getByText('$30')).toBeInTheDocument();
    expect(getByText('$230')).toBeInTheDocument();
  });

  test('charges 10 for shipping when the items total is at or below 100', () => {
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState: cartState([cartItem({ price: 100, qty: 1 })]),
    });

    expect(getByText('$10')).toBeInTheDocument();
    expect(getByText('$125')).toBeInTheDocument();
  });

  test('taxes and totals a fractional item price without rounding errors', () => {
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState: cartState([cartItem({ price: 19.99, qty: 1 })]),
    });

    expect(amountShownFor(getByText, 'Tax')).toBeCloseTo(2.9985, 4);
    expect(amountShownFor(getByText, 'Order Total')).toBeCloseTo(32.9885, 4);
  });

  test('lists the chosen wireless plan next to the phone it belongs to', () => {
    // Arrange
    const preloadedState = cartState([cartItem({ plan: go5gPlus })]);

    // Act
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState,
    });

    // Assert
    expect(getByText(/Plan: Go5G Plus \(\$90\/mo\)/)).toBeInTheDocument();
  });

  test('shows the combined monthly plan charge for every phone in the order', () => {
    const cartItems = [
      cartItem({ plan: go5gPlus }),
      cartItem({ product: 'product-2', name: 'Phone B', qty: 1, plan: { id: 'go5g', name: 'Go5G', monthlyPrice: 75 } }),
    ];
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState: cartState(cartItems),
    });

    expect(getByText('Wireless plans')).toBeInTheDocument();
    expect(getByText('$255/mo')).toBeInTheDocument();
  });

  test('hides the monthly plan charge for a device-only order', () => {
    const { queryByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState: cartState([cartItem()]),
    });

    expect(queryByText('Wireless plans')).toBeNull();
  });

  test('shows the empty-cart message when there is nothing to order', () => {
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState: cartState([]),
    });

    expect(getByText('Cart is empty')).toBeInTheDocument();
  });

  test('sends the cart items with their plans when the order is placed', async () => {
    // Arrange
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1' } } });
    const items = [cartItem({ plan: go5gPlus })];
    const { getByText } = renderWithStore(<PlaceOrderScreen {...routeProps()} />, {
      preloadedState: cartState(items),
    });

    // Act
    fireEvent.click(placeOrderButton(getByText));

    // Assert
    await wait(() => expect(Axios.post).toHaveBeenCalledTimes(1));
    expect(Axios.post).toHaveBeenCalledWith(
      '/api/orders',
      {
        orderItems: items,
        shipping,
        payment,
        itemsPrice: 200,
        shippingPrice: 0,
        taxPrice: 30,
        totalPrice: 230,
      },
      { headers: { Authorization: ' Bearer jwt' } }
    );
  });

  test('navigates to the created order once the order succeeds', async () => {
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1' } } });
    const props = routeProps();
    const { getByText } = renderWithStore(<PlaceOrderScreen {...props} />, {
      preloadedState: cartState([cartItem()]),
    });

    fireEvent.click(placeOrderButton(getByText));

    await wait(() => expect(props.history.push).toHaveBeenCalledWith('/order/order-1'));
  });

  test('stays on the page when the order request fails', async () => {
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));
    const props = routeProps();
    const { getByText } = renderWithStore(<PlaceOrderScreen {...props} />, {
      preloadedState: cartState([cartItem()]),
    });

    fireEvent.click(placeOrderButton(getByText));

    await wait(() => expect(Axios.post).toHaveBeenCalledTimes(1));
    expect(props.history.push).not.toHaveBeenCalled();
  });

  test('redirects to shipping when no shipping address has been entered', () => {
    const props = routeProps();

    renderWithStore(<PlaceOrderScreen {...props} />, {
      preloadedState: cartState([cartItem()], { shipping: {} }),
    });

    expect(props.history.push).toHaveBeenCalledWith('/shipping');
  });

  test('redirects to payment when no payment method has been chosen', () => {
    const props = routeProps();

    renderWithStore(<PlaceOrderScreen {...props} />, {
      preloadedState: cartState([cartItem()], { payment: {} }),
    });

    expect(props.history.push).toHaveBeenCalledWith('/payment');
  });
});
