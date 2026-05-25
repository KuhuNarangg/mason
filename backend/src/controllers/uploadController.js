const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @POST /api/v1/upload
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file provided');
  }

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        folder: 'clothing-web/products',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) throw error;
        res.json({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500);
    throw new Error(`Upload failed: ${err.message}`);
  }
});

module.exports = { uploadImage };
