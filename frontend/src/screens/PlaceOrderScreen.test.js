import PlaceOrderScreen from './PlaceOrderScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');
jest.mock('js-cookie');

const shipping = {
  address: '1 Main St',
  city: 'Bellevue',
  postalCode: '98006',
  country: 'USA',
};
const payment = { paymentMethod: 'paypal' };

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
  cart: { cartItems, shipping, payment },
  userSignin: { userInfo: { _id: 'user-1', token: 'signed-token' } },
});

const summaryValues = (container) =>
  Array.from(
    container.querySelectorAll('.placeorder-action li div:last-child')
  ).map((node) => node.textContent);

describe('PlaceOrderScreen order summary', () => {
  test('waives shipping and charges 15% tax on a cart above the free-shipping threshold', () => {
    // Arrange
    const preloadedState = cartState([buildItem({ price: 200, qty: 1 })]);

    // Act
    const { container } = renderWithStore(PlaceOrderScreen, { preloadedState });

    // Assert
    expect(summaryValues(container)).toEqual(['$200', '$0', '$30', '$230']);
  });

  test('charges $10 shipping on a cart below the free-shipping threshold', () => {
    const { container } = renderWithStore(PlaceOrderScreen, {
      preloadedState: cartState([buildItem({ price: 50, qty: 1 })]),
    });

    expect(summaryValues(container)).toEqual(['$50', '$10', '$7.5', '$67.5']);
  });

  test('charges shipping at exactly the $100 threshold', () => {
    const { container } = renderWithStore(PlaceOrderScreen, {
      preloadedState: cartState([buildItem({ price: 100, qty: 1 })]),
    });

    expect(summaryValues(container)[1]).toBe('$10');
  });

  test('totals items, shipping and tax for a multi-line cart', () => {
    const { container } = renderWithStore(PlaceOrderScreen, {
      preloadedState: cartState([
        buildItem({ price: 100, qty: 2 }),
        buildItem({ product: 'product-2', price: 25.5, qty: 4 }),
      ]),
    });

    const [items, shippingPrice, tax, total] = summaryValues(container).map((value) =>
      Number(value.replace('$', ''))
    );
    expect(total).toBeCloseTo(items + shippingPrice + tax, 2);
  });

  test('lists every cart line item for review before submitting', () => {
    const { getByText } = renderWithStore(PlaceOrderScreen, {
      preloadedState: cartState([
        buildItem({ name: 'Phone A' }),
        buildItem({ product: 'product-2', name: 'Phone B' }),
      ]),
    });

    expect(getByText('Phone A')).toBeInTheDocument();
    expect(getByText('Phone B')).toBeInTheDocument();
  });
});

describe('PlaceOrderScreen checkout guardrails', () => {
  test('sends the customer back to shipping when no address has been saved', () => {
    const { history } = renderWithStore(PlaceOrderScreen, {
      preloadedState: {
        cart: { cartItems: [buildItem()], shipping: {}, payment },
        userSignin: {},
      },
    });

    expect(history.push).toHaveBeenCalledWith('/shipping');
  });

  test('sends the customer back to payment when no payment method has been chosen', () => {
    const { history } = renderWithStore(PlaceOrderScreen, {
      preloadedState: {
        cart: { cartItems: [buildItem()], shipping, payment: {} },
        userSignin: {},
      },
    });

    expect(history.push).toHaveBeenCalledWith('/payment');
  });

  test('stays on the review step once shipping and payment are complete', () => {
    const { history } = renderWithStore(PlaceOrderScreen, {
      preloadedState: cartState([buildItem()]),
    });

    expect(history.push).not.toHaveBeenCalled();
  });
});
