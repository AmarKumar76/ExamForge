const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');
const { ROLES, ACCOUNT_STATUS } = require('../constants/roles');

class AuthService {
  /**
   * Registers a new user account
   * @param {object} userData { name, email, password, role }
   */
  async registerUser({ name, email, password, role = ROLES.STUDENT }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User record
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: role || ROLES.STUDENT,
      status: ACCOUNT_STATUS.ACTIVE,
    });

    // Generate Access Token
    const token = generateAccessToken({
      userId: user._id,
      role: user.role,
      institutionId: user.institutionId,
    });

    return {
      user: user.toSafeObject(),
      token,
    };
  }

  /**
   * Authenticates user credentials and issues session token
   * @param {object} credentials { email, password }
   */
  async loginUser({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Check account status
    if (user.status === ACCOUNT_STATUS.SUSPENDED) {
      const error = new Error('Account suspended. Please contact your Institution Administrator.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_SUSPENDED';
      throw error;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Generate Token
    const token = generateAccessToken({
      userId: user._id,
      role: user.role,
      institutionId: user.institutionId,
    });

    return {
      user: user.toSafeObject(),
      token,
    };
  }

  /**
   * Gets authenticated profile details
   * @param {string} userId 
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User profile not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user.toSafeObject();
  }
}

module.exports = new AuthService();
