/**
 * Upsert the admin user in MongoDB.
 * Run from the backend folder:
 *   node scripts/seedAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const ADMIN_EMAIL    = 'admin@clothingweb.com';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_CODE     = '31082005';

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const hashedCode     = await bcrypt.hash(ADMIN_CODE, 12);

  const existing = await User.findOne({ email: ADMIN_EMAIL }).select('+accessCode');

  if (existing) {
    existing.name        = 'Admin';
    existing.password    = hashedPassword;
    existing.role        = 'admin';
    existing.accessCode  = hashedCode;
    // bypass the pre-save hash hook since we already hashed
    await User.updateOne(
      { email: ADMIN_EMAIL },
      { name: 'Admin', password: hashedPassword, role: 'admin', accessCode: hashedCode }
    );
    console.log('Admin user updated successfully.');
  } else {
    await User.create({
      name:       'Admin',
      email:      ADMIN_EMAIL,
      password:   ADMIN_PASSWORD,   // pre-save hook hashes this
      role:       'admin',
    });
    // set accessCode separately via updateOne to avoid double-hashing
    await User.updateOne({ email: ADMIN_EMAIL }, { accessCode: hashedCode });
    console.log('Admin user created successfully.');
  }

  await mongoose.disconnect();
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
