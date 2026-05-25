const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  thumbnail: String,
  variantSize: String,
  variantColor: String,
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  returnStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
    default: 'none',
  },
  returnReason: { type: String },
  returnRequestedAt: { type: Date },
  returnAdminNote: { type: String },
});

const shippingSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, unique: true },
    items: [orderItemSchema],
    shippingAddress: shippingSchema,
    paymentMethod: { type: String, default: 'razorpay' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested', 'return_requested', 'return_rejected', 'returned'],
      default: 'pending',
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String },
    cancellationRequest: {
      isRequested: { type: Boolean, default: false },
      reason: String,
      requestedAt: Date,
      adminNote: String
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', function () {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now().toString().slice(-8);
  }
});

module.exports = mongoose.model('Order', orderSchema);
