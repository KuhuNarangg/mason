const asyncHandler = require('express-async-handler');
const Brand = require('../models/Brand');

// @GET /api/v1/brands (public — returns active brands; admin gets all via ?all=1)
const getBrands = asyncHandler(async (req, res) => {
  const query = req.query.all ? {} : { isActive: true };
  const brands = await Brand.find(query).sort({ name: 1 });
  res.json({ success: true, brands });
});

// @POST /api/v1/brands (admin)
const createBrand = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) { res.status(400); throw new Error('Brand name is required'); }

  const exists = await Brand.findOne({ name: name.trim() });
  if (exists) { res.status(400); throw new Error('A brand with this name already exists'); }

  const brand = await Brand.create({ ...req.body, name: name.trim() });
  res.status(201).json({ success: true, brand });
});

// @PUT /api/v1/brands/:id (admin)
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) { res.status(404); throw new Error('Brand not found'); }

  if (req.body.name && req.body.name.trim() !== brand.name) {
    const exists = await Brand.findOne({ name: req.body.name.trim(), _id: { $ne: brand._id } });
    if (exists) { res.status(400); throw new Error('A brand with this name already exists'); }
    brand.name = req.body.name.trim();
    brand.slug = undefined; // regenerate
  }

  if (req.body.logo        !== undefined) brand.logo = req.body.logo;
  if (req.body.description !== undefined) brand.description = req.body.description;
  if (req.body.isActive    !== undefined) brand.isActive = req.body.isActive;

  await brand.save();
  res.json({ success: true, brand });
});

// @DELETE /api/v1/brands/:id (admin)
const deleteBrand = asyncHandler(async (req, res) => {
  await Brand.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Brand deleted' });
});

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
