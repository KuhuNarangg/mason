const mongoose = require('mongoose');

/**
 * Ad Model
 * --------
 * Represents a single ad campaign (e.g. an Instagram ad)
 * that links directly to a product.
 *
 * Flow:
 *   Instagram Ad → yoursite.com/api/v1/r/:adId
 *     → logs click → redirects to yoursite.com/product/:slug
 */
const adSchema = new mongoose.Schema(
  {
    // The product this ad promotes
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    // Ad creative / copy
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String },           // the ad banner/creative image

    // Where is this ad running?
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'google', 'whatsapp', 'twitter', 'email', 'other'],
      default: 'instagram',
    },

    // UTM tracking params (appended to redirect URL for Google Analytics etc.)
    utmSource: { type: String, default: '' },    // e.g. "instagram"
    utmMedium: { type: String, default: '' },    // e.g. "paid_social"
    utmCampaign: { type: String, default: '' },  // e.g. "summer_sale_2025"

    // Aggregated click counter (fast read without querying AdClick collection)
    clicks: { type: Number, default: 0 },

    // Schedule
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },       // null = no expiry
  },
  { timestamps: true }
);

// Virtual: is the ad currently live?
adSchema.virtual('isLive').get(function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
});

adSchema.set('toJSON', { virtuals: true });
adSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ad', adSchema);
