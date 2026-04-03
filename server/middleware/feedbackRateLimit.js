// server/middleware/feedbackRateLimit.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit'); // ✅ Import helper

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many feedback submissions. Please wait before submitting more feedback.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Mobile: use user from JWT
    if (req.user?.id) return req.user.id;
    // Web: use session
    if (req.session?.userId) return req.session.userId;
    // Fallback to IP
    return ipKeyGenerator(req);
  }
});

module.exports = { feedbackLimiter };