import {
  ORDER_CREATE_REQUEST, ORDER_CREATE_SUCCESS, ORDER_CREATE_FAIL,
  ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL,
  ORDER_PAY_REQUEST, ORDER_PAY_SUCCESS, ORDER_PAY_FAIL,
  MY_ORDER_LIST_REQUEST, MY_ORDER_LIST_SUCCESS, MY_ORDER_LIST_FAIL,
  ORDER_LIST_REQUEST, ORDER_LIST_SUCCESS, ORDER_LIST_FAIL, ORDER_DELETE_REQUEST, ORDER_DELETE_SUCCESS, ORDER_DELETE_FAIL
} from "../constants/orderConstants";
import { createRequestReducer } from "../utils/createRequestReducer";

const emptyOrderState = {
  order: {
    orderItems: [],
    shipping: {},
    payment: {}
  }
};

const orderCreateReducer = createRequestReducer({
  types: [ORDER_CREATE_REQUEST, ORDER_CREATE_SUCCESS, ORDER_CREATE_FAIL],
  successKey: 'order',
  successFlag: true
});

const orderDetailsReducer = createRequestReducer({
  types: [ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL],
  successKey: 'order',
  initialState: emptyOrderState
});

const myOrderListReducer = createRequestReducer({
  types: [MY_ORDER_LIST_REQUEST, MY_ORDER_LIST_SUCCESS, MY_ORDER_LIST_FAIL],
  successKey: 'orders',
  initialState: { orders: [] }
});

const orderListReducer = createRequestReducer({
  types: [ORDER_LIST_REQUEST, ORDER_LIST_SUCCESS, ORDER_LIST_FAIL],
  successKey: 'orders',
  initialState: { orders: [] }
});

const orderPayReducer = createRequestReducer({
  types: [ORDER_PAY_REQUEST, ORDER_PAY_SUCCESS, ORDER_PAY_FAIL],
  successFlag: true,
  initialState: emptyOrderState
});

const orderDeleteReducer = createRequestReducer({
  types: [ORDER_DELETE_REQUEST, ORDER_DELETE_SUCCESS, ORDER_DELETE_FAIL],
  successFlag: true,
  initialState: emptyOrderState
});

export {
  orderCreateReducer, orderDetailsReducer,
  orderPayReducer, myOrderListReducer, orderListReducer, orderDeleteReducer
}
