import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { getErrorMessage } from '../utils/errorMessage';
function PaypalButton({ onSuccess, onError, ...rest }) {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState('');

  const addPaypalSdk = async () => {
    try {
      const result = await axios.get("/api/config/paypal");
      const clientID = result.data;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://www.paypal.com/sdk/js?client-id=' + clientID;
      script.async = true;
      script.onload = () => {
        setSdkReady(true);
      }
      script.onerror = () => {
        setSdkError('Could not load the PayPal checkout script.');
      }
      document.body.appendChild(script);
    } catch (error) {
      setSdkError(getErrorMessage(error));
    }
  }

  const createOrder = (data, actions) => actions.order.create({
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: rest.amount
        }
      }
    ]
  });

  const reportError = (error) => {
    const message = getErrorMessage(error);
    if (onError) {
      onError(message);
      return;
    }
    setSdkError(message);
  };

  const onApprove = (data, actions) => actions.order
    .capture()
    .then(details => onSuccess(data, details))
    .catch(reportError);

  useEffect(() => {
    if (!window.paypal) {
      addPaypalSdk();
    }
    return () => {
      //
    };
  }, []);

  if (sdkError) {
    return <div>{sdkError}</div>
  }

  if (!sdkReady) {
    return <div>Loading...</div>
  }

  const Button = window.paypal.Buttons.driver('react', { React, ReactDOM });

  return <Button {...rest} createOrder={(data, actions) => createOrder(data, actions)}
    onApprove={(data, actions) => onApprove(data, actions)}
    onError={reportError} />
}

export default PaypalButton;