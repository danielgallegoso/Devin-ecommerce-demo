import React from 'react';
import { render } from '@testing-library/react';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { cartReducer } from '../reducers/cartReducers';
import {
  userSigninReducer,
  userRegisterReducer,
  userUpdateReducer,
} from '../reducers/userReducers';
import {
  orderCreateReducer,
  orderDetailsReducer,
  orderPayReducer,
  myOrderListReducer,
  orderListReducer,
  orderDeleteReducer,
} from '../reducers/orderReducers';
import {
  productListReducer,
  productDetailsReducer,
  productSaveReducer,
  productDeleteReducer,
  productReviewSaveReducer,
} from '../reducers/productReducers';

const rootReducer = combineReducers({
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productSave: productSaveReducer,
  productDelete: productDeleteReducer,
  productReviewSave: productReviewSaveReducer,
  cart: cartReducer,
  userSignin: userSigninReducer,
  userRegister: userRegisterReducer,
  userUpdate: userUpdateReducer,
  orderCreate: orderCreateReducer,
  orderDetails: orderDetailsReducer,
  orderPay: orderPayReducer,
  myOrderList: myOrderListReducer,
  orderList: orderListReducer,
  orderDelete: orderDeleteReducer,
});

const createTestStore = (preloadedState = {}) =>
  createStore(rootReducer, preloadedState, applyMiddleware(thunk));

const createHistory = () => ({ push: jest.fn(), replace: jest.fn() });

const renderWithStore = (Screen, { preloadedState = {}, props = {} } = {}) => {
  const store = createTestStore(preloadedState);
  const history = props.history || createHistory();
  const screenProps = {
    history,
    location: { search: '' },
    match: { params: {} },
    ...props,
  };

  const utils = render(
    <Provider store={store}>
      <MemoryRouter>
        <Screen {...screenProps} />
      </MemoryRouter>
    </Provider>
  );

  return { ...utils, store, history };
};

export { renderWithStore, createTestStore, createHistory };
