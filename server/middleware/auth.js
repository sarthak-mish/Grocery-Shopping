const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }

    try {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Authentication error' });
    }
  });
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const user = await User.findById(decoded.userId);
      req.user = user || null;
      next();
    } catch (error) {
      req.user = null;
      next();
    }
  });
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET,
};