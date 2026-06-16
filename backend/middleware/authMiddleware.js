const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if the token arrives in the standard format: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token string
      token = req.headers.authorization.split(' ')[1];

      // Decode the token using your environment secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Fetch the user from the database and attach it to the request object (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      // Pass control to the next route controller handler
      return next();
    } catch (error) {
      console.error('❌ Token Verification Failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no security token provided' });
  }
};

module.exports = { protect };