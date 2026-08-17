import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { detailsOrder, payOrder } from '../actions/orderActions';
import PaypalButton from '../components/PaypalButton';
import CartItemList from '../components/CartItemList';
import LoadingError from '../components/LoadingError';
import OrderSummary from '../components/OrderSummary';

function OrderScreen(props) {
  const orderPay = useSelector((state) => state.orderPay);
  const { loading: loadingPay, success: successPay } = orderPay;
  const dispatch = useDispatch();
  useEffect(() => {
    if (successPay) {
      props.history.push('/profile');
    } else {
      dispatch(detailsOrder(props.match.params.id));
    }
    return () => {};
  }, [successPay]);

  const orderDetails = useSelector((state) => state.orderDetails);
  const { loading, order, error } = orderDetails;

  const handleSuccessPayment = (paymentResult) => {
    dispatch(payOrder(order, paymentResult));
  };

  return (
    <LoadingError loading={loading} error={error}>
      {() => (
        <div>
          <div className="placeorder">
            <div className="placeorder-info">
              <div>
                <h3>Shipping</h3>
                <div>
                  {order.shipping.address}, {order.shipping.city},
                  {order.shipping.postalCode}, {order.shipping.country},
                </div>
                <div>
                  {order.isDelivered
                    ? 'Delivered at ' + order.deliveredAt
                    : 'Not Delivered.'}
                </div>
              </div>
              <div>
                <h3>Payment</h3>
                <div>Payment Method: {order.payment.paymentMethod}</div>
                <div>
                  {order.isPaid ? 'Paid at ' + order.paidAt : 'Not Paid.'}
                </div>
              </div>
              <div>
                <CartItemList items={order.orderItems} />
              </div>
            </div>
            <div className="placeorder-action">
              <OrderSummary
                itemsPrice={order.itemsPrice}
                shippingPrice={order.shippingPrice}
                taxPrice={order.taxPrice}
                totalPrice={order.totalPrice}
              >
                <li className="placeorder-actions-payment">
                  {loadingPay && <div>Finishing Payment...</div>}
                  {!order.isPaid && (
                    <PaypalButton
                      amount={order.totalPrice}
                      onSuccess={handleSuccessPayment}
                    />
                  )}
                </li>
              </OrderSummary>
            </div>
          </div>
        </div>
      )}
    </LoadingError>
  );
}

export default OrderScreen;
