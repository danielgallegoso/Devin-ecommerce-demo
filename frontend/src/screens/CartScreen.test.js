import { fireEvent } from '@testing-library/react';
import CartScreen from './CartScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const buildItem = (overrides = {}) => ({
  product: 'product-1',
  name: 'Phone A',
  image: '/images/a.jpg',
  price: 100,
  countInStock: 5,
  qty: 1,
  ...overrides,
});

const cartState = (cartItems) => ({
  cart: { cartItems, shipping: {}, payment: {} },
  userSignin: {},
});

const subtotalHeading = (container) =>
  container.querySelector('.cart-action h3').textContent;

describe('CartScreen', () => {
  test('shows the running subtotal and item count for the cart', () => {
    // Arrange
    const preloadedState = cartState([
      buildItem({ price: 100, qty: 2 }),
      buildItem({ product: 'product-2', price: 25.5, qty: 4 }),
    ]);

    // Act
    const { container } = renderWithStore(CartScreen, { preloadedState });

    // Assert
    expect(subtotalHeading(container)).toContain('302');
  });

  test('counts every unit rather than every line item in the subtotal heading', () => {
    const { container } = renderWithStore(CartScreen, {
      preloadedState: cartState([
        buildItem({ qty: 2 }),
        buildItem({ product: 'product-2', qty: 3 }),
      ]),
    });

    expect(subtotalHeading(container)).toContain('5 items');
  });

  test('tells the customer the cart is empty when there is nothing in it', () => {
    const { getByText } = renderWithStore(CartScreen, {
      preloadedState: cartState([]),
    });

    expect(getByText('Cart is empty')).toBeInTheDocument();
  });

  test('blocks checkout while the cart is empty', () => {
    const { getByText } = renderWithStore(CartScreen, {
      preloadedState: cartState([]),
    });

    expect(getByText('Proceed to Checkout')).toBeDisabled();
  });

  test('allows checkout once the cart has an item', () => {
    const { getByText } = renderWithStore(CartScreen, {
      preloadedState: cartState([buildItem()]),
    });

    expect(getByText('Proceed to Checkout')).toBeEnabled();
  });

  test('sends the customer to sign-in with the shipping redirect on checkout', () => {
    const { getByText, history } = renderWithStore(CartScreen, {
      preloadedState: cartState([buildItem()]),
    });

    fireEvent.click(getByText('Proceed to Checkout'));

    expect(history.push).toHaveBeenCalledWith('/signin?redirect=shipping');
  });

  test('removes the line item from the cart when it is deleted', () => {
    const { getByText, store } = renderWithStore(CartScreen, {
      preloadedState: cartState([buildItem()]),
    });

    fireEvent.click(getByText('Delete'));

    expect(store.getState().cart.cartItems).toEqual([]);
  });

  test('drops the deleted item from the subtotal', () => {
    const { getAllByText, container } = renderWithStore(CartScreen, {
      preloadedState: cartState([
        buildItem({ price: 100, qty: 1 }),
        buildItem({ product: 'product-2', price: 40, qty: 1 }),
      ]),
    });

    fireEvent.click(getAllByText('Delete')[0]);

    expect(subtotalHeading(container)).toContain('40');
  });
});
