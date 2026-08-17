import Axios from 'axios';
import { createOrder } from './orderActions';
import {
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
} from '../constants/orderConstants';

jest.mock('axios');

const order = {
  orderItems: [{ product: 'product-1', name: 'Phone A', price: 100, qty: 2 }],
  shipping: {
    address: '1 Main St',
    city: 'Bellevue',
    postalCode: '98006',
    country: 'USA',
  },
  payment: { paymentMethod: 'paypal' },
  itemsPrice: 200,
  shippingPrice: 0,
  taxPrice: 30,
  totalPrice: 230,
};

const getState = () => ({
  userSignin: { userInfo: { _id: 'user-1', token: 'signed-token' } },
});

describe('createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dispatches the created order on success', async () => {
    // Arrange
    const dispatch = jest.fn();
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1', ...order } } });

    // Act
    await createOrder(order)(dispatch, getState);

    // Assert
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_CREATE_SUCCESS,
      payload: { _id: 'order-1', ...order },
    });
  });

  test('signals the request before calling the API', async () => {
    const dispatch = jest.fn();
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1' } } });

    await createOrder(order)(dispatch, getState);

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: ORDER_CREATE_REQUEST,
      payload: order,
    });
  });

  test('posts the order to the orders endpoint', async () => {
    const dispatch = jest.fn();
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1' } } });

    await createOrder(order)(dispatch, getState);

    expect(Axios.post.mock.calls[0][0]).toBe('/api/orders');
  });

  test('sends the untouched order payload to the API', async () => {
    const dispatch = jest.fn();
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1' } } });

    await createOrder(order)(dispatch, getState);

    expect(Axios.post.mock.calls[0][1]).toEqual(order);
  });

  test('authorizes the request with the signed-in user token', async () => {
    const dispatch = jest.fn();
    Axios.post.mockResolvedValue({ data: { data: { _id: 'order-1' } } });

    await createOrder(order)(dispatch, getState);

    expect(Axios.post.mock.calls[0][2].headers.Authorization).toContain('signed-token');
  });

  test('reports a failure instead of throwing when the API rejects', async () => {
    const dispatch = jest.fn();
    Axios.post.mockRejectedValue(new Error('Request failed with status code 401'));

    await createOrder(order)(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_CREATE_FAIL,
      payload: 'Request failed with status code 401',
    });
  });

  test('does not report success when the API rejects', async () => {
    const dispatch = jest.fn();
    Axios.post.mockRejectedValue(new Error('Network Error'));

    await createOrder(order)(dispatch, getState);

    const dispatchedTypes = dispatch.mock.calls.map(([action]) => action.type);
    expect(dispatchedTypes).not.toContain(ORDER_CREATE_SUCCESS);
  });
});
