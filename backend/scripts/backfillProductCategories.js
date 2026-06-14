/**
 * One-time backfill: assigns Product.category (and Product.subcategory, if a
 * matching subcategory exists) based on the existing gender/type fields.
 *
 * Run from the backend folder:
 *   node scripts/backfillProductCategories.js
 *
 * Safe to re-run — only updates products where category is currently null.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

// Map Product.type -> Category name (top-level). Extend this as you add more
// categories/subcategories in the admin panel.
const TYPE_TO_CATEGORY = {
  dress: 'Dresses',
  top: 'Tops',
  trouser: 'Trousers',
  ethnic: 'Ethnics',
  westernwear: 'Westernwear',
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const categories = await Category.find({ isActive: true }).lean();
  console.log(`Found ${categories.length} categories`);

  const products = await Product.find({
    $or: [{ category: null }, { category: { $exists: false } }],
  });
  console.log(`Found ${products.length} products without a category`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const targetName = TYPE_TO_CATEGORY[(product.type || '').toLowerCase()];
    if (!targetName) {
      skipped++;
      continue;
    }

    // Prefer a top-level category matching gender, fall back to 'all'
    let topCategory = categories.find(
      (c) => !c.parent && c.name.toLowerCase() === targetName.toLowerCase() && c.gender === product.gender
    );
    if (!topCategory) {
      topCategory = categories.find(
        (c) => !c.parent && c.name.toLowerCase() === targetName.toLowerCase()
      );
    }
    if (!topCategory) {
      skipped++;
      continue;
    }

    // If the matched category itself has a parent (i.e. it's really a
    // subcategory), use it as the subcategory and its parent as the category.
    let categoryId = topCategory._id;
    let subcategoryId = null;
    if (topCategory.parent) {
      categoryId = topCategory.parent;
      subcategoryId = topCategory._id;
    } else {
      // Otherwise, check if this top-level category has a matching child
      // subcategory whose name matches the product's type/tags.
      const child = categories.find(
        (c) => c.parent && String(c.parent) === String(topCategory._id) &&
          c.name.toLowerCase() === (product.type || '').toLowerCase()
      );
      if (child) subcategoryId = child._id;
    }

    product.category = categoryId;
    product.subcategory = subcategoryId;
    await product.save();
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped (no mapping found): ${skipped}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
