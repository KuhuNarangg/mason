const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const { sendOrderConfirmation } = require('../utils/emailService');

// Initialise Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ──────────────────────────────────────────────────────────────
// @POST /api/v1/payments/create-razorpay-order
// Creates a Razorpay order for an existing pending DB order
// Body: { orderId }
// ──────────────────────────────────────────────────────────────
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  // Only the order owner can initiate payment
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorised');
  }

  // Prevent double-payment
  if (order.paymentStatus === 'paid') {
    res.status(400); throw new Error('This order has already been paid');
  }

  // Razorpay expects amount in paise (1 INR = 100 paise)
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100),
    currency: 'INR',
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  // Persist the Razorpay order ID on our DB order
  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({
    success: true,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,      // in paise
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderNumber: order.orderNumber,
  });
});

// ──────────────────────────────────────────────────────────────
// @POST /api/v1/payments/verify
// Verifies Razorpay HMAC signature and marks order as paid
// Body: { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature }
// ──────────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    res.status(400); throw new Error('Missing required payment fields');
  }

  // HMAC-SHA256 signature check
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    res.status(400); throw new Error('Payment verification failed — invalid signature');
  }

  // Mark order as paid and advance status to confirmed
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.paymentStatus = 'paid';
  order.paymentId = razorpay_payment_id;
  order.status = 'confirmed';
  order.statusHistory.push({
    status: 'confirmed',
    note: `Payment received via Razorpay. Payment ID: ${razorpay_payment_id}`,
  });
  await order.save();

  // Notify customer
  await createNotification({
    user: order.user,
    title: 'Payment Successful 🎉',
    message: `Your payment for order #${order.orderNumber} was successful. We're processing your order now.`,
    link: `/orders/${order._id}`,
  });

  const populatedUser = await User.findById(order.user);
  if (populatedUser) {
    await sendOrderConfirmation({
      name: populatedUser.name,
      email: populatedUser.email,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      items: order.items
    });
  }

  res.json({ success: true, order });
});

// ──────────────────────────────────────────────────────────────
// @POST /api/v1/payments/webhook  (optional — for server-side events)
// Razorpay sends this when payment captures/fails outside the browser
// ──────────────────────────────────────────────────────────────
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = req.headers['x-razorpay-signature'];
    const generated = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generated !== signature) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload?.payment?.entity;

  if (event === 'payment.captured' && payload) {
    // Find order by Razorpay order_id stored in notes
    const orderId = payload.notes?.orderId;
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.paymentId = payload.id;
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          note: `Payment captured via webhook. Payment ID: ${payload.id}`,
        });
        await order.save();

        const populatedUser = await User.findById(order.user);
        if (populatedUser) {
          await sendOrderConfirmation({
            name: populatedUser.name,
            email: populatedUser.email,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: order.items
          });
        }
      }
    }
  }

  if (event === 'payment.failed' && payload) {
    const orderId = payload.notes?.orderId;
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus === 'pending') {
        order.paymentStatus = 'failed';
        order.statusHistory.push({
          status: 'pending',
          note: `Payment failed. Razorpay Payment ID: ${payload.id}`,
        });
        await order.save();
      }
    }
  }

  res.json({ received: true });
});

module.exports = { createRazorpayOrder, verifyPayment, handleWebhook };
