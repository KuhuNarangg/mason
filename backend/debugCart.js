require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
const User = require('./src/models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'user@test.com' });
  const cart = await Cart.findOne({ user: user._id }).lean();
  console.log("Cart items:", JSON.stringify(cart?.items, null, 2));
  process.exit();
})();
