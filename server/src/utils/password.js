const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password securely using bcrypt
 * @param {string} password 
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password string is required for hashing');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a candidate plaintext password with a hashed password
 * @param {string} candidatePassword 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
const comparePassword = async (candidatePassword, hash) => {
  if (!candidatePassword || !hash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
