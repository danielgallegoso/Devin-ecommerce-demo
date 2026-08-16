import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { cartReducer } from '../reducers/cartReducers';
import {
  userSigninReducer,
  userRegisterReducer,
  userUpdateReducer,
} from '../reducers/userReducers';
import {
  productListReducer,
  productDetailsReducer,
  productReviewSaveReducer,
} from '../reducers/productReducers';
import { orderCreateReducer } from '../reducers/orderReducers';

const rootReducer = combineReducers({
  cart: cartReducer,
  orderCreate: orderCreateReducer,
  userSignin: userSigninReducer,
  userRegister: userRegisterReducer,
  userUpdate: userUpdateReducer,
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productReviewSave: productReviewSaveReducer,
});

const createTestStore = (preloadedState = {}) =>
  createStore(rootReducer, preloadedState, applyMiddleware(thunk));

const renderWithStore = (ui, { preloadedState = {}, store = createTestStore(preloadedState) } = {}) => {
  const utils = render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
  return { ...utils, store };
};

export { createTestStore, renderWithStore };
