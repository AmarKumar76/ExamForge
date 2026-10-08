const crypto = require('crypto');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const auditService = require('./audit.service');
const emailService = require('./email.service');
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

    // Audit Log
    auditService.logAudit({
      user,
      action: 'ACCOUNT_CREATED',
      resourceType: 'USER',
      resourceId: user._id.toString(),
      resourceName: user.email,
      status: 'SUCCESS',
      metadata: { role: user.role },
    });

    return {
      user: user.toSafeObject(),
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
      auditService.logAudit({
        user: { name: normalizedEmail, email: normalizedEmail, role: 'ANONYMOUS' },
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        resourceName: normalizedEmail,
        status: 'FAILED',
        metadata: { reason: 'USER_NOT_FOUND' },
      });
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Check account status
    if (user.status === ACCOUNT_STATUS.SUSPENDED) {
      auditService.logAudit({
        user,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        resourceId: user._id.toString(),
        resourceName: user.email,
        status: 'FAILED',
        metadata: { reason: 'ACCOUNT_SUSPENDED' },
      });
      const error = new Error('Account suspended. Please contact your Institution Administrator.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_SUSPENDED';
      throw error;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      auditService.logAudit({
        user,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        resourceId: user._id.toString(),
        resourceName: user.email,
        status: 'FAILED',
        metadata: { reason: 'INVALID_PASSWORD' },
      });
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

    // Audit Log
    auditService.logAudit({
      user,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      resourceName: user.email,
      status: 'SUCCESS',
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

  /**
   * Generates a password reset token and dispatches reset instructions
   * @param {string} email 
   */
  async forgotPassword(email) {
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    };

    if (!email || typeof email !== 'string') {
      return genericResponse;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Do NOT reveal if email exists. Return generic message.
      return genericResponse;
    }

    // Invalidate existing unused reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: user._id, usedAt: null },
      { usedAt: new Date() }
    );

    // Generate a cryptographically secure random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store only the SHA-256 hash of the reset token
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    // Send reset email via email service
    await emailService.sendPasswordResetEmail({
      to: user.email,
      resetToken,
    });

    auditService.logAudit({
      user,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      resourceName: user.email,
      status: 'SUCCESS',
    });

    return genericResponse;
  }

  /**
   * Validates reset token and sets new password
   * @param {object} options { token, password }
   */
  async resetPassword({ token, password }) {
    if (!token || typeof token !== 'string') {
      const error = new Error('Password reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    // Hash incoming token to match against stored hash
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const resetRecord = await PasswordResetToken.findOne({ tokenHash });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      const error = new Error('Password reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      const error = new Error('Password reset link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Hash new password using existing bcrypt implementation
    const newPasswordHash = await hashPassword(password);
    user.passwordHash = newPasswordHash;
    await user.save();

    // Mark reset token as used
    resetRecord.usedAt = new Date();
    await resetRecord.save();

    // Invalidate any other active reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: user._id, usedAt: null },
      { usedAt: new Date() }
    );

    auditService.logAudit({
      user,
      action: 'PASSWORD_RESET_COMPLETED',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      resourceName: user.email,
      status: 'SUCCESS',
    });

    return {
      success: true,
      message: 'Password reset successfully.',
    };
  }

  /**
   * Verifies user email address using verificationToken
   */
  async verifyEmail(token) {
    if (!token || typeof token !== 'string') {
      const error = new Error('Email verification link is invalid or expired.');
      error.statusCode = 400;
      error.code = 'INVALID_VERIFICATION_TOKEN';
      throw error;
    }

    const user = await User.findOne({
      verificationToken: token.trim(),
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      const error = new Error('Email verification link is invalid or has expired.');
      error.statusCode = 400;
      error.code = 'INVALID_VERIFICATION_TOKEN';
      throw error;
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    auditService.logAudit({
      user,
      action: 'EMAIL_VERIFIED',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      resourceName: user.email,
      status: 'SUCCESS',
    });

    return {
      success: true,
      message: 'Email address verified successfully. You can now log in to ExamForge.',
      user: user.toSafeObject(),
    };
  }

  /**
   * Resend verification email to specified user email
   */
  async resendVerification(email) {
    if (!email || typeof email !== 'string') {
      const error = new Error('Email address is required.');
      error.statusCode = 400;
      error.code = 'INVALID_EMAIL';
      throw error;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email address, a new verification link has been dispatched.',
      };
    }

    if (user.isVerified) {
      return {
        success: true,
        message: 'Your email address is already verified.',
      };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    const emailRes = await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken,
      role: user.role,
    });

    const Notification = require('../models/Notification');
    await Notification.create({
      studentId: user._id,
      recipientEmail: user.email,
      type: 'WELCOME_VERIFICATION',
      title: 'Email Verification Link Resent',
      message: `Verification email dispatched to ${user.email}`,
      status: emailRes.success ? 'SENT' : 'FAILED',
      failureReason: emailRes.error || null,
    });

    return {
      success: true,
      message: 'Verification email has been resent to your address.',
      emailDelivery: emailRes,
    };
  }
}

module.exports = new AuthService();
