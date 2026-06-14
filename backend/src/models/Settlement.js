const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    itemCount: { type: Number, required: true },
    orders: [{
      order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      itemId: { type: mongoose.Schema.Types.ObjectId },
      amount: { type: Number },
    }],
    method: { type: String, default: 'manual' },     // manual, bank_transfer, upi, etc.
    reference: { type: String, default: '' },         // transaction ref / UTR
    note: { type: String, default: '' },
    settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settlement', settlementSchema);
