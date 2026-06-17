const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendWelcomeEmail, sendAdminLockoutAlert, sendVendorRegistrationReceived } = require('../utils/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const MAX_LOGIN_ATTEMPTS   = 5;
const LOGIN_LOCK_MINUTES   = 15;
const MAX_CODE_ATTEMPTS    = 5;
const CODE_LOCK_MINUTES    = 2;

/* ── helpers ──────────────────────────────────────── */
const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email,
  role: u.role, avatar: u.avatar,
  vendorStatus: u.vendorStatus,
  vendorProfile: u.role === 'vendor' ? u.vendorProfile : undefined,
});

/* ── @POST /api/v1/auth/register ──────────────────── */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400); throw new Error('All fields are required');
  }
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  const user = await User.create({ name, email, password });
  sendWelcomeEmail({ name: user.name, email: user.email }).catch(() => {});
  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: safeUser(user),
  });
});

/* ── @POST /api/v1/auth/login ─────────────────────── */
const login = asyncHandler(async (req, res) => {
  const { email, password, code } = req.body;
  const user = await User.findOne({ email }).select('+accessCode');

  /* Unknown email — don't reveal info */
  if (!user) { res.status(401); throw new Error('ID or password or code is wrong, please try again'); }

  /* ── Role-specific lockout check ── */
  if (user.role === 'admin') {
    if (user.isAdminCodeLocked()) {
      res.status(429);
      throw new Error('Please try after 2 minutes');
    }
  } else if (user.role === 'vendor') {
    if (user.isVendorCodeLocked()) {
      res.status(429);
      throw new Error('Please try after 2 minutes');
    }
  } else {
    if (user.isLoginLocked()) {
      res.status(429);
      throw new Error('Please try after 2 minutes');
    }
  }

  /* ── Require verification code for admin / vendor ── */
  if (user.role === 'admin' && !code) {
    res.status(400); throw new Error('Admin verification code is required');
  }
  if (user.role === 'vendor' && !code) {
    res.status(400); throw new Error('Vendor verification code is required');
  }

  /* ── Validate credentials ── */
  const passwordMatch = await user.matchPassword(password);

  let codeMatch = true;
  if (user.role === 'admin') {
    const dbResult = await user.matchAccessCode(code);
    if (dbResult === null) {
      codeMatch = String(code) === (process.env.ADMIN_ACCESS_CODE || '31082005');
    } else {
      codeMatch = dbResult;
    }
  } else if (user.role === 'vendor') {
    const dbResult = await user.matchAccessCode(code);
    if (dbResult === null) {
      codeMatch = String(code) === (process.env.VENDOR_ACCESS_CODE || '20050831');
    } else {
      codeMatch = dbResult;
    }
  }

  if (!passwordMatch || !codeMatch) {
    /* ── Track failed attempts per role ── */
    if (user.role === 'admin') {
      user.adminCodeAttempts += 1;
      if (user.adminCodeAttempts >= MAX_CODE_ATTEMPTS) {
        user.adminCodeLockUntil = new Date(Date.now() + CODE_LOCK_MINUTES * 60 * 1000);
        user.adminCodeAttempts = 0;
        sendAdminLockoutAlert({
          adminEmail: user.email, ipAddress: req.ip,
          attempts: MAX_CODE_ATTEMPTS, lockUntil: user.adminCodeLockUntil,
        }).catch(() => {});
      }
      await user.save();
      res.status(401);
      throw new Error('ID or password or code is wrong, please try again');

    } else if (user.role === 'vendor') {
      user.vendorCodeAttempts += 1;
      if (user.vendorCodeAttempts >= MAX_CODE_ATTEMPTS) {
        user.vendorCodeLockUntil = new Date(Date.now() + CODE_LOCK_MINUTES * 60 * 1000);
        user.vendorCodeAttempts = 0;
      }
      await user.save();
      res.status(401);
      throw new Error('ID or password or code is wrong, please try again');

    } else {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.loginLockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();
      res.status(401);
      throw new Error('ID or password is wrong, please try again');
    }
  }

  /* ── Successful login — reset counters ── */
  if (user.role === 'admin') {
    user.adminCodeAttempts = 0;
    user.adminCodeLockUntil = undefined;
  } else if (user.role === 'vendor') {
    user.vendorCodeAttempts = 0;
    user.vendorCodeLockUntil = undefined;
  } else {
    user.loginAttempts = 0;
    user.loginLockUntil = undefined;
  }
  await user.save();

  /* Admin gets a short-lived token marked as verified */
  if (user.role === 'admin') {
    const token = jwt.sign({ id: user._id, adminVerified: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token, user: safeUser(user) });
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: safeUser(user),
  });
});

