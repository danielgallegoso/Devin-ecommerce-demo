import {
  orderCreateReducer,
  orderDetailsReducer,
  orderPayReducer,
  myOrderListReducer,
  orderListReducer,
  orderDeleteReducer,
} from './orderReducers';
import {
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  ORDER_PAY_REQUEST,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
  MY_ORDER_LIST_REQUEST,
  MY_ORDER_LIST_SUCCESS,
  MY_ORDER_LIST_FAIL,
  ORDER_LIST_REQUEST,
  ORDER_LIST_SUCCESS,
  ORDER_LIST_FAIL,
  ORDER_DELETE_REQUEST,
  ORDER_DELETE_SUCCESS,
  ORDER_DELETE_FAIL,
} from '../constants/orderConstants';

const order = { _id: 'order-1', totalPrice: 230 };
const emptyOrderState = { order: { orderItems: [], shipping: {}, payment: {} } };

describe('orderCreateReducer', () => {
  test('marks the created order as successful and stores it', () => {
    // Arrange
    const action = { type: ORDER_CREATE_SUCCESS, payload: order };

    // Act
    const result = orderCreateReducer({ loading: true }, action);

    // Assert
    expect(result).toEqual({ loading: false, order, success: true });
  });

  test('flags loading while the order is being created', () => {
    expect(orderCreateReducer({}, { type: ORDER_CREATE_REQUEST })).toEqual({ loading: true });
  });

  test('stores the error on failure', () => {
    const result = orderCreateReducer({}, { type: ORDER_CREATE_FAIL, payload: 'Network Error' });

    expect(result).toEqual({ loading: false, error: 'Network Error' });
  });
});

describe('orderDetailsReducer', () => {
  test('starts with an empty order skeleton so screens can render before loading', () => {
    expect(orderDetailsReducer(undefined, { type: 'UNKNOWN' })).toEqual(emptyOrderState);
  });

  test('flags loading while the order is being fetched', () => {
    expect(orderDetailsReducer({}, { type: ORDER_DETAILS_REQUEST })).toEqual({ loading: true });
  });

  test('stores the fetched order on success', () => {
    const result = orderDetailsReducer({}, { type: ORDER_DETAILS_SUCCESS, payload: order });

    expect(result).toEqual({ loading: false, order });
  });

  test('stores the error on failure', () => {
    const result = orderDetailsReducer({}, { type: ORDER_DETAILS_FAIL, payload: 'Order Not Found.' });

    expect(result).toEqual({ loading: false, error: 'Order Not Found.' });
  });
});

describe('orderPayReducer', () => {
  test('marks the payment as successful without keeping the order payload', () => {
    const result = orderPayReducer({}, { type: ORDER_PAY_SUCCESS, payload: order });

    expect(result).toEqual({ loading: false, success: true });
  });

  test('flags loading while the payment is being processed', () => {
    expect(orderPayReducer({}, { type: ORDER_PAY_REQUEST })).toEqual({ loading: true });
  });

  test('stores the error on failure', () => {
    const result = orderPayReducer({}, { type: ORDER_PAY_FAIL, payload: 'Payment declined' });

    expect(result).toEqual({ loading: false, error: 'Payment declined' });
  });
});

describe('myOrderListReducer', () => {
  test('starts with an empty order list', () => {
    expect(myOrderListReducer(undefined, { type: 'UNKNOWN' })).toEqual({ orders: [] });
  });

  test('stores the fetched orders on success', () => {
    const result = myOrderListReducer({ orders: [] }, {
      type: MY_ORDER_LIST_SUCCESS,
      payload: [order],
    });

    expect(result).toEqual({ loading: false, orders: [order] });
  });

  test('flags loading and stores errors through the request lifecycle', () => {
    expect(myOrderListReducer({}, { type: MY_ORDER_LIST_REQUEST })).toEqual({ loading: true });
    expect(myOrderListReducer({}, { type: MY_ORDER_LIST_FAIL, payload: 'Token is not supplied.' })).toEqual({
      loading: false,
      error: 'Token is not supplied.',
    });
  });
});

describe('orderListReducer', () => {
  test('stores every order on success', () => {
    const result = orderListReducer({ orders: [] }, { type: ORDER_LIST_SUCCESS, payload: [order] });

    expect(result).toEqual({ loading: false, orders: [order] });
  });

  test('flags loading and stores errors through the request lifecycle', () => {
    expect(orderListReducer({}, { type: ORDER_LIST_REQUEST })).toEqual({ loading: true });
    expect(orderListReducer({}, { type: ORDER_LIST_FAIL, payload: 'Network Error' })).toEqual({
      loading: false,
      error: 'Network Error',
    });
  });
});

describe('orderDeleteReducer', () => {
  test('marks the deletion as successful', () => {
    expect(orderDeleteReducer({}, { type: ORDER_DELETE_SUCCESS })).toEqual({
      loading: false,
      success: true,
    });
  });

  test('flags loading and stores errors through the request lifecycle', () => {
    expect(orderDeleteReducer({}, { type: ORDER_DELETE_REQUEST })).toEqual({ loading: true });
    expect(orderDeleteReducer({}, { type: ORDER_DELETE_FAIL, payload: 'Admin Token is not valid.' })).toEqual({
      loading: false,
      error: 'Admin Token is not valid.',
    });
  });
});
