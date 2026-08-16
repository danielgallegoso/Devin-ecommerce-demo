export const calculateItemsPrice = (cartItems = []) =>
  cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.qty),
    0
  );
