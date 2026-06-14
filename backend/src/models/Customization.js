const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fabric: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  measurements: {
    bust: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
    length: { type: Number }
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'disapproved', 'quoted', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  priceQuote: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Customization', customizationSchema);
