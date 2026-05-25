const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @GET /api/v1/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name thumbnail slug images brand');
  res.json({ success: true, cart: cart || { items: [], totalAmount: 0 } });
});

// @POST /api/v1/cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantSize, variantColor, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const variant = product.variants.find(v => v.size === variantSize && v.color === variantColor);
  if (!variant) { res.status(400); throw new Error('Variant not found'); }
  if (variant.stock < quantity) { res.status(400); throw new Error('Insufficient stock'); }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const existIdx = cart.items.findIndex(
    i => i.product.toString() === productId && i.variantSize === variantSize && i.variantColor === variantColor
  );

  if (existIdx > -1) {
    cart.items[existIdx].quantity += quantity;
  } else {
    cart.items.push({ product: productId, variantSize, variantColor, quantity, price: product.price });
  }

  await cart.save();
  
  // Populate product data before sending response
  cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name thumbnail slug images brand');
  res.json({ success: true, cart });
});

// @PUT /api/v1/cart/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }

  const item = cart.items.id(req.params.itemId);
  if (!item) { res.status(404); throw new Error('Item not found'); }

  if (quantity <= 0) {
    cart.items.pull(req.params.itemId);
  } else {
    item.quantity = quantity;
  }

  await cart.save();
  
  // Populate product data before sending response
  cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name thumbnail slug images brand');
  res.json({ success: true, cart });
});

// @DELETE /api/v1/cart/:itemId
const removeCartItem = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error('Cart not found'); }
  cart.items.pull(req.params.itemId);
  await cart.save();
  
  // Populate product data before sending response
  cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name thumbnail slug images brand');
  res.json({ success: true, cart });
});

// @DELETE /api/v1/cart
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
