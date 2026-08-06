const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  thumbnail: String,
  variantSize: String,
  variantColor: String,
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  cgstPercent: { type: Number, default: 6 },
  sgstPercent: { type: Number, default: 6 },
  returnStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
    default: 'none',
  },
  returnReason: { type: String },
  returnRequestedAt: { type: Date },
  returnAdminNote: { type: String },
  refundId:     { type: String },   // Razorpay refund ID for this item
  refundAmount: { type: Number },   // Actual refunded amount for this item

  /* ── Vendor fulfilment fields ── */
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  itemStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  itemStatusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
    },
  ],
  trackingNumber: { type: String, default: '' },
  shippingCarrier: { type: String, default: '' },
  shippingLabelUrl: { type: String, default: '' },
  shiprocketOrderId: { type: String, default: '' },
  shiprocketShipmentId: { type: String, default: '' },
  shippingStatus: { type: String, default: '' },
  returnTrackingNumber: { type: String, default: '' },
  returnShipmentId: { type: String, default: '' },
  commissionPercent: { type: Number, default: 10 },
  commissionAmount: { type: Number, default: 0 },
  vendorEarning: { type: Number, default: 0 },
  payoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
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
    paymentId: { type: String },           // Razorpay payment_id after capture
    razorpayOrderId: { type: String },     // Razorpay order_id (rzp_order_xxx)
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'cancel_requested', 'return_requested', 'return_rejected', 'returned'],
      default: 'pending',
    },
    trackingUrl: { type: String, default: '' },
    billUrl: { type: String, default: '' },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    customerNotes: { type: String, default: '' },
    notes: { type: String },
    adminNotes: { type: String, default: '' },
    cancellationRequest: {
      isRequested: { type: Boolean, default: false },
      reason: String,
      requestedAt: Date,
      adminNote: String
    },
    // Order-level refund (full cancellation refund)
    refundId:     { type: String },
    refundAmount: { type: Number },
    refundStatus: { type: String, enum: ['none', 'initiated', 'failed'], default: 'none' },
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

orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.vendor': 1 });

// Auto-generate order number
orderSchema.pre('save', function () {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD' + Date.now().toString().slice(-8);
  }
});

module.exports = mongoose.model('Order', orderSchema);
