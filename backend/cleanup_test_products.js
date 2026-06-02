const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './.env' });

const Product = require('./src/models/Product');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Delete products with "QA Test" in the name or with dummy images
    const result = await Product.deleteMany({
      $or: [
        { name: { $regex: /QA Test/i } },
        { images: 'http://example.com/image.jpg' }
      ]
    });

    console.log(`Deleted ${result.deletedCount} test products.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
