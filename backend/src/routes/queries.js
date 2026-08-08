const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const queryController = require('../controllers/queryController');
const { protect, adminOnly } = require('../middleware/auth');

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid or expired, continue as guest
    }
  }
  next();
};

// Public / Guest / User endpoint to submit query
router.post('/', optionalAuth, queryController.createQuery);

// Admin endpoints
router.get('/', protect, adminOnly, queryController.getQueries);
router.put('/:id', protect, adminOnly, queryController.updateQuery);

module.exports = router;
