// server/routes/feedback.js
const express = require('express'); 
const router = express.Router();    
const feedbackController = require('../controllers/feedbackController');
const { requireAuth } = require('../middleware/auth');
const { feedbackLimiter } = require('../middleware/feedbackRateLimit');

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Feedback routes are working!' });
});

// Get feedback status for a scan (user's existing feedback)
router.get('/status/:scanId', requireAuth, feedbackController.getFeedbackStatus);

// Get feedback statistics for a scan (aggregate stats)
router.get('/stats/:scanId', requireAuth, feedbackController.getFeedbackStats);

// Submit or update feedback
router.post('/submit', requireAuth, feedbackLimiter, feedbackController.submitFeedback);

module.exports = router;