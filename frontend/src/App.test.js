import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { render, fireEvent, cleanup } from '@testing-library/react';
import App from './App';
import { PLANS } from './utils/plans';

afterEach(cleanup);

const renderAt = (path, userInfo = null) => {
  window.history.pushState({}, '', path);
  const store = createStore(() => ({
    cart: { cartItems: [], shipping: {}, payment: {} },
    userSignin: { userInfo },
  }));

  return render(
    <Provider store={store}>
      <App />
    </Provider>
  );
};

const headerLink = (container, text) =>
  Array.from(container.querySelectorAll('.header-links a')).find(
    (link) => link.textContent === text
  );

describe('App', () => {
  test('links to the plans page from the header', () => {
    // Arrange
    const { container } = renderAt('/signin');

    // Act
    const plansLink = headerLink(container, 'Plans');

    // Assert
    expect(plansLink.getAttribute('href')).toBe('/plans');
  });

  test('renders the plans screen on the /plans route', () => {
    const { container } = renderAt('/plans');

    expect(container.querySelectorAll('.plan-card')).toHaveLength(PLANS.length);
  });

  test('does not render the plans screen on an unrelated route', () => {
    const { container } = renderAt('/signin');

    expect(container.querySelectorAll('.plan-card')).toHaveLength(0);
  });

  test('navigates to the plans screen when the header plans link is clicked', () => {
    // Arrange
    const { container } = renderAt('/signin');

    // Act
    fireEvent.click(headerLink(container, 'Plans'));

    // Assert
    expect(container.querySelectorAll('.plan-card')).toHaveLength(PLANS.length);
    expect(container.querySelector('.form')).toBeNull();
  });
});
