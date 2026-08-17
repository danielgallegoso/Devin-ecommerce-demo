import express from 'express';
import Order from '../models/orderModel';
import { isAuth, isAdmin } from '../util';
import { calculateOrderPricing } from '../pricing';

const router = express.Router();

const canAccessOrder = (user, order) =>
  user.isAdmin || String(order.user) === String(user._id);

router.get("/", isAuth, isAdmin, async (req, res) => {
  const orders = await Order.find({}).populate('user');
  res.send(orders);
});
router.get("/mine", isAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.send(orders);
});

router.get("/:id", isAuth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id });
  if (!order) {
    return res.status(404).send("Order Not Found.");
  }
  if (!canAccessOrder(req.user, order)) {
    return res.status(401).send({ message: 'Not authorized for this order.' });
  }
  return res.send(order);
});

router.delete("/:id", isAuth, isAdmin, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id });
  if (order) {
    const deletedOrder = await order.remove();
    res.send(deletedOrder);
  } else {
    res.status(404).send("Order Not Found.")
  }
});

router.post("/", isAuth, async (req, res) => {
  const pricing = calculateOrderPricing(req.body.orderItems);
  const newOrder = new Order({
    orderItems: req.body.orderItems,
    user: req.user._id,
    shipping: req.body.shipping,
    payment: req.body.payment,
    itemsPrice: pricing.itemsPrice,
    taxPrice: pricing.taxPrice,
    shippingPrice: pricing.shippingPrice,
    totalPrice: pricing.totalPrice,
  });
  const newOrderCreated = await newOrder.save();
  res.status(201).send({ message: "New Order Created", data: newOrderCreated });
});

router.put("/:id/pay", isAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).send({ message: 'Order not found.' });
  }
  if (!canAccessOrder(req.user, order)) {
    return res.status(401).send({ message: 'Not authorized for this order.' });
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.payment = {
    paymentMethod: (order.payment && order.payment.paymentMethod) || 'paypal',
    paymentResult: {
      payerID: req.body.payerID,
      orderID: req.body.orderID,
      paymentID: req.body.paymentID
    }
  };
  const updatedOrder = await order.save();
  return res.send({ message: 'Order Paid.', order: updatedOrder });
});

export default router;