import { cartReducer } from './cartReducers';
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING,
  CART_SAVE_PAYMENT,
} from '../constants/cartConstants';

const cartItem = (overrides = {}) => ({
  product: 'p1',
  name: 'T-Mobile Phone',
  image: '/images/phone.jpg',
  price: 199.99,
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

describe('cartReducer', () => {
  test('returns the initial state for an unknown action', () => {
    // Arrange
    const action = { type: 'UNKNOWN_ACTION' };

    // Act
    const state = cartReducer(undefined, action);

    // Assert
    expect(state).toEqual({ cartItems: [], shipping: {}, payment: {} });
  });

  test('adds a new item to an empty cart', () => {
    const item = cartItem();

    const state = cartReducer(
      { cartItems: [], shipping: {}, payment: {} },
      { type: CART_ADD_ITEM, payload: item }
    );

    expect(state.cartItems).toEqual([item]);
  });

  test('appends a second distinct product instead of replacing the first', () => {
    const existing = cartItem();
    const added = cartItem({ product: 'p2', name: 'T-Mobile Tablet' });

    const state = cartReducer(
      { cartItems: [existing], shipping: {}, payment: {} },
      { type: CART_ADD_ITEM, payload: added }
    );

    expect(state.cartItems).toEqual([existing, added]);
  });

  test('replaces the matching product rather than duplicating it when quantity changes', () => {
    // Arrange
    const existing = cartItem({ qty: 1 });
    const updated = cartItem({ qty: 3 });

    // Act
    const state = cartReducer(
      { cartItems: [existing], shipping: {}, payment: {} },
      { type: CART_ADD_ITEM, payload: updated }
    );

    // Assert
    expect(state.cartItems).toHaveLength(1);
    expect(state.cartItems[0].qty).toBe(3);
  });

  test('removes only the item matching the product id', () => {
    const kept = cartItem({ product: 'p2' });

    const state = cartReducer(
      { cartItems: [cartItem(), kept], shipping: {}, payment: {} },
      { type: CART_REMOVE_ITEM, payload: 'p1' }
    );

    expect(state.cartItems).toEqual([kept]);
  });

  test('leaves the cart untouched when removing a product that is not in it', () => {
    const items = [cartItem()];

    const state = cartReducer(
      { cartItems: items, shipping: {}, payment: {} },
      { type: CART_REMOVE_ITEM, payload: 'not-in-cart' }
    );

    expect(state.cartItems).toEqual(items);
  });

  test('saves shipping details while preserving the cart items', () => {
    const items = [cartItem()];

    const state = cartReducer(
      { cartItems: items, shipping: {}, payment: {} },
      { type: CART_SAVE_SHIPPING, payload: shipping }
    );

    expect(state).toEqual({ cartItems: items, shipping, payment: {} });
  });

  test('saves the payment method while preserving the cart items', () => {
    const items = [cartItem()];

    const state = cartReducer(
      { cartItems: items, shipping, payment: {} },
      { type: CART_SAVE_PAYMENT, payload: { paymentMethod: 'paypal' } }
    );

    expect(state).toEqual({
      cartItems: items,
      shipping,
      payment: { paymentMethod: 'paypal' },
    });
  });

  // Current behavior: CART_ADD_ITEM and CART_REMOVE_ITEM return a fresh object
  // without spreading the previous state, so saved shipping and payment details
  // are dropped when the cart is edited mid-checkout. These two tests document
  // the defect; see the tracking issue for the fix.
  test('drops saved shipping and payment when an item is added', () => {
    const state = cartReducer(
      { cartItems: [], shipping, payment: { paymentMethod: 'paypal' } },
      { type: CART_ADD_ITEM, payload: cartItem() }
    );

    expect(state.shipping).toBeUndefined();
    expect(state.payment).toBeUndefined();
  });

  test('drops saved shipping and payment when an item is removed', () => {
    const state = cartReducer(
      { cartItems: [cartItem()], shipping, payment: { paymentMethod: 'paypal' } },
      { type: CART_REMOVE_ITEM, payload: 'p1' }
    );

    expect(state.shipping).toBeUndefined();
    expect(state.payment).toBeUndefined();
  });
});
