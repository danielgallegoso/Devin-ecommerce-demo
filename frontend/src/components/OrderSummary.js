import React from 'react';

function OrderSummary({
  itemsPrice,
  shippingPrice,
  taxPrice,
  totalPrice,
  children,
}) {
  return (
    <ul>
      {children}
      <li>
        <h3>Order Summary</h3>
      </li>
      <li>
        <div>Items</div>
        <div>${itemsPrice}</div>
      </li>
      <li>
        <div>Shipping</div>
        <div>${shippingPrice}</div>
      </li>
      <li>
        <div>Tax</div>
        <div>${taxPrice}</div>
      </li>
      <li>
        <div>Order Total</div>
        <div>${totalPrice}</div>
      </li>
    </ul>
  );
}

export default OrderSummary;
