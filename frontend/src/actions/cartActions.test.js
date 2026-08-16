import Axios from 'axios';
import Cookie from 'js-cookie';
import { addToCart, removeFromCart, saveShipping, savePayment } from './cartActions';
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING,
  CART_SAVE_PAYMENT,
} from '../constants/cartConstants';

jest.mock('axios');
jest.mock('js-cookie');

const product = {
  _id: 'product-1',
  name: 'Phone A',
  image: '/images/a.jpg',
  price: 100,
  countInStock: 5,
};

const buildGetState = (cartItems) => () => ({ cart: { cartItems } });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addToCart', () => {
  test('fetches the product and dispatches it as a cart item', async () => {
    // Arrange
    Axios.get.mockResolvedValue({ data: product });
    const dispatch = jest.fn();
    const getState = buildGetState([]);

    // Act
    await addToCart('product-1', 2)(dispatch, getState);

    // Assert
    expect(Axios.get).toHaveBeenCalledWith('/api/products/product-1');
    expect(dispatch).toHaveBeenCalledWith({
      type: CART_ADD_ITEM,
      payload: {
        product: 'product-1',
        name: 'Phone A',
        image: '/images/a.jpg',
        price: 100,
        countInStock: 5,
        qty: 2,
      },
    });
  });

  test('persists the resulting cart to the cartItems cookie', async () => {
    Axios.get.mockResolvedValue({ data: product });
    const cartItems = [{ product: 'product-1', qty: 2 }];

    await addToCart('product-1', 2)(jest.fn(), buildGetState(cartItems));

    expect(Cookie.set).toHaveBeenCalledWith('cartItems', JSON.stringify(cartItems));
  });

  test('swallows the failure and dispatches nothing when the product cannot be fetched', async () => {
    Axios.get.mockRejectedValue(new Error('Network Error'));
    const dispatch = jest.fn();

    await addToCart('product-1', 1)(dispatch, buildGetState([]));

    expect(dispatch).not.toHaveBeenCalled();
    expect(Cookie.set).not.toHaveBeenCalled();
  });
});

describe('removeFromCart', () => {
  test('dispatches the removal and persists the remaining cart', () => {
    // Arrange
    const dispatch = jest.fn();
    const remaining = [{ product: 'product-2', qty: 1 }];

    // Act
    removeFromCart('product-1')(dispatch, buildGetState(remaining));

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: CART_REMOVE_ITEM, payload: 'product-1' });
    expect(Cookie.set).toHaveBeenCalledWith('cartItems', JSON.stringify(remaining));
  });
});

describe('saveShipping', () => {
  test('dispatches the shipping details unchanged', () => {
    const dispatch = jest.fn();
    const shipping = { address: '1 Main St', city: 'Bellevue', postalCode: '98006', country: 'USA' };

    saveShipping(shipping)(dispatch);

    expect(dispatch).toHaveBeenCalledWith({ type: CART_SAVE_SHIPPING, payload: shipping });
  });
});

describe('savePayment', () => {
  test('dispatches the payment details unchanged', () => {
    const dispatch = jest.fn();

    savePayment({ paymentMethod: 'paypal' })(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: CART_SAVE_PAYMENT,
      payload: { paymentMethod: 'paypal' },
    });
  });
});
