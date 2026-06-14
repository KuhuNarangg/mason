const mongoose = require('mongoose');

// Singleton document — always _id = 'platform'
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'platform' },
    siteName: { type: String, default: 'Mason' },
    supportEmail: { type: String, default: '' },
    supportPhone: { type: String, default: '' },

    defaultCommissionPercent: { type: Number, default: 10 },

    shippingCharge: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },

    taxConfig: {
      cgstPercent: { type: Number, default: 6 },
      sgstPercent: { type: Number, default: 6 },
    },

    returnWindowDays: { type: Number, default: 7 },

    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: '' },

    vendorAutoApprove: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
