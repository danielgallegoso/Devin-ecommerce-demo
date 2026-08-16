import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import PlaceOrderScreen from './PlaceOrderScreen';
import { createOrder } from '../actions/orderActions';

jest.mock('../actions/orderActions', () => ({
  createOrder: jest.fn((order) => ({ type: 'MOCK_ORDER_CREATE', order })),
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

const cartItem = (overrides = {}) => ({
  product: 'p1',
  name: 'T-Mobile Phone',
  image: '/images/phone.jpg',
  price: 100,
  countInStock: 5,
  qty: 1,
  ...overrides,
});

const shipping = {
  address: '1 Main St',
  city: 'Bellevue',
  postalCode: '98006',
  country: 'USA',
};

const payment = { paymentMethod: 'PayPal' };

const renderPlaceOrderScreen = ({
  cartItems = [cartItem()],
  cartShipping = shipping,
  cartPayment = payment,
  orderCreate = { loading: false, success: false, error: null, order: null },
} = {}) => {
  const store = {
    getState: () => ({
      cart: { cartItems, shipping: cartShipping, payment: cartPayment },
      orderCreate,
    }),
    subscribe: () => () => {},
    dispatch: jest.fn(),
  };
  const history = { push: jest.fn() };
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <PlaceOrderScreen history={history} />
      </MemoryRouter>
    </Provider>
  );

  return { ...view, history };
};

const summaryAmount = (container, label) => {
  const row = Array.from(container.querySelectorAll('.placeorder-action li')).find(
    (item) => item.firstChild && item.firstChild.textContent === label
  );

  return Number(row.lastChild.textContent.replace('$', ''));
};

describe('PlaceOrderScreen', () => {
  test('summarises items, free shipping and tax for an order above the shipping threshold', () => {
    // Arrange
    const cartItems = [cartItem({ price: 199.99, qty: 2 })];

    // Act
    const { container } = renderPlaceOrderScreen({ cartItems });

    // Assert
    expect(summaryAmount(container, 'Items')).toBeCloseTo(399.98, 2);
    expect(summaryAmount(container, 'Shipping')).toBe(0);
    expect(summaryAmount(container, 'Tax')).toBeCloseTo(59.997, 3);
    expect(summaryAmount(container, 'Order Total')).toBeCloseTo(459.977, 3);
  });

  test('charges flat shipping for an order at the free shipping threshold', () => {
    const { container } = renderPlaceOrderScreen({ cartItems: [cartItem({ price: 100, qty: 1 })] });

    expect(summaryAmount(container, 'Shipping')).toBe(10);
    expect(summaryAmount(container, 'Order Total')).toBeCloseTo(125, 2);
  });

  test('summarises an empty cart as shipping only', () => {
    const { container, getByText } = renderPlaceOrderScreen({ cartItems: [] });

    expect(getByText('Cart is empty')).toBeTruthy();
    expect(summaryAmount(container, 'Items')).toBe(0);
    expect(summaryAmount(container, 'Order Total')).toBe(10);
  });

  test('creates the order with the summarised prices when Place Order is clicked', () => {
    // Arrange
    const cartItems = [cartItem({ price: 100, qty: 2 })];
    const { container } = renderPlaceOrderScreen({ cartItems });

    // Act
    fireEvent.click(container.querySelector('.placeorder-action button'));

    // Assert
    expect(createOrder).toHaveBeenCalledTimes(1);
    const order = createOrder.mock.calls[0][0];
    expect(order.orderItems).toEqual(cartItems);
    expect(order.shipping).toEqual(shipping);
    expect(order.payment).toEqual(payment);
    expect(order.itemsPrice).toBe(200);
    expect(order.shippingPrice).toBe(0);
    expect(order.taxPrice).toBeCloseTo(30, 2);
    expect(order.totalPrice).toBeCloseTo(230, 2);
  });

  test('redirects to shipping when no shipping address has been captured', () => {
    const { history } = renderPlaceOrderScreen({ cartShipping: {} });

    expect(history.push).toHaveBeenCalledWith('/shipping');
  });

  test('redirects to payment when no payment method has been captured', () => {
    const { history } = renderPlaceOrderScreen({ cartPayment: {} });

    expect(history.push).toHaveBeenCalledWith('/payment');
  });

  test('redirects to the created order once the order has been placed', () => {
    const { history } = renderPlaceOrderScreen({
      orderCreate: { loading: false, success: true, error: null, order: { _id: 'o42' } },
    });

    expect(history.push).toHaveBeenCalledWith('/order/o42');
  });
});
