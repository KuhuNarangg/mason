/**
 * Upsert a vendor user from environment variables.
 * Run from the backend folder:
 *   node scripts/seedVendor.js
 *
 * Required env vars (set in .env):
 *   VENDOR_SEED_EMAIL, VENDOR_SEED_PASSWORD, VENDOR_ACCESS_CODE
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const { MONGO_URI, VENDOR_SEED_EMAIL, VENDOR_SEED_PASSWORD, VENDOR_ACCESS_CODE } = process.env;

if (!VENDOR_SEED_EMAIL || !VENDOR_SEED_PASSWORD || !VENDOR_ACCESS_CODE) {
  console.error('Missing required env vars: VENDOR_SEED_EMAIL, VENDOR_SEED_PASSWORD, VENDOR_ACCESS_CODE');
  process.exit(1);
}

(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const hashedPassword = await bcrypt.hash(VENDOR_SEED_PASSWORD, 12);
  const hashedCode     = await bcrypt.hash(VENDOR_ACCESS_CODE, 12);

  const existing = await User.findOne({ email: VENDOR_SEED_EMAIL });

  if (existing) {
    await User.updateOne(
      { email: VENDOR_SEED_EMAIL },
      {
        password:     hashedPassword,
        role:         'vendor',
        vendorStatus: 'approved',
        accessCode:   hashedCode,
      }
    );
    console.log(`Vendor user updated: ${VENDOR_SEED_EMAIL}`);
  } else {
    const user = await User.create({
      name:         'Vendor',
      email:        VENDOR_SEED_EMAIL,
      password:     VENDOR_SEED_PASSWORD,  // pre-save hook hashes this
      role:         'vendor',
      vendorStatus: 'approved',
    });
    await User.updateOne({ _id: user._id }, { accessCode: hashedCode });
    console.log(`Vendor user created: ${VENDOR_SEED_EMAIL}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
