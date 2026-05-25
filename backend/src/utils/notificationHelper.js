const Notification = require('../models/Notification');

const createNotification = async ({ user, title, message, link, type = 'order' }) => {
  try {
    await Notification.create({
      user,
      title,
      message,
      link,
      type
    });
  } catch (error) {
    console.error('Notification Error:', error);
  }
};

module.exports = { createNotification };
