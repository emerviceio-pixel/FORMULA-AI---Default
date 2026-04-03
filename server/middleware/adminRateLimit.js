// server/middleware/adminRateLimit.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiting for cash payments
const cashPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many cash payment attempts. Please try again later.'
  },
  keyGenerator: (req) => {
    // Use user ID if available, otherwise safe IP fallback
    if (req.user?._id) {
      return req.user._id.toString();
    }
    return ipKeyGenerator(req.ip || req.connection.remoteAddress);
  },
  skip: (req) => !req.user?.admin
});

module.exports = { cashPaymentLimiter };
