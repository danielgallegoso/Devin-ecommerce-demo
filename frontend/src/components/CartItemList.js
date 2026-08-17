import React from 'react';
import { Link } from 'react-router-dom';

function CartItemList({ items, onQtyChange, onRemove }) {
  const editable = Boolean(onQtyChange || onRemove);
  return (
    <ul className="cart-list-container">
      <li>
        <h3>Shopping Cart</h3>
        <div>Price</div>
      </li>
      {items.length === 0 ? (
        <div>Cart is empty</div>
      ) : (
        items.map((item) => (
          <li key={item.product}>
            <div className="cart-image">
              <img src={item.image} alt="product" />
            </div>
            <div className="cart-name">
              <div>
                <Link to={'/product/' + item.product}>{item.name}</Link>
              </div>
              {editable ? (
                <div>
                  Qty:
                  <select
                    value={item.qty}
                    onChange={(e) => onQtyChange(item, e.target.value)}
                  >
                    {[...Array(item.countInStock).keys()].map((x) => (
                      <option key={x + 1} value={x + 1}>
                        {x + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="button"
                    onClick={() => onRemove(item)}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div>Qty: {item.qty}</div>
              )}
            </div>
            <div className="cart-price">${item.price}</div>
          </li>
        ))
      )}
    </ul>
  );
}

export default CartItemList;
