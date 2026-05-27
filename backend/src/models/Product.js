const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },       // XS, S, M, L, XL, XXL, 28, 30, 32 ...
  color: { type: String, required: true },
  colorHex: { type: String, default: '#000000' },
  stock: { type: Number, default: 0 },
  sku: { type: String },
});

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    photos: [{ type: String }],
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    brand: { type: String, default: 'Unbranded' },

    // Category hierarchy
    gender: { type: String, enum: ['men', 'women', 'kids'], required: true },
    subGender: { type: String, enum: ['boys', 'girls', 'unisex', 'none'], default: 'none' },
    type: {
      type: String,
      enum: ['shirt', 'tshirt', 'jeans', 'lowers', 'trousers', 'trouser', 'kurta', 'dress', 'top', 'skirt', 'jacket', 'shorts', 'hoodie', 'sweater', 'ethnic', 'indo-western', 'party-wear', 'westernwear', 'plus-size', 'other'],
      required: true,
    },

    images: [{ type: String }],
    thumbnail: { type: String },

    originalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },   // percentage
    price: { type: Number },                   // computed

    variants: [variantSchema],
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },

    tags: [String],
    sizeGuide: [{
      size: { type: String },       // e.g. "S", "M", "L"
      chest: { type: String },      // in cm
      waist: { type: String },
      hip: { type: String },
      length: { type: String },
    }],
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isReturnable: { type: Boolean, default: true },
    returnWindow: { type: Number, default: 14 },  // days
  },
);

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Auto-compute discounted price & slug before save
productSchema.pre('save', function () {
  this.price = Math.round(this.originalPrice * (1 - this.discount / 100));
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  // Set thumbnail from first image if not set
  if (!this.thumbnail && this.images.length > 0) {
    this.thumbnail = this.images[0];
  }
});

module.exports = mongoose.model('Product', productSchema);
