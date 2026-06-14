const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

// @GET /api/v1/categories
// Supports ?gender=men/women/kids/all  ?parent=<id|null|root>  ?all=1 (admin, includes inactive)
const getCategories = asyncHandler(async (req, res) => {
  const { gender, parent, all } = req.query;
  const query = all ? {} : { isActive: true };
  if (gender) query.gender = gender;

  if (parent === 'root' || parent === 'null') {
    query.parent = null;
  } else if (parent) {
    query.parent = parent;
  }

  const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });
  res.json({ success: true, categories });
});

// @GET /api/v1/categories/tree
// Returns top-level categories, each with a `subcategories` array of its children.
const getCategoryTree = asyncHandler(async (req, res) => {
  const { gender } = req.query;
  const baseQuery = { isActive: true, parent: null };
  if (gender) baseQuery.gender = gender;

  const parents = await Category.find(baseQuery).sort({ sortOrder: 1, name: 1 }).lean();
  const parentIds = parents.map((p) => p._id);

  const children = await Category.find({ isActive: true, parent: { $in: parentIds } })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const tree = parents.map((p) => ({
    ...p,
    subcategories: children.filter((c) => String(c.parent) === String(p._id)),
  }));

  res.json({ success: true, categories: tree });
});

// @GET /api/v1/categories/:slug
// Returns a single category by slug, including its subcategories (if it's a parent)
// or its parent (if it's a subcategory).
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) { res.status(404); throw new Error('Category not found'); }

  let subcategories = [];
  let parent = null;

  if (!category.parent) {
    subcategories = await Category.find({ parent: category._id, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  } else {
    parent = await Category.findById(category.parent).lean();
  }

  res.json({ success: true, category, subcategories, parent });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, parent } = req.body;

  // Prevent duplicate category/subcategory names within the same parent scope
  const dup = await Category.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' },
    parent: parent || null,
  });
  if (dup) { res.status(400); throw new Error('A category with this name already exists at this level'); }

  const cat = await Category.create({ ...req.body, parent: parent || null });
  res.status(201).json({ success: true, category: cat });
});

const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) { res.status(404); throw new Error('Category not found'); }

  if (req.body.name && req.body.name.trim().toLowerCase() !== cat.name.toLowerCase()) {
    const dup = await Category.findOne({
      _id: { $ne: cat._id },
      name: { $regex: `^${req.body.name.trim()}$`, $options: 'i' },
      parent: req.body.parent !== undefined ? (req.body.parent || null) : cat.parent,
    });
    if (dup) { res.status(400); throw new Error('A category with this name already exists at this level'); }
    cat.slug = undefined; // regenerate slug
  }

  Object.assign(cat, req.body);
  await cat.save();
  res.json({ success: true, category: cat });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const hasChildren = await Category.countDocuments({ parent: req.params.id });
  if (hasChildren > 0) {
    res.status(400);
    throw new Error('Cannot delete a category that has subcategories. Delete or reassign them first.');
  }
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
