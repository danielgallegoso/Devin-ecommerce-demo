import express from 'express';
import Order from '../models/orderModel';
import Product from '../models/productModel';
import { isAuth, isAdmin } from '../util';

const router = express.Router();

const isOwnerOrAdmin = (order, user) =>
  user.isAdmin || String(order.user) === String(user._id);

const buildOrderItems = async (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    return null;
  }
  const items = [];
  for (const requested of requestedItems) {
    const qty = Number(requested && requested.qty);
    if (!Number.isInteger(qty) || qty < 1) {
      return null;
    }
    // Prices always come from the database, never from the client payload.
    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findById(requested.product).catch(() => null);
    if (!product) {
      return null;
    }
    items.push({
      name: product.name,
      qty,
      image: product.image,
      price: String(product.price),
      product: product._id,
    });
  }
  return items;
};

const calculatePrices = (orderItems) => {
  const itemsPrice = orderItems.reduce(
    (total, item) => total + Number(item.price) * item.qty,
    0
  );
  const shippingPrice = itemsPrice > 100 ? 0 : 10;
  const taxPrice = 0.15 * itemsPrice;
  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice: itemsPrice + shippingPrice + taxPrice,
  };
};

router.get('/', isAuth, isAdmin, async (req, res) => {
  const orders = await Order.find({}).populate('user');
  res.send(orders);
});

router.get('/mine', isAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.send(orders);
});

router.get('/:id', isAuth, async (req, res) => {
  const order = await Order.findById(req.params.id).catch(() => null);
  if (!order) {
    return res.status(404).send({ message: 'Order Not Found.' });
  }
  if (!isOwnerOrAdmin(order, req.user)) {
    return res.status(403).send({ message: 'Not authorized.' });
  }
  return res.send(order);
});

router.delete('/:id', isAuth, isAdmin, async (req, res) => {
  const order = await Order.findById(req.params.id).catch(() => null);
  if (order) {
    const deletedOrder = await order.remove();
    return res.send(deletedOrder);
  }
  return res.status(404).send({ message: 'Order Not Found.' });
});

router.post('/', isAuth, async (req, res) => {
  const orderItems = await buildOrderItems(req.body.orderItems);
  if (!orderItems) {
    return res.status(400).send({ message: 'Invalid Order Items.' });
  }
  const newOrder = new Order({
    orderItems,
    user: req.user._id,
    shipping: req.body.shipping,
    payment: { paymentMethod: 'paypal' },
    ...calculatePrices(orderItems),
  });
  try {
    const newOrderCreated = await newOrder.save();
    return res
      .status(201)
      .send({ message: 'New Order Created', data: newOrderCreated });
  } catch (error) {
    return res.status(400).send({ message: 'Invalid Order Data.' });
  }
});

router.put('/:id/pay', isAuth, async (req, res) => {
  const order = await Order.findById(req.params.id).catch(() => null);
  if (!order) {
    return res.status(404).send({ message: 'Order not found.' });
  }
  if (!isOwnerOrAdmin(order, req.user)) {
    return res.status(403).send({ message: 'Not authorized.' });
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.payment = {
    paymentMethod: 'paypal',
    paymentResult: {
      payerID: req.body.payerID,
      orderID: req.body.orderID,
      paymentID: req.body.paymentID,
    },
  };
  const updatedOrder = await order.save();
  return res.send({ message: 'Order Paid.', order: updatedOrder });
});

export default router;
