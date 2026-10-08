const request = require('supertest');
const crypto = require('crypto');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const { hashPassword } = require('../utils/password');
const { connectDB, disconnectDB } = require('../config/db');

jest.setTimeout(20000);

describe('Auth Password Recovery & Reset Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({ email: /@examforge.test$/ });
      await PasswordResetToken.deleteMany({});

      const passwordHash = await hashPassword('OldPassword@123');
      testUser = await User.create({
        name: 'Test Recovery User',
        email: 'recovery@examforge.test',
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
      });
    }
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns generic response for an existing user email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'recovery@examforge.test' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'If an account exists with this email, password reset instructions have been sent.'
      );

      // Verify token record was created in DB
      const tokenRecord = await PasswordResetToken.findOne({ userId: testUser._id });
      expect(tokenRecord).not.toBeNull();
      expect(tokenRecord.usedAt).toBeNull();
      expect(tokenRecord.tokenHash).toBeDefined();
    });

    it('returns identical generic response for a non-existing user email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@examforge.test' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'If an account exists with this email, password reset instructions have been sent.'
      );

      // Verify no token record created
      const count = await PasswordResetToken.countDocuments();
      expect(count).toBe(0);
    });

    it('stores token as SHA-256 hash and never in plaintext', async () => {
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'recovery@examforge.test' });

      const tokenRecord = await PasswordResetToken.findOne({ userId: testUser._id });
      expect(tokenRecord.tokenHash.length).toBe(64); // SHA-256 hex string length
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('resets password successfully with valid token and allows login with new password', async () => {
      const rawToken = 'supersecretresettoken123456789012';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await PasswordResetToken.create({
        userId: testUser._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          password: 'NewPassword@123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password reset successfully.');

      // Check token is marked as used
      const updatedToken = await PasswordResetToken.findOne({ tokenHash });
      expect(updatedToken.usedAt).not.toBeNull();

      // Verify old password fails login
      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'recovery@examforge.test', password: 'OldPassword@123' });
      expect(oldLogin.statusCode).toBe(401);

      // Verify new password succeeds login
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'recovery@examforge.test', password: 'NewPassword@123' });
      expect(newLogin.statusCode).toBe(200);
      expect(newLogin.body.data.token).toBeDefined();
    });

    it('rejects reset request if token is invalid or non-existent', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalidtokenxyz',
          password: 'NewPassword@123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password reset link is invalid or has expired.');
    });

    it('rejects reset request if token is expired', async () => {
      const rawToken = 'expiredtoken123456789';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await PasswordResetToken.create({
        userId: testUser._id,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          password: 'NewPassword@123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password reset link is invalid or has expired.');
    });

    it('rejects reuse of a token that has already been used', async () => {
      const rawToken = 'usedtoken123456789';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await PasswordResetToken.create({
        userId: testUser._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          password: 'NewPassword@123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Password reset link is invalid or has expired.');
    });
  });
});
