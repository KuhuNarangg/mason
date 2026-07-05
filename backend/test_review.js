require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne();
    const product = await Product.findOne();
    
    if (!user || !product) {
      console.log("No user or product");
      process.exit();
    }
    
    console.log("Found product:", product.name);
    
    // Test the same logic in addReview
    product.reviews.push({
      user: user._id,
      name: user.name,
      rating: 5,
      comment: 'Test comment',
      photos: [],
      isApproved: false
    });
    
    console.log("Saving product...");
    await product.save();
    console.log("Product saved successfully!");
  } catch (err) {
    console.error("Error saving product:", err);
  } finally {
    process.exit();
  }
})();
