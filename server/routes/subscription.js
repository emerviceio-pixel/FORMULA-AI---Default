// server/routes/subscription.js
const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Initialize payment
router.post('/initialize', subscriptionController.initializePayment);

// Verify payment (manual fallback)
router.get('/verify', subscriptionController.verifyPayment);

// Webhook endpoint (for automatic verification)
router.post('/webhook', subscriptionController.handleWebhook);

router.post('/cancel', requireAuth, subscriptionController.cancelSubscription);

module.exports = router;