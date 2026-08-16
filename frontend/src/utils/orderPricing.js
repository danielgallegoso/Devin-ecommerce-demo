const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING_PRICE = 10;
const TAX_RATE = 0.15;

const calculateItemsPrice = (cartItems) =>
  cartItems.reduce((total, item) => total + item.price * item.qty, 0);

const calculateShippingPrice = (itemsPrice) =>
  itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_PRICE;

const calculateTaxPrice = (itemsPrice) => TAX_RATE * itemsPrice;

const calculateOrderPrices = (cartItems) => {
  const itemsPrice = calculateItemsPrice(cartItems);
  const shippingPrice = calculateShippingPrice(itemsPrice);
  const taxPrice = calculateTaxPrice(itemsPrice);
  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice: itemsPrice + shippingPrice + taxPrice,
  };
};

export {
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING_PRICE,
  TAX_RATE,
  calculateItemsPrice,
  calculateShippingPrice,
  calculateTaxPrice,
  calculateOrderPrices,
};
