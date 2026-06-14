const express = require('express');
const router  = express.Router();
const {
  register, login, adminRegister, adminVerifyCode, googleAuth,
  getMe, updateProfile, addAddress, deleteAddress, changePassword,
  vendorRegister, vendorCheckSetupToken, vendorSetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',            register);
router.post('/login',               login);
router.post('/google',              googleAuth);
router.post('/vendor-register',     vendorRegister);
router.get('/vendor-set-password/:token', vendorCheckSetupToken);
router.post('/vendor-set-password', vendorSetPassword);
router.post('/admin-register',        adminRegister);
router.post('/admin-verify-code',   protect, adminVerifyCode);
router.get('/me',                   protect, getMe);
router.put('/profile',              protect, updateProfile);
router.put('/change-password',      protect, changePassword);
router.post('/address',             protect, addAddress);
router.delete('/address/:id',       protect, deleteAddress);

module.exports = router;
