const asyncHandler = require('express-async-handler');
const HomeMedia = require('../models/HomeMedia');

// @GET /api/v1/homemedia
// @desc Get all active home media
// @access Public
const getHomeMedia = asyncHandler(async (req, res) => {
  const media = await HomeMedia.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, media });
});

// @GET /api/v1/admin/homemedia
// @desc Get all home media (active and inactive)
// @access Admin
const getAdminHomeMedia = asyncHandler(async (req, res) => {
  const media = await HomeMedia.find({}).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, media });
});

// @POST /api/v1/admin/homemedia
// @desc Create a new home media item
// @access Admin
const createHomeMedia = asyncHandler(async (req, res) => {
  const { url, title, type, isActive, order } = req.body;
  if (!url) {
    res.status(400);
    throw new Error('Media URL is required');
  }

  const media = await HomeMedia.create({
    url,
    title,
    type: type || 'video',
    isActive: isActive !== undefined ? isActive : true,
    order: order || 0
  });

  res.status(201).json({ success: true, media });
});

// @DELETE /api/v1/admin/homemedia/:id
// @desc Delete a home media item
// @access Admin
const deleteHomeMedia = asyncHandler(async (req, res) => {
  const media = await HomeMedia.findById(req.params.id);
  if (!media) {
    res.status(404);
    throw new Error('Media not found');
  }

  await media.deleteOne();
  res.json({ success: true, message: 'Media removed' });
});

module.exports = {
  getHomeMedia,
  getAdminHomeMedia,
  createHomeMedia,
  deleteHomeMedia
};
