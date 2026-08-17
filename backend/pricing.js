const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_PRICE = 10;
const TAX_RATE = 0.15;

const calculateItemsPrice = (orderItems = []) =>
  orderItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.qty),
    0
  );

const calculateShippingPrice = (itemsPrice) =>
  itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE;

const calculateTaxPrice = (itemsPrice) => TAX_RATE * itemsPrice;

const calculateOrderPricing = (orderItems = []) => {
  const itemsPrice = calculateItemsPrice(orderItems);
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
  calculateItemsPrice,
  calculateShippingPrice,
  calculateTaxPrice,
  calculateOrderPricing,
};