/* ── @GET /api/v1/auth/check-role ─────────────────── */
const checkRole = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ role: null });
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('role');
  res.json({ role: user?.role || null });
});

/* ── @POST /api/v1/auth/admin-verify-code ─────────── */
const adminVerifyCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const user = req.user; // set by protect middleware

  if (user.role !== 'admin') {
    res.status(403); throw new Error('Not authorised');
  }

  /* Code locked? */
  if (user.isAdminCodeLocked()) {
    const secsLeft = Math.ceil((user.adminCodeLockUntil - Date.now()) / 1000);
    res.status(429);
    throw new Error(`Admin code locked. Try again in ${secsLeft}s.`);
  }

  const correctCode = process.env.ADMIN_ACCESS_CODE || '12345678';

  if (String(code) !== correctCode) {
    user.adminCodeAttempts += 1;

    if (user.adminCodeAttempts >= MAX_CODE_ATTEMPTS) {
      user.adminCodeLockUntil = new Date(Date.now() + CODE_LOCK_MINUTES * 60 * 1000);
      user.adminCodeAttempts = 0;
      await user.save();

      /* Send alert email */
      sendAdminLockoutAlert({
        adminEmail: user.email,
        ipAddress: req.ip,
        attempts: MAX_CODE_ATTEMPTS,
        lockUntil: user.adminCodeLockUntil,
      }).catch(() => {});

      res.status(429);
      throw new Error(`Too many wrong codes. Admin access locked for ${CODE_LOCK_MINUTES} min. A security alert has been sent to your email.`);
    }

    await user.save();
    const remaining = MAX_CODE_ATTEMPTS - user.adminCodeAttempts;
    res.status(401);
    throw new Error(`Wrong access code. ${remaining} attempt(s) remaining.`);
  }

  /* Correct — reset counters, return admin-verified token */
  user.adminCodeAttempts = 0;
  user.adminCodeLockUntil = undefined;
  await user.save();

  /* Issue a new token with adminVerified claim */
  const token = jwt.sign(
    { id: user._id, adminVerified: true },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ success: true, token, user: safeUser(user) });
});

/* ── @POST /api/v1/auth/google ────────────────────── */
const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) { res.status(400); throw new Error('Google credential required'); }

  if (!process.env.GOOGLE_CLIENT_ID) {
    res.status(503); throw new Error('Google OAuth not configured on server');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  /* Find or create user */
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    user = await User.create({ name, email, googleId, avatar: picture });
    sendWelcomeEmail({ name, email }).catch(() => {});
  } else if (!user.googleId) {
    /* Existing email user — link Google account */
    user.googleId = googleId;
    if (picture && !user.avatar) user.avatar = picture;
    await user.save();
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: safeUser(user),
  });
});

/* ── @GET /api/v1/auth/me ─────────────────────────── */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('wishlist');
  res.json({ success: true, user });
});

/* ── @PUT /api/v1/auth/profile ────────────────────── */
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone, avatar } = req.body;
  if (name)   user.name   = name;
  if (phone)  user.phone  = phone;
  if (avatar) user.avatar = avatar;
  if (req.body.password) user.password = req.body.password;
  const updated = await user.save();
  res.json({ success: true, user: safeUser(updated) });
});

/* ── @POST /api/v1/auth/address ───────────────────── */
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

