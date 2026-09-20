const jwt = require('jsonwebtoken');

const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || 'secret_for_development',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

module.exports = { generateToken };
