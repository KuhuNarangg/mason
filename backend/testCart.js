require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const cart = await Cart.findOne();
  if (cart && cart.items.length > 0) {
    console.log("Cart items before:", cart.items.map(i => i._id));
    const firstItemId = cart.items[0]._id;
    cart.items.pull(firstItemId);
    await cart.save();
    console.log("Cart items after:", cart.items.map(i => i._id));
  } else {
    console.log("No items in cart.");
  }
  process.exit();
})();
