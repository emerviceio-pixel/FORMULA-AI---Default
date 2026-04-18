// server/middleware/admin.js
const User = require('../models/User');

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    if (!user.admin) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
     req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = { requireAdmin };