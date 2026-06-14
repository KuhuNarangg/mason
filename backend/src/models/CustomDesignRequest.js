const mongoose = require('mongoose');

const customDesignRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  selectedColor: {
    type: String,
    required: true
  },
  selectedFabric: {
    type: String,
    required: true
  },
  selectedStyle: {
    type: String,
    required: true
  },

  size: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'custom'],
    required: true
  },

  measurements: {
    bust: { type: String, default: '' },
    waist: { type: String, default: '' },
    hip: { type: String, default: '' },
    shoulder: { type: String, default: '' },
    sleeveLength: { type: String, default: '' },
    neck: { type: String, default: '' },
    height: { type: String, default: '' }
  },

  notes: {
    type: String,
    default: ''
  },

  referenceImages: [{
    type: String
  }], // Cloudinary image URLs

  quotedPrice: {
    type: Number,
    default: 0
  },
  productionDays: {
    type: Number,
    default: 0
  },
  vendorMessage: {
    type: String,
    default: ''
  },
  rejectionReason: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: ['draft', 'submitted', 'quoted', 'accepted', 'rejected', 'production', 'ready', 'shipped', 'delivered'],
    default: 'draft'
  },

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },

  // Dispute resolution fields
  dispute: {
    isDisputed: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    resolution: { type: String, enum: ['none', 'refund', 'replace', 'rejected'], default: 'none' },
    resolvedAt: { type: Date },
    adminNotes: { type: String, default: '' }
  },

  // Razorpay payment details
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CustomDesignRequest', customDesignRequestSchema);
