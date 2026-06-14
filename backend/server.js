require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const brandRoutes = require('./src/routes/brands');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const adminRoutes = require('./src/routes/admin');
const uploadRoutes = require('./src/routes/upload');
const couponRoutes = require('./src/routes/coupons');
const notificationRoutes = require('./src/routes/notifications');
const adRoutes = require('./src/routes/ads');
const paymentRoutes = require('./src/routes/payments');
const customizationRoutes = require('./src/routes/customizations');
const vendorRoutes = require('./src/routes/vendor');
const shiprocketRoutes = require('./src/routes/shiprocket');

connectDB();

const app = express();

/* ── Security ── */
app.use(helmet({ crossOriginResourcePolicy: false }));  // Security headers

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const allowedOrigins = [
  'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
  'https://mason-n1y8.onrender.com',
  'https://owlstitch.com', 'https://www.owlstitch.com',
  'http://owlstitch.com', 'http://www.owlstitch.com',
  'https://owlstitch.in', 'https://www.owlstitch.in',
  'http://owlstitch.in', 'http://www.owlstitch.in'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('owlstitch')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check
app.get('/api/v1/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1', apiLimiter);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ads', adRoutes);     // ad management (admin)
app.use('/api/v1/payments', paymentRoutes); // Razorpay payment flow
app.use('/api/v1/customizations', customizationRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/shiprocket', shiprocketRoutes);
// Public ad redirect — Instagram/Facebook ads point to this URL:
//   yourbackend.com/api/v1/r/:adId  → logs click → redirects to product page
app.get('/api/v1/r/:adId', require('./src/controllers/adController').redirectAd);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
});
