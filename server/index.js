// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

//  Domain Authorization -1
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://fomula-ai.netlify.app',
      'https://ideationally-intermastoid-cicely.ngrok-free.dev',
      'http://localhost:5173'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.includes('ngrok-free.dev')) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());

// Session configuration -2
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 30 * 24 * 60 * 60,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  },
  rolling: true,
  name: 'sessionId'
}));

// Session validation middleware -3
app.use(async (req, res, next) => {
  // Skip for auth endpoints
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  
  // Check if session exists 
  if (req.session?.userId) {
    return next();
  }
  
  // Session expired/invalid but cookie exists
  if (req.cookies.sessionId || req.headers.cookie?.includes('connect.sid')) {
    console.log('Session expired - clearing cookie for:', req.ip);
    
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return res.status(401).json({
      success: false,
      error: 'Session expired',
      sessionExpired: true,
      requiresReauth: true
    });
  }
  
  next();
});

// Routes 
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const feedbackRoutes = require('./routes/feedback');
const analyzerRoutes = require('./routes/analyzer');
const scanRoutes = require('./routes/scan');
const adminRoutes = require('./routes/admin');
const mobileAPIRoutes = require('./routes/mobileAPI');
const regenerateRoutes = require('./routes/regenerate');
const adminFeedbackRoutes = require('./routes/adminFeedback');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analyzer', analyzerRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/regenerate', regenerateRoutes);
app.use('/api/admin/feedback', adminFeedbackRoutes);

if (process.env.MOBILE_API_ENABLED === 'true') {
  app.use('/api/mobile', mobileAPIRoutes);
  console.log('✅ Mobile API enabled at /api/mobile');
}

// Test endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});