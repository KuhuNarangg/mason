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

  // Generate an SEO-friendly filename if a slug or name is provided
  const baseName = req.body.slug || req.body.name ? (req.body.slug || req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'product-image';
  const timestamp = Date.now();
  const publicId = `${baseName}-${timestamp}`;

  try {
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      {
        folder: 'clothing-web/products',
        resource_type: 'auto',
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          return res.status(error.http_code || 500).json({ success: false, message: `Cloudinary error: ${error.message}` });
        }
        
        // Inject f_auto,q_auto for optimal WebP/AVIF delivery and performance
        let optimizedUrl = result.secure_url;
        if (optimizedUrl.includes('/upload/')) {
          optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }

        res.json({
          success: true,
          url: optimizedUrl,
          publicId: result.public_id,
        });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500);
    throw new Error(`Upload failed: ${err.message}`);
  }
});

// @POST /api/v1/upload/try-on
const uploadTryOnImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No try-on image file provided');
  }

  const baseName = req.body.slug || req.body.name ? (req.body.slug || req.body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'tryon-image';
  const timestamp = Date.now();
  const publicId = `tryon-${baseName}-${timestamp}`;

  try {
    const result = await cloudinary.uploader.upload_stream(
      {
        folder: 'clothing-web/tryon',
        resource_type: 'auto',
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          return res.status(error.http_code || 500).json({ success: false, message: `Cloudinary error: ${error.message}` });
        }
        
        let optimizedUrl = result.secure_url;
        if (optimizedUrl.includes('/upload/')) {
          optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_auto,q_auto/');
        }

        res.json({
          success: true,
          url: optimizedUrl,
          publicId: result.public_id,
        });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500);
    throw new Error(`Try-on upload failed: ${err.message}`);
  }
});

module.exports = { uploadImage, uploadTryOnImage };

