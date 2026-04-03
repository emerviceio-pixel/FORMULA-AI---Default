// server/middleware/auth.js
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // Check if PIN has been verified (for sensitive operations)
  if (req.requiresPinVerification && !req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'PIN verification required'
    });
  }

    // ✅ UPDATE LAST ACTIVE TIMESTAMP
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      lastActiveAt: new Date()
    });
  } catch (error) {
    console.warn('Failed to update lastActiveAt:', error.message);
  }
  
  // ✅ NEW: Check if premium subscription has expired
  try {
    const user = await User.findById(req.session.userId);
    if (user && user.subscription === 'premium' && user.subscriptionExpiry) {
      const now = new Date();
      if (user.subscriptionExpiry < now) {
        // Auto-downgrade expired subscriptions
        await User.findByIdAndUpdate(req.session.userId, {
          subscription: 'free',
          subscriptionExpiry: null
        });
        // Update session to reflect downgrade
        req.session.subscription = 'free';
      }
    }
  } catch (error) {
    console.error('Subscription expiry check error:', error);
    // Don't block auth if expiry check fails
  }
  
  next();
};

const requirePinVerification = (req, res, next) => {
  req.requiresPinVerification = true;
  next();
};

const requireAdminAuth = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const User = require('../models/User');
    const user = await User.findById(req.session.userId);
    
    if (!user || !user.admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

module.exports = { requireAuth, requirePinVerification, requireAdminAuth };