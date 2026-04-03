const requireAdminAuth = (req, res, next) => {
  if (!req.session.isAdminAuthenticated) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin authentication required' 
    });
  }
  next();
};

module.exports = { requireAdminAuth };