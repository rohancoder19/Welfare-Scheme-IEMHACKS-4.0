const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'civic_welfare_secret_key_2026';

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
      }
    } catch (error) {
      console.warn('[Auth Middleware] Invalid token, proceeding as guest user');
    }
  }

  // Fallback for demo guest mode
  req.user = { id: 'guest_citizen_101', email: 'citizen@gov.in', role: 'Citizen', name: 'Citizen Demo' };
  next();
};

module.exports = { protect, JWT_SECRET };
