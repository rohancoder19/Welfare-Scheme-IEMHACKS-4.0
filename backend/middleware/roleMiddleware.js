const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // Allow bypass in local development if requested
      if (process.env.NODE_ENV !== 'production') {
        return next();
      }
      return res.status(403).json({ 
        success: false, 
        message: `Role (${req.user ? req.user.role : 'Guest'}) is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
