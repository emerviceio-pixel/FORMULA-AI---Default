// server/middleware/authenticateUser.js
const { requireAuth } = require('./auth');
const { requireAPIToken } = require('./apiAuth');

const authenticateUser = (req, res, next) => {
  // Mobile: Check for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return requireAPIToken(req, res, next);
  }
  
  // Web: Use session-based auth
  return requireAuth(req, res, next);
};

module.exports = authenticateUser;