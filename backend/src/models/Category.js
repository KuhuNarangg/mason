const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    gender: { type: String, enum: ['men', 'women', 'kids', 'all'], required: true },
    subGender: { type: String, enum: ['boys', 'girls', 'unisex', 'none'], default: 'none' },
    // Self-reference for subcategories. Top-level categories have parent = null.
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('save', function () {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
});

module.exports = mongoose.model('Category', categorySchema);
