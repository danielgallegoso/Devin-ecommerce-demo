import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import CartScreen from './CartScreen';
import { addToCart, removeFromCart } from '../actions/cartActions';

jest.mock('../actions/cartActions', () => ({
  addToCart: jest.fn((product, qty) => ({ type: 'MOCK_CART_ADD_ITEM', product, qty })),
  removeFromCart: jest.fn((product) => ({ type: 'MOCK_CART_REMOVE_ITEM', product })),
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

const cartItem = (overrides = {}) => ({
  product: 'p1',
  name: 'T-Mobile Phone',
  image: '/images/phone.jpg',
  price: 199.99,
  countInStock: 5,
  qty: 1,
  ...overrides,
});

const renderCartScreen = ({ cartItems = [], routeProductId, search = '' } = {}) => {
  const dispatch = jest.fn();
  const store = {
    getState: () => ({ cart: { cartItems, shipping: {}, payment: {} } }),
    subscribe: () => () => {},
    dispatch,
  };
  const history = { push: jest.fn() };
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <CartScreen
          match={{ params: { id: routeProductId } }}
          location={{ search }}
          history={history}
        />
      </MemoryRouter>
    </Provider>
  );

  return { ...view, dispatch, history };
};

const subtotalText = (container) => container.querySelector('.cart-action h3').textContent;

const checkoutButton = (container) => container.querySelector('.cart-action button');

describe('CartScreen', () => {
  test('shows the subtotal as the sum of price times quantity for every item', () => {
    // Arrange
    const cartItems = [
      cartItem({ price: 100, qty: 2 }),
      cartItem({ product: 'p2', price: 25.5, qty: 4 }),
    ];

    // Act
    const { container } = renderCartScreen({ cartItems });

    // Assert
    expect(subtotalText(container)).toContain('$ 302');
  });

  test('shows the total number of units in the cart, not the number of line items', () => {
    const { container } = renderCartScreen({
      cartItems: [cartItem({ qty: 2 }), cartItem({ product: 'p2', qty: 3 })],
    });

    expect(subtotalText(container)).toContain('( 5 items)');
  });

  test('keeps floating point drift out of a decimal subtotal', () => {
    const { container } = renderCartScreen({ cartItems: [cartItem({ price: 19.99, qty: 3 })] });

    const subtotal = Number(subtotalText(container).split('$')[1]);
    expect(subtotal).toBeCloseTo(59.97, 2);
  });

  test('shows a zero subtotal and an empty cart message for an empty cart', () => {
    const { container, getByText } = renderCartScreen({ cartItems: [] });

    expect(getByText('Cart is empty')).toBeTruthy();
    expect(subtotalText(container)).toContain('$ 0');
  });

  test('disables the checkout button while the cart is empty', () => {
    const { container } = renderCartScreen({ cartItems: [] });

    expect(checkoutButton(container).disabled).toBe(true);
  });

  test('enables the checkout button once the cart has an item', () => {
    const { container } = renderCartScreen({ cartItems: [cartItem()] });

    expect(checkoutButton(container).disabled).toBe(false);
  });

  test('sends the shopper to sign in with a shipping redirect on checkout', () => {
    // Arrange
    const { container, history } = renderCartScreen({ cartItems: [cartItem()] });

    // Act
    fireEvent.click(checkoutButton(container));

    // Assert
    expect(history.push).toHaveBeenCalledWith('/signin?redirect=shipping');
  });

  test('adds the routed product with the quantity from the query string on mount', () => {
    renderCartScreen({ routeProductId: 'p9', search: '?qty=3' });

    expect(addToCart).toHaveBeenCalledWith('p9', 3);
  });

  test('adds the routed product with a quantity of one when the query string is absent', () => {
    renderCartScreen({ routeProductId: 'p9' });

    expect(addToCart).toHaveBeenCalledWith('p9', 1);
  });

  test('does not add anything on mount when no product is routed', () => {
    renderCartScreen({ cartItems: [cartItem()] });

    expect(addToCart).not.toHaveBeenCalled();
  });

  test('removes the item from the cart when its delete button is clicked', () => {
    // Arrange
    const { container } = renderCartScreen({ cartItems: [cartItem({ product: 'p7' })] });

    // Act
    fireEvent.click(container.querySelector('.cart-name button'));

    // Assert
    expect(removeFromCart).toHaveBeenCalledWith('p7');
  });
});
