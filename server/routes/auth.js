const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public routes
router.post('/google', authController.googleAuth);
router.post('/setup-pin', authController.setupPin);
router.post('/verify-pin', authController.verifyPin);
router.get('/pin-attempts', authController.getPinAttempts);
router.post('/reset-pin', authController.resetPin);
router.post('/logout', authController.logout);
router.get('/auth/me', authController.getCurrentUser.bind(authController));

// session check
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      success: true,
      userId: req.session.userId,
      isAuthenticated: !!req.session.isAuthenticated
    });
  } else {
    res.json({ success: false });
  }
});



module.exports = router;