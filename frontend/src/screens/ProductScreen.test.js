import React from 'react';
import { fireEvent, wait } from '@testing-library/react';
import Axios from 'axios';
import ProductScreen from './ProductScreen';
import { renderWithStore } from '../testUtils/renderWithStore';

jest.mock('axios');

const product = {
  _id: 'product-1',
  name: 'Phone A',
  image: '/images/a.jpg',
  price: 500,
  countInStock: 5,
  category: 'Phones',
  rating: 4,
  numReviews: 0,
  description: 'A phone',
  reviews: [],
};

const routeProps = (overrides = {}) => ({
  match: { params: { id: 'product-1' } },
  location: { search: '' },
  history: { push: jest.fn() },
  ...overrides,
});

const renderProductScreen = async (productOverrides = {}, props = routeProps()) => {
  Axios.get.mockResolvedValue({ data: { ...product, ...productOverrides } });
  const utils = renderWithStore(<ProductScreen {...props} />, {
    preloadedState: { userSignin: {} },
  });
  await wait(() => utils.getByText('Add to Cart'));
  return { ...utils, props };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProductScreen', () => {
  test('offers the three T-Mobile plans plus a device-only option for a phone', async () => {
    // Arrange
    const { getByLabelText } = await renderProductScreen();

    // Act
    const planSelect = getByLabelText('Wireless plan:');

    // Assert
    expect(Array.from(planSelect.options).map((o) => o.value)).toEqual([
      '',
      'go5g',
      'go5g-plus',
      'go5g-next',
    ]);
    expect(planSelect.value).toBe('');
  });

  test('labels each plan with its monthly price', async () => {
    const { getByText } = await renderProductScreen();

    expect(getByText('Go5G - $75/mo')).toBeInTheDocument();
    expect(getByText('Go5G Plus - $90/mo')).toBeInTheDocument();
    expect(getByText('Go5G Next - $100/mo')).toBeInTheDocument();
  });

  test('does not offer a plan for a product outside the phones category', async () => {
    const { queryByLabelText } = await renderProductScreen({ category: 'Accessories' });

    expect(queryByLabelText('Wireless plan:')).toBeNull();
  });

  test('carries the chosen plan into the cart route when adding to cart', async () => {
    // Arrange
    const { getByLabelText, getByText, props } = await renderProductScreen();

    // Act
    fireEvent.change(getByLabelText('Wireless plan:'), { target: { value: 'go5g-plus' } });
    fireEvent.click(getByText('Add to Cart'));

    // Assert
    expect(props.history.push).toHaveBeenCalledWith('/cart/product-1?qty=1&plan=go5g-plus');
  });

  test('omits the plan query when the device-only option is kept', async () => {
    const { getByText, props } = await renderProductScreen();

    fireEvent.click(getByText('Add to Cart'));

    expect(props.history.push).toHaveBeenCalledWith('/cart/product-1?qty=1');
  });

  test('keeps the selected quantity alongside the selected plan', async () => {
    const { container, getByLabelText, getByText, props } = await renderProductScreen();

    fireEvent.change(container.querySelector('select'), { target: { value: '3' } });
    fireEvent.change(getByLabelText('Wireless plan:'), { target: { value: 'go5g-next' } });
    fireEvent.click(getByText('Add to Cart'));

    expect(props.history.push).toHaveBeenCalledWith('/cart/product-1?qty=3&plan=go5g-next');
  });
});
