const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { authRateLimiter } = require('../middleware/rate-limit.middleware');

// Public Authentication Routes
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/verify-email', authRateLimiter, authController.verifyEmail);
router.post('/resend-verification', authRateLimiter, authController.resendVerification);

// Authenticated User Profile Route
router.get('/me', requireAuth, authController.me);

module.exports = router;
