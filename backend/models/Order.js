const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentDetails: {
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String, required: true },
    razorpay_signature: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'shipped', 'delivered'],
    default: 'paid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
