require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ DB Connected');
};

const categories = [
  { name: "Dresses", gender: 'women', description: 'Elegant dresses for every occasion' },
  { name: "Tops", gender: 'women', description: 'Chic tops and blouses' },
  { name: "Trousers", gender: 'women', description: 'Tailored trousers and pants' },
  { name: "Ethnics", gender: 'women', description: 'Traditional and modern ethnic wear' },
];

const products = [
  // CLIENT PROVIDED PRODUCTS
  {
    name: 'Champagne Slip Dress',
    description: 'A stunning champagne slip dress perfect for evening parties.',
    brand: 'House of Mason',
    gender: 'women', type: 'dress',
    images: ['/champagnedress1.jpg', '/champagnedress2.jpg', '/champagnedress4.jpg', '/champagnedress5.jpg'],
    originalPrice: 3800, discount: 0,
    variants: [
      { size: 'XS', color: 'Champagne', colorHex: '#f7e7ce', stock: 5 },
      { size: 'S', color: 'Champagne', colorHex: '#f7e7ce', stock: 12 },
      { size: 'M', color: 'Champagne', colorHex: '#f7e7ce', stock: 15 },
      { size: 'L', color: 'Champagne', colorHex: '#f7e7ce', stock: 8 },
      { size: 'XL', color: 'Champagne', colorHex: '#f7e7ce', stock: 3 }
    ],
    tags: ['dress', 'party', 'champagne'], isFeatured: true, isTrending: true,
  },
  {
    name: 'Beige Evening Dress',
    description: 'An elegant beige evening dress with delicate detailing.',
    brand: 'House of Mason',
    gender: 'women', type: 'dress',
    images: ['/beigedress1.jpg', '/beigedress2.jpg'],
    originalPrice: 3500, discount: 0,
    variants: [
      { size: 'S', color: 'Beige', colorHex: '#f5f5dc', stock: 5 },
      { size: 'M', color: 'Beige', colorHex: '#f5f5dc', stock: 10 },
      { size: 'L', color: 'Beige', colorHex: '#f5f5dc', stock: 12 },
      { size: 'XL', color: 'Beige', colorHex: '#f5f5dc', stock: 4 }
    ],
    tags: ['dress', 'evening', 'beige'], isFeatured: false, isTrending: true,
  },
  {
    name: 'Emerald Green Gown',
    description: 'A breathtaking emerald green gown for your most special occasions.',
    brand: 'House of Mason',
    gender: 'women', type: 'dress',
    images: ['/greendress1.jpg', '/greendress2.jpg', '/greendress3.jpg'],
    originalPrice: 4800, discount: 0,
    variants: [
      { size: 'S', color: 'Green', colorHex: '#50c878', stock: 4 },
      { size: 'M', color: 'Green', colorHex: '#50c878', stock: 10 },
      { size: 'L', color: 'Green', colorHex: '#50c878', stock: 7 },
      { size: 'XL', color: 'Green', colorHex: '#50c878', stock: 2 }
    ],
    tags: ['dress', 'gown', 'green'], isFeatured: true, isTrending: true,
  },
  {
    name: 'White Summer Dress',
    description: 'A light and flowy white summer dress.',
    brand: 'House of Mason',
    gender: 'women', type: 'dress',
    images: ['/whitedress.jpg', '/whitedress1.jpg', '/whitedress2.jpg'],
    originalPrice: 450, discount: 0,
    variants: [
      { size: 'XS', color: 'White', colorHex: '#ffffff', stock: 8 },
      { size: 'S', color: 'White', colorHex: '#ffffff', stock: 20 },
      { size: 'M', color: 'White', colorHex: '#ffffff', stock: 25 },
      { size: 'L', color: 'White', colorHex: '#ffffff', stock: 15 }
    ],
    tags: ['dress', 'summer', 'white'], isFeatured: false, isTrending: false,
  },
  {
    name: 'Royal Blue Lehenga',
    description: 'An exquisite royal blue ethnic lehenga with intricate embroidery.',
    brand: 'House of Mason',
    gender: 'women', type: 'ethnic',
    images: ['/blueethic1.jpg', '/blueethnic2.jpg', '/blueethnic3.jpg'],
    originalPrice: 4900, discount: 0,
    variants: [
      { size: 'S', color: 'Blue', colorHex: '#4169e1', stock: 3 },
      { size: 'M', color: 'Blue', colorHex: '#4169e1', stock: 5 },
      { size: 'L', color: 'Blue', colorHex: '#4169e1', stock: 8 },
      { size: 'XL', color: 'Blue', colorHex: '#4169e1', stock: 4 }
    ],
    tags: ['ethnic', 'lehenga', 'blue'], isFeatured: true, isTrending: true,
  },
  {
    name: 'Rose Pink Kurta Set',
    description: 'A beautiful rose pink kurta set for festive occasions.',
    brand: 'House of Mason',
    gender: 'women', type: 'ethnic',
    images: ['/pinkethnic1.jpg', '/pinkethnic2.jpg', '/pinkethnic3.jpg'],
    originalPrice: 3200, discount: 0,
    variants: [
      { size: 'S', color: 'Pink', colorHex: '#ffc0cb', stock: 10 },
      { size: 'M', color: 'Pink', colorHex: '#ffc0cb', stock: 15 },
      { size: 'L', color: 'Pink', colorHex: '#ffc0cb', stock: 15 },
      { size: 'XL', color: 'Pink', colorHex: '#ffc0cb', stock: 5 }
    ],
    tags: ['ethnic', 'kurta', 'pink'], isFeatured: false, isTrending: true,
  },
  {
    name: 'Ruby Red Anarkali',
    description: 'A classic ruby red anarkali suit.',
    brand: 'House of Mason',
    gender: 'women', type: 'ethnic',
    images: ['/redethic1.jpg', '/redethnic2.jpg', '/redethnic3.jpg'],
    originalPrice: 4600, discount: 0,
    variants: [
      { size: 'XS', color: 'Red', colorHex: '#e0115f', stock: 3 },
      { size: 'S', color: 'Red', colorHex: '#e0115f', stock: 8 },
      { size: 'M', color: 'Red', colorHex: '#e0115f', stock: 12 },
      { size: 'L', color: 'Red', colorHex: '#e0115f', stock: 6 }
    ],
    tags: ['ethnic', 'anarkali', 'red'], isFeatured: true, isTrending: false,
  },
  {
    name: 'Classic Black Top',
    description: 'A versatile classic black top.',
    brand: 'House of Mason',
    gender: 'women', type: 'top',
    images: ['/blacktop.jpg'],
    originalPrice: 190, discount: 0,
    variants: [
      { size: 'XS', color: 'Black', colorHex: '#000000', stock: 15 },
      { size: 'S', color: 'Black', colorHex: '#000000', stock: 30 },
      { size: 'M', color: 'Black', colorHex: '#000000', stock: 25 },
      { size: 'L', color: 'Black', colorHex: '#000000', stock: 20 },
      { size: 'XL', color: 'Black', colorHex: '#000000', stock: 10 }
    ],
    tags: ['top', 'classic', 'black'], isFeatured: false, isTrending: true,
  },
  {
    name: 'White Silk Blouse',
    description: 'A premium white silk blouse for elegant pairings.',
    brand: 'House of Mason',
    gender: 'women', type: 'top',
    images: ['/whitetop1.jpg', '/whitetop2.jpg', '/whitetop3.jpg', '/whitetop4.jpg'],
    originalPrice: 1600, discount: 0,
    variants: [
      { size: 'S', color: 'White', colorHex: '#ffffff', stock: 18 },
      { size: 'M', color: 'White', colorHex: '#ffffff', stock: 24 },
      { size: 'L', color: 'White', colorHex: '#ffffff', stock: 12 }
    ],
    tags: ['top', 'silk', 'white'], isFeatured: true, isTrending: true,
  },
  {
    name: 'Blue Flowing Skirt',
    description: 'A flowy blue skirt perfect for western wear.',
    brand: 'House of Mason',
    gender: 'women', type: 'dress',
    images: ['/blueflowskirt1.jpg'],
    originalPrice: 2800, discount: 0,
    variants: [
      { size: 'S', color: 'Blue', colorHex: '#4169e1', stock: 5 },
      { size: 'M', color: 'Blue', colorHex: '#4169e1', stock: 12 },
      { size: 'L', color: 'Blue', colorHex: '#4169e1', stock: 10 },
      { size: 'XL', color: 'Blue', colorHex: '#4169e1', stock: 4 }
    ],
    tags: ['skirt', 'western', 'blue'], isFeatured: false, isTrending: false,
  },
  {
    name: 'Grey Tailored Trousers',
    description: 'Sleek and professional grey tailored trousers.',
    brand: 'House of Mason',
    gender: 'women', type: 'trouser',
    images: ['/greypants1.jpg', '/greypants2.jpg'],
    originalPrice: 890, discount: 0,
    variants: [
      { size: '28', color: 'Grey', colorHex: '#808080', stock: 8 },
      { size: '30', color: 'Grey', colorHex: '#808080', stock: 12 },
      { size: '32', color: 'Grey', colorHex: '#808080', stock: 14 },
      { size: '34', color: 'Grey', colorHex: '#808080', stock: 6 }
    ],
    tags: ['trouser', 'tailored', 'grey'], isFeatured: false, isTrending: true,
  },
  {
    name: 'Signature Tailored Blazer',
    description: 'Our signature tailored blazer. Available in Classic Brown and Crisp White.',
    brand: 'House of Mason',
    gender: 'women', type: 'top',
    images: ['/brownblazer1.jpg', '/whiteblazer.jpg', '/brownblazer2.jpg', '/brownblazer3.jpg'],
    originalPrice: 4100, discount: 0,
    variants: [
      { size: 'S', color: 'Brown', colorHex: '#8b4513', stock: 8 },
      { size: 'M', color: 'Brown', colorHex: '#8b4513', stock: 12 },
      { size: 'L', color: 'Brown', colorHex: '#8b4513', stock: 6 },
      { size: 'S', color: 'White', colorHex: '#ffffff', stock: 5, image: '/whiteblazer.jpg' },
      { size: 'M', color: 'White', colorHex: '#ffffff', stock: 10, image: '/whiteblazer.jpg' },
      { size: 'L', color: 'White', colorHex: '#ffffff', stock: 8, image: '/whiteblazer.jpg' }
    ],
    tags: ['blazer', 'western', 'tailored'], isFeatured: true, isTrending: true,
  }
];

const seed = async () => {
  try {
    await connectDB();
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@clothingweb.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
    });
    console.log(`👤 Admin created: ${admin.email}`);

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'User@1234',
      role: 'user',
    });
    console.log('👤 Test user created: user@test.com / User@1234');

    // Seed categories
    const createdCats = await Promise.all(categories.map(c => Category.create(c)));
    console.log(`📂 ${createdCats.length} categories seeded`);

    const TYPE_TO_CATEGORY = {
      dress: 'Dresses',
      top: 'Tops',
      trouser: 'Trousers',
      ethnic: 'Ethnics',
    };

    // Seed products
    const createdProducts = await Promise.all(products.map(p => {
      const categoryName = TYPE_TO_CATEGORY[p.type];
      const categoryObj = createdCats.find(c => c.name === categoryName && c.gender === p.gender) || createdCats.find(c => c.name === categoryName);
      const categoryId = categoryObj ? categoryObj._id : null;
      return Product.create({ ...p, category: categoryId, slug: null });
    }));
    console.log(`👕 ${createdProducts.length} products seeded`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.stack);
    process.exit(1);
  }
};

seed();
