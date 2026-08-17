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
  PRODUCT_DELETE_REQUEST,
  PRODUCT_DELETE_SUCCESS,
  PRODUCT_DELETE_FAIL,
  PRODUCT_REVIEW_SAVE_SUCCESS,
  PRODUCT_REVIEW_SAVE_REQUEST,
  PRODUCT_REVIEW_SAVE_FAIL,
  PRODUCT_REVIEW_SAVE_RESET,
} from '../constants/productConstants';
import { createRequestReducer } from '../utils/createRequestReducer';

const productListReducer = createRequestReducer({
  types: [PRODUCT_LIST_REQUEST, PRODUCT_LIST_SUCCESS, PRODUCT_LIST_FAIL],
  successKey: 'products',
  initialState: { products: [] },
  requestState: { products: [] },
});

const productDetailsReducer = createRequestReducer({
  types: [
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
  ],
  successKey: 'product',
  initialState: { product: { reviews: [] } },
});

const productDeleteReducer = createRequestReducer({
  types: [PRODUCT_DELETE_REQUEST, PRODUCT_DELETE_SUCCESS, PRODUCT_DELETE_FAIL],
  successKey: 'product',
  successFlag: true,
  initialState: { product: {} },
});

const productSaveReducer = createRequestReducer({
  types: [PRODUCT_SAVE_REQUEST, PRODUCT_SAVE_SUCCESS, PRODUCT_SAVE_FAIL],
  successKey: 'product',
  successFlag: true,
  initialState: { product: {} },
});

const productReviewSaveReducer = createRequestReducer({
  types: [
    PRODUCT_REVIEW_SAVE_REQUEST,
    PRODUCT_REVIEW_SAVE_SUCCESS,
    PRODUCT_REVIEW_SAVE_FAIL,
  ],
  resetType: PRODUCT_REVIEW_SAVE_RESET,
  successKey: 'review',
  successFlag: true,
});

export {
  productListReducer,
  productDetailsReducer,
  productSaveReducer,
  productDeleteReducer,
  productReviewSaveReducer,
};
