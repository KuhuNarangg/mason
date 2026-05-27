const express = require('express');
const router = express.Router();
const { getAllUsers, getUserDetail, deleteUser, getDashboardStats } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.delete('/users/:id', deleteUser);

module.exports = router;
