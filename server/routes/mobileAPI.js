// OPTION 1: DELETE the entire mobile API file (if mobile app will use same Google OAuth)
// OPTION 2: Replace with proper auth (e.g., JWT from web session)

// If you need to keep mobile API, here's a modified version WITHOUT PIN:

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mobile login using EMAIL ONLY (no PIN)
// WARNING: This is less secure. Consider using OAuth or a proper mobile auth flow.
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email required' 
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        country: user.country,
        subscription: user.subscription
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

module.exports = router;