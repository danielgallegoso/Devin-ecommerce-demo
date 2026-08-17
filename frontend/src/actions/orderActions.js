import Axios from "axios";
import {
  ORDER_CREATE_REQUEST, ORDER_CREATE_SUCCESS, ORDER_CREATE_FAIL,
  ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL, ORDER_PAY_REQUEST, ORDER_PAY_SUCCESS, ORDER_PAY_FAIL, MY_ORDER_LIST_REQUEST, MY_ORDER_LIST_SUCCESS, MY_ORDER_LIST_FAIL, ORDER_DELETE_REQUEST, ORDER_DELETE_SUCCESS, ORDER_DELETE_FAIL, ORDER_LIST_REQUEST, ORDER_LIST_SUCCESS, ORDER_LIST_FAIL
} from "../constants/orderConstants";
import { authConfig, createAsyncAction } from "../utils/apiClient";

const createOrder = (order) => createAsyncAction({
  types: [ORDER_CREATE_REQUEST, ORDER_CREATE_SUCCESS, ORDER_CREATE_FAIL],
  requestPayload: order,
  request: ({ userInfo }) => Axios.post("/api/orders", order, authConfig(userInfo)),
  transform: (data) => data.data
});

const listMyOrders = () => createAsyncAction({
  types: [MY_ORDER_LIST_REQUEST, MY_ORDER_LIST_SUCCESS, MY_ORDER_LIST_FAIL],
  request: ({ userInfo }) => Axios.get("/api/orders/mine", authConfig(userInfo))
});

const listOrders = () => createAsyncAction({
  types: [ORDER_LIST_REQUEST, ORDER_LIST_SUCCESS, ORDER_LIST_FAIL],
  request: ({ userInfo }) => Axios.get("/api/orders", authConfig(userInfo))
});

const detailsOrder = (orderId) => createAsyncAction({
  types: [ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL],
  requestPayload: orderId,
  request: ({ userInfo }) => Axios.get("/api/orders/" + orderId, authConfig(userInfo))
});

const payOrder = (order, paymentResult) => createAsyncAction({
  types: [ORDER_PAY_REQUEST, ORDER_PAY_SUCCESS, ORDER_PAY_FAIL],
  requestPayload: paymentResult,
  request: ({ userInfo }) => Axios.put("/api/orders/" + order._id + "/pay", paymentResult, authConfig(userInfo))
});

const deleteOrder = (orderId) => createAsyncAction({
  types: [ORDER_DELETE_REQUEST, ORDER_DELETE_SUCCESS, ORDER_DELETE_FAIL],
  requestPayload: orderId,
  request: ({ userInfo }) => Axios.delete("/api/orders/" + orderId, authConfig(userInfo))
});

export { createOrder, detailsOrder, payOrder, listMyOrders, listOrders, deleteOrder };
