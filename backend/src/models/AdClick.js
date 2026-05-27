const mongoose = require('mongoose');

/**
 * AdClick Model
 * -------------
 * Logs every individual click on an ad redirect link.
 * Gives you full analytics: who clicked, when, from where, on what device.
 */
const adClickSchema = new mongoose.Schema(
  {
    // Which ad was clicked
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
      required: true,
    },

    // Which product the ad was for (denormalised for fast analytics queries)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    // If the user was logged in, capture their ID
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Request metadata
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    referrer: { type: String, default: '' },   // where did the click come from?

    // Parsed device info (derived from userAgent in the controller)
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
  },
  {
    timestamps: true,   // createdAt = exact click time
  }
);

// Index for fast analytics lookups
adClickSchema.index({ ad: 1, createdAt: -1 });
adClickSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model('AdClick', adClickSchema);
