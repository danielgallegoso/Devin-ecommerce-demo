import { cartReducer } from './cartReducers';
import {
  CART_ADD_ITEM,
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

describe('cartReducer', () => {
  test('appends a new item to an empty cart', () => {
    // Arrange
    const state = { cartItems: [], shipping: {}, payment: {} };
    const item = buildItem();

    // Act
    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: item });

    // Assert
    expect(result.cartItems).toEqual([item]);
  });

  test('replaces the existing entry when the same product is added again', () => {
    const state = { cartItems: [buildItem({ qty: 1 })], shipping: {}, payment: {} };
    const updatedItem = buildItem({ qty: 3 });

    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: updatedItem });

    expect(result.cartItems).toHaveLength(1);
    expect(result.cartItems[0].qty).toBe(3);
  });

  test('keeps other products untouched when adding a different product', () => {
    const state = { cartItems: [buildItem()], shipping: {}, payment: {} };
    const otherItem = buildItem({ product: 'product-2', name: 'Phone B' });

    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: otherItem });

    expect(result.cartItems.map((x) => x.product)).toEqual(['product-1', 'product-2']);
  });

  test('drops the saved shipping and payment details when an item is added (known bug)', () => {
    const state = {
      cartItems: [],
      shipping: { city: 'Bellevue' },
      payment: { paymentMethod: 'paypal' },
    };

    const result = cartReducer(state, { type: CART_ADD_ITEM, payload: buildItem() });

    expect(result.shipping).toBeUndefined();
    expect(result.payment).toBeUndefined();
  });

  test('removes the item matching the product id', () => {
    const state = {
      cartItems: [buildItem(), buildItem({ product: 'product-2' })],
      shipping: {},
      payment: {},
    };

    const result = cartReducer(state, { type: CART_REMOVE_ITEM, payload: 'product-1' });

    expect(result.cartItems.map((x) => x.product)).toEqual(['product-2']);
  });

  test('leaves the cart unchanged when removing a product that is not in it', () => {
    const state = { cartItems: [buildItem()], shipping: {}, payment: {} };

    const result = cartReducer(state, { type: CART_REMOVE_ITEM, payload: 'missing' });

    expect(result.cartItems).toHaveLength(1);
  });

  test('stores the shipping address while preserving the cart items', () => {
    const state = { cartItems: [buildItem()], shipping: {}, payment: {} };
    const shipping = { address: '1 Main St', city: 'Bellevue', postalCode: '98006', country: 'USA' };

    const result = cartReducer(state, { type: CART_SAVE_SHIPPING, payload: shipping });

    expect(result.shipping).toEqual(shipping);
    expect(result.cartItems).toHaveLength(1);
  });

  test('stores the payment method while preserving the cart items', () => {
    const state = { cartItems: [buildItem()], shipping: {}, payment: {} };

    const result = cartReducer(state, {
      type: CART_SAVE_PAYMENT,
      payload: { paymentMethod: 'paypal' },
    });

    expect(result.payment).toEqual({ paymentMethod: 'paypal' });
    expect(result.cartItems).toHaveLength(1);
  });

  test('returns the initial state for an unknown action', () => {
    const result = cartReducer(undefined, { type: 'UNKNOWN' });

    expect(result).toEqual({ cartItems: [], shipping: {}, payment: {} });
  });
});
