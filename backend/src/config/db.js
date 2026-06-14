const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // One-time cleanup: older documents may have vendorProfile.storeSlug set to ""
    // from a previous schema default. An empty string collides with the unique
    // sparse index on that field (E11000 duplicate key error on registration).
    // Unset it so only real vendor slugs occupy the index.
    try {
      const result = await conn.connection.db.collection('users').updateMany(
        { 'vendorProfile.storeSlug': '' },
        { $unset: { 'vendorProfile.storeSlug': '' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up empty storeSlug on ${result.modifiedCount} user(s)`);
      }
    } catch (cleanupErr) {
      console.error('⚠️  storeSlug cleanup skipped:', cleanupErr.message);
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
