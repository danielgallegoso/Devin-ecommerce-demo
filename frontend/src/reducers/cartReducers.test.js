import { cartReducer } from './cartReducers';
import {
  CART_ADD_ITEM,
  CART_ADD_ITEM_FAIL,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING,
  CART_SAVE_PAYMENT,
} from '../constants/cartConstants';

const buildItem = (overrides = {}) => ({
  product: 'product-1',
  name: 'Phone A',
  image: '/images/a.jpg',
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
const payment = { paymentMethod: 'paypal' };

describe('cartReducer', () => {
  test('appends a new item to an empty cart', () => {
    const state = { cartItems: [], shipping: {}, payment: {} };
    const item = buildItem();

    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: item });

    expect(result.cartItems).toEqual([item]);
  });

  test('replaces the existing entry when the same product is added again', () => {
    const state = { cartItems: [buildItem({ qty: 1 })], shipping: {}, payment: {} };

    const result = cartReducer(state, {
      type: CART_ADD_ITEM,
      payload: buildItem({ qty: 3 }),
    });

    expect(result.cartItems).toHaveLength(1);
    expect(result.cartItems[0].qty).toBe(3);
  });

  test('keeps the saved shipping and payment details when a new item is added', () => {
    const state = { cartItems: [], shipping, payment };

    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: buildItem() });

    expect(result.shipping).toEqual(shipping);
    expect(result.payment).toEqual(payment);
  });

  test('keeps the saved shipping and payment details when an existing item is updated', () => {
    const state = { cartItems: [buildItem()], shipping, payment };

    const result = cartReducer(state, {
      type: CART_ADD_ITEM,
      payload: buildItem({ qty: 2 }),
    });

    expect(result.shipping).toEqual(shipping);
    expect(result.payment).toEqual(payment);
  });

  test('keeps the saved shipping and payment details when an item is removed', () => {
    const state = { cartItems: [buildItem()], shipping, payment };

    const result = cartReducer(state, { type: CART_REMOVE_ITEM, payload: 'product-1' });

    expect(result.cartItems).toEqual([]);
    expect(result.shipping).toEqual(shipping);
    expect(result.payment).toEqual(payment);
  });

  test('stores the shipping address while preserving the cart items', () => {
    const state = { cartItems: [buildItem()], shipping: {}, payment: {} };

    const result = cartReducer(state, { type: CART_SAVE_SHIPPING, payload: shipping });

    expect(result.shipping).toEqual(shipping);
    expect(result.cartItems).toHaveLength(1);
  });

  test('stores the payment method while preserving the cart items', () => {
    const state = { cartItems: [buildItem()], shipping: {}, payment: {} };

    const result = cartReducer(state, { type: CART_SAVE_PAYMENT, payload: payment });

    expect(result.payment).toEqual(payment);
    expect(result.cartItems).toHaveLength(1);
  });

  test('records the failure message when adding an item fails', () => {
    // Arrange
    const state = { cartItems: [], shipping: {}, payment: {} };

    // Act
    const result = cartReducer(state, {
      type: CART_ADD_ITEM_FAIL,
      payload: 'Product Not Found.',
    });

    // Assert
    expect(result.error).toBe('Product Not Found.');
  });

  test('keeps the existing cart items when adding an item fails', () => {
    const state = { cartItems: [buildItem()], shipping, payment };

    const result = cartReducer(state, {
      type: CART_ADD_ITEM_FAIL,
      payload: 'Network Error',
    });

    expect(result.cartItems).toEqual(state.cartItems);
  });

  test('clears a previous failure message once an item is added', () => {
    const state = { cartItems: [], shipping: {}, payment: {}, error: 'Network Error' };

    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: buildItem() });

    expect(result.error).toBeUndefined();
  });

  test('returns the initial state for an unknown action', () => {
    const result = cartReducer(undefined, { type: 'UNKNOWN' });

    expect(result).toEqual({ cartItems: [], shipping: {}, payment: {} });
  });
});
