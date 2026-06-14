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

    // Vendor who owns/manages this product (null = platform/admin product)
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lowStockThreshold: { type: Number, default: 5 },

    // Category hierarchy
    gender: { type: String, enum: ['men', 'women', 'kids'], required: true },
    subGender: { type: String, enum: ['boys', 'girls', 'unisex', 'none'], default: 'none' },

    // New marketplace category structure. Vendors must pick from Admin-managed
    // Category collection — category = top-level (e.g. Women), subcategory = child (e.g. Dresses).
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    type: {
      type: String,
      enum: ['shirt', 'tshirt', 'jeans', 'lowers', 'trousers', 'trouser', 'kurta', 'dress', 'top', 'skirt', 'jacket', 'shorts', 'hoodie', 'sweater', 'ethnic', 'indo-western', 'party-wear', 'westernwear', 'plus-size', 'other'],
      required: true,
    },

    images: [{ type: String }],
    thumbnail: { type: String },

    originalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },   // percentage
    price: { type: Number },                   // computed final customer price

    taxConfig: {
      isInclusive: { type: Boolean, default: true },
      basePrice: { type: Number, default: 0 },
      cgstPercent: { type: Number, default: 6 },
      sgstPercent: { type: Number, default: 6 },
      additionalCharges: { type: Number, default: 0 }
    },

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
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Auto-compute discounted price & slug before save
productSchema.pre('save', function () {
  // Compute final price based on tax config
  if (this.taxConfig && !this.taxConfig.isInclusive) {
    // Exclusive mode: price is derived from basePrice + taxes + additionalCharges, then discount is applied to it
    // Or does originalPrice act as the base?
    // Based on requirements: User enters base product price, CGST, SGST, additional charges -> Final Selling Price.
    const base = this.originalPrice; // Use originalPrice as the base price input in exclusive mode
    const taxFactor = 1 + (this.taxConfig.cgstPercent + this.taxConfig.sgstPercent) / 100;
    const finalPriceBeforeDiscount = (base * taxFactor) + this.taxConfig.additionalCharges;
    this.price = Math.round(finalPriceBeforeDiscount * (1 - this.discount / 100));
    
    // Reverse engineer basePrice after discount for invoice calculation
    this.taxConfig.basePrice = Math.round(this.price / taxFactor); 
  } else {
    // Inclusive mode: originalPrice is the final price before discount
    this.price = Math.round(this.originalPrice * (1 - this.discount / 100));
    // Determine basePrice based on default or provided CGST/SGST (usually 6% each = 12% total)
    const cgst = this.taxConfig ? this.taxConfig.cgstPercent : 6;
    const sgst = this.taxConfig ? this.taxConfig.sgstPercent : 6;
    const taxFactor = 1 + (cgst + sgst) / 100;
    
    if (!this.taxConfig) {
      this.taxConfig = { isInclusive: true, cgstPercent: 6, sgstPercent: 6, additionalCharges: 0 };
    }
    this.taxConfig.basePrice = this.price / taxFactor;
  }

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
