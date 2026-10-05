const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generates a signed JWT access token for authenticated users
 * @param {object} payload - { userId, role, institutionId }
 * @returns {string} Signed JWT token string
 */
const generateAccessToken = (payload) => {
  const safePayload = {
    userId: payload.userId || payload.id || payload._id,
    role: payload.role,
    institutionId: payload.institutionId || null,
  };

  return jwt.sign(safePayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifies and decodes a JWT access token
 * @param {string} token 
 * @returns {object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
