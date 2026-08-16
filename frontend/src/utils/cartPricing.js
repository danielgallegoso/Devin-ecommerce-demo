export function calculateItemsPrice(cartItems) {
  return cartItems.reduce((total, item) => total + item.price * item.qty, 0);
}

export function calculateMonthlyPlanTotal(cartItems) {
  return cartItems.reduce(
    (total, item) => (item.plan ? total + item.plan.monthlyPrice * item.qty : total),
    0
  );
}
