require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne();
  const product = await Product.findOne();
  
  if (!user || !product) {
    console.log("No user or product");
    process.exit();
  }

  // Create or clear cart
  let cart = await Cart.findOne({ user: user._id });
  if (!cart) cart = new Cart({ user: user._id, items: [] });
  cart.items = [];
  
  // Add item
  cart.items.push({
    product: product._id,
    variantSize: product.variants[0].size,
    variantColor: product.variants[0].color,
    quantity: 1,
    price: product.price
  });
  
  await cart.save();
  
  cart = await Cart.findOne({ user: user._id });
  const itemId = cart.items[0]._id;
  console.log("Item ID before:", itemId);
  
  // Simulate controller logic
  let cartToUpdate = await Cart.findOne({ user: user._id });
  cartToUpdate.items.pull(itemId);
  await cartToUpdate.save();
  
  cart = await Cart.findOne({ user: user._id });
  console.log("Cart items after pull:", cart.items.length);

  process.exit();
})();
