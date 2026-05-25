const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @GET /api/v1/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, notifications });
});

// @PUT /api/v1/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) { res.status(404); throw new Error('Notification not found'); }
  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true });
});

// @PUT /api/v1/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
