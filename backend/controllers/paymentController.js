const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt_order_1' } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify payment signature and save order
// @route   POST /api/payment/verify-payment
// @access  Public
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerDetails,
      products,
      totalAmount,
      userId
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Save order to DB
      const newOrder = await Order.create({
        userId: userId || null,
        customerDetails,
        products,
        totalAmount,
        paymentDetails: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
        status: 'paid'
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        orderId: newOrder._id
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid signature',
      });
    }
  } catch (error) {
    next(error);
  }
};
