export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 10;
export const TAX_RATE = 0.15;

export const calculateItemsPrice = (cartItems = []) =>
  cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.qty),
    0
  );

export const calculateOrderPrices = (cartItems = []) => {
  const itemsPrice = calculateItemsPrice(cartItems);
  const shippingPrice =
    itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxPrice = TAX_RATE * itemsPrice;
  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice: itemsPrice + shippingPrice + taxPrice,
  };
};
