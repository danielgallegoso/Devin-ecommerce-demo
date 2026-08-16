import Axios from 'axios';
import {
  createOrder,
  detailsOrder,
  payOrder,
  listMyOrders,
  listOrders,
  deleteOrder,
} from './orderActions';
import {
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
  MY_ORDER_LIST_SUCCESS,
  MY_ORDER_LIST_FAIL,
  ORDER_LIST_SUCCESS,
  ORDER_LIST_FAIL,
  ORDER_DELETE_SUCCESS,
  ORDER_DELETE_FAIL,
} from '../constants/orderConstants';

jest.mock('axios');

const userInfo = { _id: 'user-1', token: 'jwt' };
const getState = () => ({ userSignin: { userInfo } });
const order = { _id: 'order-1', totalPrice: 230 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createOrder', () => {
  test('posts the order and dispatches the created order from the response envelope', async () => {
    // Arrange
    Axios.post.mockResolvedValue({ data: { data: order } });
    const dispatch = jest.fn();

    // Act
    await createOrder({ totalPrice: 230 })(dispatch, getState);

    // Assert
    expect(Axios.post).toHaveBeenCalledWith('/api/orders', { totalPrice: 230 }, {
      headers: { Authorization: ' Bearer jwt' },
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: ORDER_CREATE_REQUEST,
      payload: { totalPrice: 230 },
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: ORDER_CREATE_SUCCESS, payload: order });
  });

  test('dispatches failure with the error message when the request fails', async () => {
    Axios.post.mockRejectedValue(new Error('Token is not supplied.'));
    const dispatch = jest.fn();

    await createOrder({})(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_CREATE_FAIL,
      payload: 'Token is not supplied.',
    });
  });
});

describe('detailsOrder', () => {
  test('fetches the order by id with the bearer token', async () => {
    Axios.get.mockResolvedValue({ data: order });
    const dispatch = jest.fn();

    await detailsOrder('order-1')(dispatch, getState);

    expect(Axios.get).toHaveBeenCalledWith('/api/orders/order-1', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: ORDER_DETAILS_REQUEST,
      payload: 'order-1',
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: ORDER_DETAILS_SUCCESS, payload: order });
  });

  test('dispatches failure when the order cannot be fetched', async () => {
    Axios.get.mockRejectedValue(new Error('Order Not Found.'));
    const dispatch = jest.fn();

    await detailsOrder('missing')(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_DETAILS_FAIL,
      payload: 'Order Not Found.',
    });
  });
});

describe('payOrder', () => {
  test('sends the payment result to the pay endpoint of the order', async () => {
    Axios.put.mockResolvedValue({ data: { message: 'Order Paid.' } });
    const dispatch = jest.fn();
    const paymentResult = { payerID: 'payer-1', orderID: 'o-1', paymentID: 'p-1' };

    await payOrder(order, paymentResult)(dispatch, getState);

    expect(Axios.put).toHaveBeenCalledWith('/api/orders/order-1/pay', paymentResult, {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_PAY_SUCCESS,
      payload: { message: 'Order Paid.' },
    });
  });

  test('dispatches failure when the payment request fails', async () => {
    Axios.put.mockRejectedValue(new Error('Payment declined'));
    const dispatch = jest.fn();

    await payOrder(order, {})(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_PAY_FAIL,
      payload: 'Payment declined',
    });
  });
});

describe('listMyOrders', () => {
  test('fetches only the orders of the signed-in user', async () => {
    Axios.get.mockResolvedValue({ data: [order] });
    const dispatch = jest.fn();

    await listMyOrders()(dispatch, getState);

    expect(Axios.get).toHaveBeenCalledWith('/api/orders/mine', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: MY_ORDER_LIST_SUCCESS, payload: [order] });
  });

  test('dispatches failure when the request fails', async () => {
    Axios.get.mockRejectedValue(new Error('Network Error'));
    const dispatch = jest.fn();

    await listMyOrders()(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: MY_ORDER_LIST_FAIL,
      payload: 'Network Error',
    });
  });
});

describe('listOrders', () => {
  test('fetches every order for the admin dashboard', async () => {
    Axios.get.mockResolvedValue({ data: [order] });
    const dispatch = jest.fn();

    await listOrders()(dispatch, getState);

    expect(Axios.get).toHaveBeenCalledWith('/api/orders', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: ORDER_LIST_SUCCESS, payload: [order] });
  });

  test('dispatches failure when the request fails', async () => {
    Axios.get.mockRejectedValue(new Error('Admin Token is not valid.'));
    const dispatch = jest.fn();

    await listOrders()(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_LIST_FAIL,
      payload: 'Admin Token is not valid.',
    });
  });
});

describe('deleteOrder', () => {
  test('deletes the order by id and dispatches success', async () => {
    Axios.delete.mockResolvedValue({ data: order });
    const dispatch = jest.fn();

    await deleteOrder('order-1')(dispatch, getState);

    expect(Axios.delete).toHaveBeenCalledWith('/api/orders/order-1', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({ type: ORDER_DELETE_SUCCESS, payload: order });
  });

  test('dispatches failure when the deletion is rejected', async () => {
    Axios.delete.mockRejectedValue(new Error('Admin Token is not valid.'));
    const dispatch = jest.fn();

    await deleteOrder('order-1')(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: ORDER_DELETE_FAIL,
      payload: 'Admin Token is not valid.',
    });
  });
});
