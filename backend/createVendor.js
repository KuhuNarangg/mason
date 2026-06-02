require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createVendor = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const existingVendor = await User.findOne({ email: 'vendor@mason.com' });
    if (existingVendor) {
      console.log('Vendor already exists');
      process.exit(0);
    }

    const vendor = new User({
      name: 'Mason Vendor',
      email: 'vendor@mason.com',
      password: 'password123',
      role: 'vendor',
    });

    await vendor.save();
    console.log('Vendor account created successfully: vendor@mason.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating vendor:', error);
    process.exit(1);
  }
};

createVendor();
