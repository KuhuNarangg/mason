const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendWelcomeEmail, sendAdminLockoutAlert } = require('../utils/emailService');

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
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  /* Unknown email — don't reveal info */
  if (!user) { res.status(401); throw new Error('Invalid email or password'); }

  /* Locked? */
  if (user.isLoginLocked()) {
    const secsLeft = Math.ceil((user.loginLockUntil - Date.now()) / 1000);
    res.status(429);
    throw new Error(`Account locked. Try again in ${Math.ceil(secsLeft / 60)} min.`);
  }

  const match = await user.matchPassword(password);

  if (!match) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.loginLockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
      user.loginAttempts = 0;
    }
    await user.save();
    const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
    res.status(401);
    throw new Error(
      user.loginLockUntil
        ? `Too many attempts. Account locked for ${LOGIN_LOCK_MINUTES} min.`
        : `Invalid email or password. ${remaining > 0 ? `${remaining} attempt(s) left.` : ''}`
    );
  }

  /* Successful login — reset counters */
  user.loginAttempts = 0;
  user.loginLockUntil = undefined;
  await user.save();

  /* If role is admin, ensure the email matches the designated ADMIN_EMAIL */
  if (user.role === 'admin' && process.env.ADMIN_EMAIL) {
    if (user.email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()) {
      res.status(403);
      throw new Error('Admin access not permitted for this account.');
    }
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: safeUser(user),
  });
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
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
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

module.exports = {
  register, login, adminRegister, adminVerifyCode, googleAuth,
  getMe, updateProfile, addAddress, deleteAddress, changePassword,
};
