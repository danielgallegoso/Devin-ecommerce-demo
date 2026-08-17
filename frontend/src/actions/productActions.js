import {
  PRODUCT_LIST_REQUEST,
  PRODUCT_LIST_SUCCESS,
  PRODUCT_LIST_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
  PRODUCT_SAVE_REQUEST,
  PRODUCT_SAVE_SUCCESS,
  PRODUCT_SAVE_FAIL,
  PRODUCT_DELETE_SUCCESS,
  PRODUCT_DELETE_FAIL,
  PRODUCT_DELETE_REQUEST,
  PRODUCT_REVIEW_SAVE_REQUEST,
  PRODUCT_REVIEW_SAVE_FAIL,
  PRODUCT_REVIEW_SAVE_SUCCESS,
} from '../constants/productConstants';
import axios from 'axios';
import { authConfig, createAsyncAction } from '../utils/apiClient';

const listProducts = (category = '', searchKeyword = '', sortOrder = '') =>
  createAsyncAction({
    types: [PRODUCT_LIST_REQUEST, PRODUCT_LIST_SUCCESS, PRODUCT_LIST_FAIL],
    request: () =>
      axios.get(
        '/api/products?category=' +
          category +
          '&searchKeyword=' +
          searchKeyword +
          '&sortOrder=' +
          sortOrder
      ),
  });

const saveProduct = (product) =>
  createAsyncAction({
    types: [PRODUCT_SAVE_REQUEST, PRODUCT_SAVE_SUCCESS, PRODUCT_SAVE_FAIL],
    requestPayload: product,
    request: ({ userInfo }) =>
      product._id
        ? axios.put(
            '/api/products/' + product._id,
            product,
            authConfig(userInfo)
          )
        : axios.post('/api/products', product, authConfig(userInfo)),
  });

const detailsProduct = (productId) =>
  createAsyncAction({
    types: [
      PRODUCT_DETAILS_REQUEST,
      PRODUCT_DETAILS_SUCCESS,
      PRODUCT_DETAILS_FAIL,
    ],
    requestPayload: productId,
    request: () => axios.get('/api/products/' + productId),
  });

const deleteProdcut = (productId) =>
  createAsyncAction({
    types: [
      PRODUCT_DELETE_REQUEST,
      PRODUCT_DELETE_SUCCESS,
      PRODUCT_DELETE_FAIL,
    ],
    requestPayload: productId,
    request: ({ userInfo }) =>
      axios.delete('/api/products/' + productId, authConfig(userInfo)),
  });

const saveProductReview = (productId, review) =>
  createAsyncAction({
    types: [
      PRODUCT_REVIEW_SAVE_REQUEST,
      PRODUCT_REVIEW_SAVE_SUCCESS,
      PRODUCT_REVIEW_SAVE_FAIL,
    ],
    requestPayload: review,
    request: ({ userInfo }) =>
      axios.post(
        `/api/products/${productId}/reviews`,
        review,
        authConfig(userInfo)
      ),
  });

export {
  listProducts,
  detailsProduct,
  saveProduct,
  deleteProdcut,
  saveProductReview,
};
