import React, { useEffect } from 'react';
import { addToCart, removeFromCart } from '../actions/cartActions';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { WIRELESS_PLANS, isPlanEligible } from '../constants/wirelessPlans';
import {
  calculateItemsPrice,
  calculateMonthlyPlanTotal,
} from '../utils/cartPricing';
function CartScreen(props) {

  const cart = useSelector(state => state.cart);

  const { cartItems } = cart;

  const productId = props.match.params.id;
  const search = new URLSearchParams(props.location.search);
  const qty = search.get('qty') ? Number(search.get('qty')) : 1;
  const planId = search.get('plan') || '';
  const dispatch = useDispatch();
  const removeFromCartHandler = (productId) => {
    dispatch(removeFromCart(productId));
  }
  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty, planId));
    }
  }, []);

  const checkoutHandler = () => {
    props.history.push("/signin?redirect=shipping");
  }

  return <div className="cart">
    <div className="cart-list">
      <ul className="cart-list-container">
        <li>
          <h3>
            Shopping Cart
          </h3>
          <div>
            Price
          </div>
        </li>
        {
          cartItems.length === 0 ?
            <div>
              Cart is empty
          </div>
            :
            cartItems.map(item =>
              <li key={item.product}>
                <div className="cart-image">
                  <img src={item.image} alt="product" />
                </div>
                <div className="cart-name">
                  <div>
                    <Link to={"/product/" + item.product}>
                      {item.name}
                    </Link>

                  </div>
                  <div>
                    Qty:
                  <select value={item.qty} onChange={(e) => dispatch(addToCart(item.product, e.target.value, item.plan ? item.plan.id : ''))}>
                      {[...Array(item.countInStock).keys()].map(x =>
                        <option key={x + 1} value={x + 1}>{x + 1}</option>
                      )}
                    </select>
                    <button type="button" className="button" onClick={() => removeFromCartHandler(item.product)} >
                      Delete
                    </button>
                  </div>
                  {isPlanEligible(item.category) &&
                    <div>
                      Wireless plan:
                      <select
                        aria-label={'Wireless plan for ' + item.name}
                        value={item.plan ? item.plan.id : ''}
                        onChange={(e) => dispatch(addToCart(item.product, item.qty, e.target.value))}
                      >
                        <option value="">No plan (device only)</option>
                        {WIRELESS_PLANS.map(plan =>
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - ${plan.monthlyPrice}/mo
                          </option>
                        )}
                      </select>
                    </div>
                  }
                </div>
                <div className="cart-price">
                  ${item.price}
                  {item.plan &&
                    <div>+ ${item.plan.monthlyPrice}/mo</div>
                  }
                </div>
              </li>
            )
        }
      </ul>

    </div>
    <div className="cart-action">
      <h3>
        Subtotal ( {cartItems.reduce((a, c) => a + c.qty, 0)} items)
        :
         $ {calculateItemsPrice(cartItems)}
      </h3>
      {calculateMonthlyPlanTotal(cartItems) > 0 &&
        <h3>
          Wireless plans: $ {calculateMonthlyPlanTotal(cartItems)}/mo
        </h3>
      }
      <button onClick={checkoutHandler} className="button primary full-width" disabled={cartItems.length === 0}>
        Proceed to Checkout
      </button>

    </div>

  </div>
}

export default CartScreen;