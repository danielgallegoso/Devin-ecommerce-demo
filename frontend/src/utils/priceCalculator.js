export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_PRICE = 10;
export const TAX_RATE = 0.15;

export const calculateItemsPrice = (cartItems = []) =>
  cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.qty),
    0
  );

export const calculateShippingPrice = (itemsPrice) =>
  itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_PRICE;

export const calculateTaxPrice = (itemsPrice) => TAX_RATE * itemsPrice;

export const calculateOrderTotal = (itemsPrice) =>
  itemsPrice + calculateShippingPrice(itemsPrice) + calculateTaxPrice(itemsPrice);
