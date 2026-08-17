import express from 'express';
import Order from '../models/orderModel';
import { isAuth, isAdmin } from '../util';
import { asyncHandler, HttpError } from '../errors';

const router = express.Router();

router.get(
  '/',
  isAuth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user');
    res.send(orders);
  })
);
router.get(
  '/mine',
  isAuth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);

router.get(
  '/:id',
  isAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id });
    if (!order) {
      throw new HttpError(404, 'Order Not Found.');
    }
    res.send(order);
  })
);

router.delete(
  '/:id',
  isAuth,
  isAdmin,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id });
    if (!order) {
      throw new HttpError(404, 'Order Not Found.');
    }
    const deletedOrder = await order.remove();
    res.send(deletedOrder);
  })
);

router.post(
  '/',
  isAuth,
  asyncHandler(async (req, res) => {
    const newOrder = new Order({
      orderItems: req.body.orderItems,
      user: req.user._id,
      shipping: req.body.shipping,
      payment: req.body.payment,
      itemsPrice: req.body.itemsPrice,
      taxPrice: req.body.taxPrice,
      shippingPrice: req.body.shippingPrice,
      totalPrice: req.body.totalPrice,
    });
    const newOrderCreated = await newOrder.save();
    res
      .status(201)
      .send({ message: 'New Order Created', data: newOrderCreated });
  })
);

router.put(
  '/:id/pay',
  isAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new HttpError(404, 'Order not found.');
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
    res.send({ message: 'Order Paid.', order: updatedOrder });
  })
);

export default router;
