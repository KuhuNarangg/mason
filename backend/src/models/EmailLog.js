const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String }, // Store the HTML content if needed
  status: { type: String, enum: ['sent', 'failed'], required: true },
  error: { type: String },
  sentAt: { type: Date, default: Date.now },
});

emailLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
