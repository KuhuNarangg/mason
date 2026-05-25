require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne();
  const cart = await Cart.findOne({ user: user._id }).populate('items.product', 'name');
  if (cart) {
    console.log("Cart JSON:", JSON.stringify(cart.toJSON(), null, 2));
  }
  process.exit();
})();
