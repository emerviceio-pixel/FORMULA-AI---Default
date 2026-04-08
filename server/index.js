//index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const feedbackRoutes = require('./routes/feedback');
const analyzerRoutes = require('./routes/analyzer');
const scanRoutes = require('./routes/scan');
const adminRoutes = require('./routes/admin');
const mobileAPIRoutes = require('./routes/mobileAPI')
const regenerateRoutes = require('./routes/regenerate');
const adminFeedbackRoutes = require('./routes/adminFeedback');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow all localhost origins and your specific ngrok domain
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'https://ideationally-intermastoid-cicely.ngrok-free.dev',
      'https://fomula-ai.netlify.app' 
    ];
    
    // Allow requests with no origin (like mobile apps, curl)
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
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60
  }),
  cookie: {
    secure: false, // Set to false for ngrok (HTTP)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax', // Important for cross-origin
    domain: undefined // Let browser handle domain automatically
  }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analyzer', require('./routes/analyzer'));
app.use('/api/scans', require('./routes/scan'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/regenerate', regenerateRoutes);
app.use('/api/admin/feedback', adminFeedbackRoutes);

if (process.env.MOBILE_API_ENABLED === 'true') {
  app.use('/api/mobile', require('./routes/mobileAPI'));
  console.log('✅ Mobile API enabled at /api/mobile');
}

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is running',
    sessionId: req.session.id 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});