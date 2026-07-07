const mongoose = require('mongoose');

const restockNotificationSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    size: {
      type: String
    },
    color: {
      type: String
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    isNotified: {
      type: Boolean,
      default: false
    },
    notifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index on (product, variantId, email) to prevent duplicate subscriptions to the same variant
restockNotificationSchema.index({ product: 1, variantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('RestockNotification', restockNotificationSchema);