/* ── @DELETE /api/v1/auth/address/:id ─────────────── */
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
});

/* ── @PUT /api/v1/auth/change-password ───────────── */
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400); throw new Error('Both passwords are required');
  }
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(oldPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: req.user._id }, { password: hashedPassword });
  res.json({ success: true, message: 'Password changed successfully' });
});


/* ── @PUT /api/v1/auth/change-email ──────────────── */
const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail, currentPassword } = req.body;
  if (!newEmail || !currentPassword) {
    res.status(400); throw new Error('New email and current password are required');
  }
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  const cleanEmail = newEmail.toLowerCase().trim();
  const taken = await User.findOne({ email: cleanEmail });
  if (taken && taken._id.toString() !== user._id.toString()) {
    res.status(400); throw new Error('That email is already registered to another account');
  }
  await User.updateOne({ _id: req.user._id }, { email: cleanEmail });
  const updated = await User.findById(req.user._id);
  res.json({ success: true, message: 'Email updated successfully', user: safeUser(updated) });
});

/* ── @PUT /api/v1/auth/change-access-code ─────────── */
const changeAccessCode = asyncHandler(async (req, res) => {
  const { newCode, currentPassword } = req.body;
  if (!newCode || !currentPassword) {
    res.status(400); throw new Error('New code and current password are required');
  }
  if (!['admin', 'vendor'].includes(req.user.role)) {
    res.status(403); throw new Error('Not authorised');
  }
  if (String(newCode).length < 4) {
    res.status(400); throw new Error('Access code must be at least 4 characters');
  }
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  const hashedCode = await bcrypt.hash(String(newCode), 12);
  await User.updateOne({ _id: req.user._id }, { accessCode: hashedCode });
  res.json({ success: true, message: 'Access code updated successfully' });
});

/* ── @POST /api/v1/auth/admin-register ───────────── */
const adminRegister = asyncHandler(async (req, res) => {
  const { name, email, password, code } = req.body;
  if (!name || !email || !password || !code) {
    res.status(400); throw new Error('All fields including access code are required');
  }

  const correctCode = process.env.ADMIN_ACCESS_CODE || '123456';
  if (String(code) !== correctCode) {
    res.status(401); throw new Error('Invalid admin access code');
  }

  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  const user = await User.create({ name, email, password, role: 'admin' });
  const token = jwt.sign({ id: user._id, adminVerified: true }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.status(201).json({ success: true, token, user: safeUser(user) });
});

/* ── @POST /api/v1/auth/vendor-register ───────────── */
const vendorRegister = asyncHandler(async (req, res) => {
  res.status(403);
  throw new Error('Vendor self-registration is currently disabled. Please contact the administrator.');
});


/* ── @GET /api/v1/auth/vendor-set-password/:token ──── */
const vendorCheckSetupToken = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    vendorSetupToken: hashedToken,
    vendorSetupExpires: { $gt: Date.now() },
  }).select('+vendorSetupToken +vendorSetupExpires');

  if (!user) { res.status(400); throw new Error('This link is invalid or has expired'); }

  res.json({ success: true, name: user.name, businessName: user.vendorProfile?.businessName });
});

/* ── @POST /api/v1/auth/vendor-set-password ────────── */
const vendorSetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    res.status(400); throw new Error('A valid token and a password of at least 6 characters are required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    vendorSetupToken: hashedToken,
    vendorSetupExpires: { $gt: Date.now() },
  }).select('+vendorSetupToken +vendorSetupExpires');

  if (!user) { res.status(400); throw new Error('This link is invalid or has expired'); }

  user.password = password;
  user.vendorSetupToken = undefined;
  user.vendorSetupExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password set successfully',
    token: generateToken(user._id),
    user: safeUser(user),
  });
});

module.exports = {
  register, login, checkRole, adminRegister, adminVerifyCode, googleAuth,
  getMe, updateProfile, addAddress, deleteAddress, changePassword,
  changeEmail, changeAccessCode,
  vendorRegister, vendorCheckSetupToken, vendorSetPassword,
};
