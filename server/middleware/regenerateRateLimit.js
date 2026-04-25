// server/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Store for tracking regenerate attempts
const regenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 regeneration per minute
  message: {
    success: false,
    error: 'Too many regenerations. Please wait 60 seconds.',
    type: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  keyGenerator: (req) => {
    // Use userId if available, otherwise fallback to IP with IPv6 subnet handling
    if (req.session?.userId) {
      return req.session.userId.toString();
    }
    // ✅ FIXED: Use ipKeyGenerator to handle IPv6 subnets properly
    return ipKeyGenerator(req.ip);
  },
  // Optional: Set IPv6 subnet size (default is 64)
  // ipv6Subnet: 64
});

module.exports = { regenerateLimiter };