const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Category = require('./src/models/Category');
  const Product = require('./src/models/Product');

  const cats = await Category.find().lean();
  console.log('=== CATEGORIES ===');
  cats.forEach(c => console.log(c._id.toString(), '|', c.name, '| gender:', c.gender, '| parent:', c.parent ? c.parent.toString() : 'null'));

  console.log('\n=== PRODUCT distinct gender/subGender/type ===');
  console.log('genders:', await Product.distinct('gender'));
  console.log('subGenders:', await Product.distinct('subGender'));
  console.log('types:', await Product.distinct('type'));

  console.log('\n=== sample products ===');
  const samples = await Product.find().limit(5).select('name gender subGender type category subcategory').lean();
  samples.forEach(p => console.log(p.name, '|', p.gender, p.subGender, p.type, '| cat:', p.category, 'sub:', p.subcategory));

  console.log('\nTotal products:', await Product.countDocuments());
  console.log('Products with category set:', await Product.countDocuments({ category: { $ne: null } }));

  await mongoose.disconnect();
})();
