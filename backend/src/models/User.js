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

    /* ── Regular login brute-force protection ── */
    loginAttempts:  { type: Number, default: 0 },
    loginLockUntil: { type: Date },

    /* ── Admin access-code brute-force protection ── */
    adminCodeAttempts:  { type: Number, default: 0 },
    adminCodeLockUntil: { type: Date },
  },
  { timestamps: true }
);

/* Hash password only when it is set / modified */
userSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

/* Returns true if account is currently locked */
userSchema.methods.isLoginLocked = function () {
  return !!(this.loginLockUntil && this.loginLockUntil > Date.now());
};

userSchema.methods.isAdminCodeLocked = function () {
  return !!(this.adminCodeLockUntil && this.adminCodeLockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);
