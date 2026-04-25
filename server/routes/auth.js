const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// Public routes
router.post('/google', authController.googleAuth);
router.post('/logout', authController.logout);
router.get('/auth/me', authController.getCurrentUser.bind(authController));

// Session check
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      success: true,
      userId: req.session.userId,
      isAuthenticated: true // ← Always true now
    });
  } else {
    res.json({ success: false });
  }
});

module.exports = router;