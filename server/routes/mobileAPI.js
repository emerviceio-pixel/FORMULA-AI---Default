// server/routes/mobileAPI.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Mobile login using EMAIL + PIN only
router.post('/login', async (req, res) => {
  try {
    const { email, pin } = req.body;
    
    if (!email || !pin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and PIN required' 
      });
    }
    
    const user = await User.findOne({ email }).select('+pinHash');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
    
    // Verify PIN using bcrypt
    const isPinValid = await bcrypt.compare(pin, user.pinHash);
    
    if (!isPinValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid PIN' 
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
    console.error('Mobile login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
});

module.exports = router;