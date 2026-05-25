const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['order', 'promo', 'other'], default: 'order' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /orders/ORD123
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
