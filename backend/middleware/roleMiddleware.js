const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Role (${req.user ? req.user.role : 'Unauthenticated'}) is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { authorizeRoles };
