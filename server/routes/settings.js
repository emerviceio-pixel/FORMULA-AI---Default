// routes/settings.js
const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { requireAuth } = require('../middleware/auth'); 

// Get user settings
router.get('/', requireAuth, SettingsController.getSettings);

// Update settings
router.put('/', requireAuth, SettingsController.updateSettings);

// Update subscription
router.post('/subscription', requireAuth, SettingsController.updateSubscription);

// Delete account - ONLY requireAuth
router.delete('/account', 
  requireAuth,  // Just check if user is logged in
  SettingsController.deleteAccount
);

// Test endpoint
router.get('/test-connection', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Settings route is working',
    sessionId: req.session?.id,
    userId: req.session?.userId
  });
});

module.exports = router;