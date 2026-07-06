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
    cart.items.push({ 
      product: productId, 
      variantSize, 
      variantColor, 
      quantity, 
      price: product.price,
      cgstPercent: product.taxConfig?.cgstPercent || 6,
      sgstPercent: product.taxConfig?.sgstPercent || 6
    });
  }

  await cart.save();
  
  // Populate product data before sending response
  cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name thumbnail slug images brand variants');
  res.json({ success: true, cart });
});

// @PUT /api/v1/cart/:itemId
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity, variantSize } = req.body;
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) { res.status(404); throw new Error('Cart not found'); }

  const item = cart.items.id(req.params.itemId);
  if (!item) { res.status(404); throw new Error('Item not found'); }

  if (quantity !== undefined) {
    if (quantity <= 0) {
      cart.items.pull(req.params.itemId);
    } else {
      item.quantity = quantity;
    }
  }

  if (variantSize !== undefined && variantSize !== item.variantSize) {
    // Validate that the new size exists in product variants and has stock
    const product = item.product;
    const variant = product.variants?.find(v => v.size === variantSize && v.color === item.variantColor);
    if (!variant) {
      res.status(400); throw new Error('Variant not available');
    }
    if (variant.stock < item.quantity) {
      res.status(400); throw new Error('Insufficient stock for this size');
    }
    
    // Check if another item with the exact same product, new size, and same color already exists in the cart
    const existingItemIdx = cart.items.findIndex(
      i => i._id.toString() !== item._id.toString() && 
           i.product._id.toString() === product._id.toString() && 
           i.variantSize === variantSize && 
           i.variantColor === item.variantColor
    );

    if (existingItemIdx > -1) {
      // Merge into the existing item
      cart.items[existingItemIdx].quantity += item.quantity;
      cart.items.pull(req.params.itemId);
    } else {
      item.variantSize = variantSize;
    }
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
