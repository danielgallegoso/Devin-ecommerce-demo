import axios from 'axios';
import {
  listProducts,
  detailsProduct,
  saveProduct,
  deleteProdcut,
  saveProductReview,
} from './productActions';
import {
  PRODUCT_LIST_REQUEST,
  PRODUCT_LIST_SUCCESS,
  PRODUCT_LIST_FAIL,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
  PRODUCT_SAVE_SUCCESS,
  PRODUCT_SAVE_FAIL,
  PRODUCT_DELETE_SUCCESS,
  PRODUCT_DELETE_FAIL,
  PRODUCT_REVIEW_SAVE_SUCCESS,
  PRODUCT_REVIEW_SAVE_FAIL,
} from '../constants/productConstants';

jest.mock('axios');

const userInfo = { _id: 'user-1', token: 'jwt' };
const getState = () => ({ userSignin: { userInfo } });
const product = { _id: 'product-1', name: 'Phone A', price: 100 };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listProducts', () => {
  test('requests the catalogue with empty filters by default', async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: [product] });
    const dispatch = jest.fn();

    // Act
    await listProducts()(dispatch);

    // Assert
    expect(axios.get).toHaveBeenCalledWith(
      '/api/products?category=&searchKeyword=&sortOrder='
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, { type: PRODUCT_LIST_REQUEST });
    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_LIST_SUCCESS,
      payload: [product],
    });
  });

  test('passes the category, keyword and sort order through to the query string', async () => {
    axios.get.mockResolvedValue({ data: [] });

    await listProducts('Phones', 'galaxy', 'lowest')(jest.fn());

    expect(axios.get).toHaveBeenCalledWith(
      '/api/products?category=Phones&searchKeyword=galaxy&sortOrder=lowest'
    );
  });

  test('dispatches failure when the catalogue cannot be fetched', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));
    const dispatch = jest.fn();

    await listProducts()(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_LIST_FAIL,
      payload: 'Network Error',
    });
  });
});

describe('detailsProduct', () => {
  test('fetches the product by id', async () => {
    axios.get.mockResolvedValue({ data: product });
    const dispatch = jest.fn();

    await detailsProduct('product-1')(dispatch);

    expect(axios.get).toHaveBeenCalledWith('/api/products/product-1');
    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_DETAILS_SUCCESS,
      payload: product,
    });
  });

  test('dispatches failure when the product is missing', async () => {
    axios.get.mockRejectedValue(new Error('Product Not Found.'));
    const dispatch = jest.fn();

    await detailsProduct('missing')(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_DETAILS_FAIL,
      payload: 'Product Not Found.',
    });
  });
});

describe('saveProduct', () => {
  test('creates a product with POST when it has no id yet', async () => {
    // Arrange
    axios.post.mockResolvedValue({ data: product });
    const newProduct = { name: 'Phone A', price: 100 };
    const dispatch = jest.fn();

    // Act
    await saveProduct(newProduct)(dispatch, getState);

    // Assert
    expect(axios.post).toHaveBeenCalledWith('/api/products', newProduct, {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(axios.put).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenLastCalledWith({ type: PRODUCT_SAVE_SUCCESS, payload: product });
  });

  test('updates an existing product with PUT when it already has an id', async () => {
    axios.put.mockResolvedValue({ data: product });
    const dispatch = jest.fn();

    await saveProduct(product)(dispatch, getState);

    expect(axios.put).toHaveBeenCalledWith('/api/products/product-1', product, {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(axios.post).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenLastCalledWith({ type: PRODUCT_SAVE_SUCCESS, payload: product });
  });

  test('dispatches failure when saving is rejected', async () => {
    axios.post.mockRejectedValue(new Error('Admin Token is not valid.'));
    const dispatch = jest.fn();

    await saveProduct({ name: 'Phone A' })(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_SAVE_FAIL,
      payload: 'Admin Token is not valid.',
    });
  });
});

describe('deleteProdcut', () => {
  test('deletes the product with the admin bearer token', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'Product Deleted' } });
    const dispatch = jest.fn();

    await deleteProdcut('product-1')(dispatch, getState);

    expect(axios.delete).toHaveBeenCalledWith('/api/products/product-1', {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_DELETE_SUCCESS,
      payload: { message: 'Product Deleted' },
      success: true,
    });
  });

  test('dispatches failure when the deletion is rejected', async () => {
    axios.delete.mockRejectedValue(new Error('Admin Token is not valid.'));
    const dispatch = jest.fn();

    await deleteProdcut('product-1')(dispatch, getState);

    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_DELETE_FAIL,
      payload: 'Admin Token is not valid.',
    });
  });
});

describe('saveProductReview', () => {
  test('posts the review to the product review endpoint', async () => {
    const review = { name: 'Ada', rating: 4, comment: 'Solid phone' };
    axios.post.mockResolvedValue({ data: review });
    const dispatch = jest.fn();

    await saveProductReview('product-1', review)(dispatch, getState);

    expect(axios.post).toHaveBeenCalledWith('/api/products/product-1/reviews', review, {
      headers: { Authorization: 'Bearer jwt' },
    });
    expect(dispatch).toHaveBeenLastCalledWith({
      type: PRODUCT_REVIEW_SAVE_SUCCESS,
      payload: review,
    });
  });

  test('dispatches failure when the reviewer is not signed in', async () => {
    const dispatch = jest.fn();

    await saveProductReview('product-1', {})(dispatch, () => ({ userSignin: {} }));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(PRODUCT_REVIEW_SAVE_FAIL);
  });
});
