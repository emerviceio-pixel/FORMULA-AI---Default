// server/middleware/apiAuth.js
const jwt = require('jsonwebtoken');

const requireAPIToken = (req, res, next) => {
  // Skip if mobile API is disabled
  if (process.env.MOBILE_API_ENABLED !== 'true') {
    return res.status(403).json({ 
      success: false, 
      error: 'Mobile API not enabled' 
    });
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication token required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains user ID and other claims
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Helper function to generate tokens (for login endpoint)
const generateAPIToken = (userId, email, nickname) => {
  return jwt.sign(
    { id: userId, email, nickname },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days for mobile
  );
};

module.exports = { requireAPIToken, generateAPIToken };