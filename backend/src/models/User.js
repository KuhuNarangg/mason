const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  isDefault: { type: Boolean, default: false },
});

const vendorProfileSchema = new mongoose.Schema({
  businessName:   { type: String, default: '' },
  storeSlug:      { type: String, unique: true, sparse: true },
  storeBanner:    { type: String, default: '' },
  storeDescription: { type: String, default: '' },
  gstNumber:      { type: String, default: '' },
  panNumber:      { type: String, default: '' },
  address: {
    line1:   { type: String, default: '' },
    line2:   { type: String, default: '' },
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    pincode: { type: String, default: '' },
  },
  bankDetails: {
    accountHolder: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifsc:          { type: String, default: '' },
    bankName:      { type: String, default: '' },
  },
  commissionPercent: { type: Number, default: 10 }, // platform commission %
  rejectionReason:   { type: String, default: '' },
  approvedAt:        { type: Date },
});

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },             // optional for Google-OAuth users
    googleId: { type: String, default: '' },// Google OAuth subject ID
    role:     { type: String, enum: ['user', 'admin', 'vendor'], default: 'user' },
    avatar:   { type: String, default: '' },
    phone:    { type: String, default: '' },
    addresses: [addressSchema],
    wishlist:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    /* ── Vendor-specific fields ── */
    vendorStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected', 'suspended'],
      default: 'none',
    },
    vendorProfile: { type: vendorProfileSchema, default: () => ({}) },

    /* ── Regular login brute-force protection ── */
    loginAttempts:  { type: Number, default: 0 },
    loginLockUntil: { type: Date },

    /* ── Admin access-code brute-force protection ── */
    adminCodeAttempts:  { type: Number, default: 0 },
    adminCodeLockUntil: { type: Date },

    /* ── Vendor access-code brute-force protection ── */
    vendorCodeAttempts:  { type: Number, default: 0 },
    vendorCodeLockUntil: { type: Date },

    /* ── Custom access code (set from panel; overrides .env code) ── */
    accessCode: { type: String, select: false },

    /* ── Vendor "set password" token (sent after admin approval) ── */
    vendorSetupToken:   { type: String, select: false },
    vendorSetupExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

/* Hash password only when it is set / modified */
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* Generate a unique store slug for vendors from their business name (or display name) */
userSchema.pre('save', async function () {
  if (this.role !== 'vendor') return;
  if (this.vendorProfile?.storeSlug) return;

  const base = (this.vendorProfile?.businessName || this.name || 'store')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'store';

  let slug = base;
  let counter = 1;
  const Model = this.constructor;
  while (await Model.exists({ 'vendorProfile.storeSlug': slug, _id: { $ne: this._id } })) {
    slug = `${base}-${counter++}`;
  }
  this.vendorProfile.storeSlug = slug;
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

/* Returns true/false if a custom code is set, null if no custom code (fall back to env) */
userSchema.methods.matchAccessCode = async function (entered) {
  if (!this.accessCode) return null;
  return bcrypt.compare(String(entered), this.accessCode);
};

/* Returns true if account is currently locked */
userSchema.methods.isLoginLocked = function () {
  return !!(this.loginLockUntil && this.loginLockUntil > Date.now());
};

userSchema.methods.isAdminCodeLocked = function () {
  return !!(this.adminCodeLockUntil && this.adminCodeLockUntil > Date.now());
};

userSchema.methods.isVendorCodeLocked = function () {
  return !!(this.vendorCodeLockUntil && this.vendorCodeLockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);
