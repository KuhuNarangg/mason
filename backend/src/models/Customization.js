const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productType: {
    type: String,
    required: true, // e.g., 'T-Shirt', 'Hoodie', 'Couple T-Shirts'
  },
  designType: {
    type: String, // e.g., 'Gen Z Collection', 'Couple Collection', 'Custom Upload'
  },
  material: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  printType: {
    type: String, // e.g., 'DTF', 'Screen Print', 'Embroidery'
    required: true,
  },
  quoteText: {
    type: String, // Predefined or custom entered text
  },
  customDesignUrl: {
    type: String, // Cloudinary URL for uploaded design
  },
  printPlacement: {
    type: String, // 'Front', 'Back', 'Left Chest', etc.
  },
  quantity: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'disapproved', 'quoted', 'in-progress', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'cod'],
    default: 'razorpay'
  },
  paymentId: {
    type: String
  },
  razorpayOrderId: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Customization', customizationSchema);
