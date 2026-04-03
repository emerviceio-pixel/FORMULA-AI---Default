// server/routes/regenerate.js
const express = require('express');
const router = express.Router();
const regenerateController = require('../controllers/regenerateController');
const { requireAuth } = require('../middleware/auth');
const { regenerateLimiter } = require('../middleware/regenerateRateLimit');

// Apply rate limiting to regenerate endpoint
router.post('/recommendation', requireAuth, regenerateLimiter, regenerateController.regenerateRecommendation);
router.get('/limit', requireAuth, regenerateController.checkRegenerateLimit);

module.exports = router;