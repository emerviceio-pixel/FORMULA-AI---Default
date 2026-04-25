// REPLACE THE ENTIRE FILE WITH:

const User = require('../models/User');
const { syncUserSubscriptionStatus } = require('../services/subscriptionSyncService');

const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // UPDATE LAST ACTIVE TIMESTAMP
  try {
    await User.findByIdAndUpdate(req.session.userId, {
      lastActiveAt: new Date()
    });
  } catch (error) {
    // Silent fail
  }
  
  // SYNC SUBSCRIPTION STATUS
  try {
    const syncResult = await syncUserSubscriptionStatus(req.session.userId);
    if (syncResult) {
      req.session.subscription = syncResult.subscription;
    }
  } catch (error) {
    console.error('Error syncing subscription status:', error);
  }
  
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

module.exports = { requireAuth, requireAdminAuth };