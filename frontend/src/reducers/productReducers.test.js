import {
  productListReducer,
  productDetailsReducer,
  productSaveReducer,
  productDeleteReducer,
  productReviewSaveReducer,
} from './productReducers';
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
  PRODUCT_REVIEW_SAVE_REQUEST,
  PRODUCT_REVIEW_SAVE_SUCCESS,
  PRODUCT_REVIEW_SAVE_FAIL,
  PRODUCT_REVIEW_SAVE_RESET,
} from '../constants/productConstants';

const product = { _id: 'product-1', name: 'Phone A', price: 100 };

describe('productListReducer', () => {
  test('clears the previous list while a new list is loading', () => {
    // Arrange
    const state = { loading: false, products: [product] };

    // Act
    const result = productListReducer(state, { type: PRODUCT_LIST_REQUEST });

    // Assert
    expect(result).toEqual({ loading: true, products: [] });
  });

  test('stores the fetched products on success', () => {
    const result = productListReducer({ loading: true, products: [] }, {
      type: PRODUCT_LIST_SUCCESS,
      payload: [product],
    });

    expect(result).toEqual({ loading: false, products: [product] });
  });

  test('stores the error on failure', () => {
    const result = productListReducer({}, { type: PRODUCT_LIST_FAIL, payload: 'Network Error' });

    expect(result).toEqual({ loading: false, error: 'Network Error' });
  });

  test('starts with an empty product list', () => {
    expect(productListReducer(undefined, { type: 'UNKNOWN' })).toEqual({ products: [] });
  });
});

describe('productDetailsReducer', () => {
  test('flags loading while the product is being fetched', () => {
    expect(productDetailsReducer({}, { type: PRODUCT_DETAILS_REQUEST })).toEqual({ loading: true });
  });

  test('stores the fetched product on success', () => {
    const result = productDetailsReducer({}, {
      type: PRODUCT_DETAILS_SUCCESS,
      payload: product,
    });

    expect(result).toEqual({ loading: false, product });
  });

  test('stores the error on failure', () => {
    const result = productDetailsReducer({}, {
      type: PRODUCT_DETAILS_FAIL,
      payload: 'Product Not Found.',
    });

    expect(result).toEqual({ loading: false, error: 'Product Not Found.' });
  });

  test('starts with a product carrying an empty review list', () => {
    expect(productDetailsReducer(undefined, { type: 'UNKNOWN' })).toEqual({
      product: { reviews: [] },
    });
  });
});

describe('productSaveReducer', () => {
  test('flags loading while the product is being saved', () => {
    expect(productSaveReducer({}, { type: PRODUCT_SAVE_REQUEST })).toEqual({ loading: true });
  });

  test('marks success and stores the saved product', () => {
    const result = productSaveReducer({}, { type: PRODUCT_SAVE_SUCCESS, payload: product });

    expect(result).toEqual({ loading: false, success: true, product });
  });

  test('stores the error on failure', () => {
    const result = productSaveReducer({}, { type: PRODUCT_SAVE_FAIL, payload: 'Unauthorized' });

    expect(result).toEqual({ loading: false, error: 'Unauthorized' });
  });
});

describe('productDeleteReducer', () => {
  test('flags loading while the product is being deleted', () => {
    expect(productDeleteReducer({}, { type: PRODUCT_DELETE_REQUEST })).toEqual({ loading: true });
  });

  test('marks success and stores the deleted product', () => {
    const result = productDeleteReducer({}, { type: PRODUCT_DELETE_SUCCESS, payload: product });

    expect(result).toEqual({ loading: false, product, success: true });
  });

  test('stores the error on failure', () => {
    const result = productDeleteReducer({}, {
      type: PRODUCT_DELETE_FAIL,
      payload: 'Admin Token is not valid.',
    });

    expect(result).toEqual({ loading: false, error: 'Admin Token is not valid.' });
  });
});

describe('productReviewSaveReducer', () => {
  test('flags loading while the review is being saved', () => {
    expect(productReviewSaveReducer({}, { type: PRODUCT_REVIEW_SAVE_REQUEST })).toEqual({
      loading: true,
    });
  });

  test('marks success and stores the saved review', () => {
    const review = { name: 'Ada', rating: 4, comment: 'Solid phone' };

    const result = productReviewSaveReducer({}, {
      type: PRODUCT_REVIEW_SAVE_SUCCESS,
      payload: review,
    });

    expect(result).toEqual({ loading: false, review, success: true });
  });

  test('stores the failure payload under the misspelled errror key (known bug)', () => {
    const result = productReviewSaveReducer({}, {
      type: PRODUCT_REVIEW_SAVE_FAIL,
      payload: 'Token is not supplied.',
    });

    expect(result).toEqual({ loading: false, errror: 'Token is not supplied.' });
    expect(result.error).toBeUndefined();
  });

  test('clears the state on reset', () => {
    const result = productReviewSaveReducer({ success: true }, {
      type: PRODUCT_REVIEW_SAVE_RESET,
    });

    expect(result).toEqual({});
  });
});
