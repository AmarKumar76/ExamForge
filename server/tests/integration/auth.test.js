const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const config = require('../../src/config/env');
const User = require('../../src/models/User');

describe('Integration Test: Health & Auth APIs', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri || 'mongodb://127.0.0.1:27017/examforge_test');
    }
  });

  afterAll(async () => {
    // Clean up test users created during integration test
    await User.deleteMany({ email: /test.*@example\.com/ });
    await mongoose.connection.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 UP status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toEqual('UP');
    });
  });

  describe('POST /api/v1/auth/register', () => {
    const testUser = {
      name: 'Integration Test User',
      email: `test_reg_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      role: 'STUDENT',
    };

    it('should register a new student successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toEqual(testUser.email.toLowerCase());
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toEqual('DUPLICATE_EMAIL');
    });

    it('should reject registration with invalid fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toEqual('VALIDATION_ERROR');
    });

    it('should reject public registration attempting SUPER_ADMIN role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Hacker User',
          email: `test_admin_${Date.now()}@example.com`,
          password: 'Password123!',
          role: 'SUPER_ADMIN',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login & GET /api/v1/auth/me', () => {
    const loginUser = {
      name: 'Login Test User',
      email: `test_login_${Date.now()}@example.com`,
      password: 'LoginPassword123!',
    };

    let userToken = '';

    beforeAll(async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(loginUser);
      userToken = regRes.body.data.token;
    });

    it('should authenticate user with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginUser.email,
          password: loginUser.password,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: loginUser.email,
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toEqual('INVALID_CREDENTIALS');
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent_user_9999@example.com',
          password: 'SomePassword123!',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should fetch user profile from /api/v1/auth/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toEqual(loginUser.email.toLowerCase());
    });

    it('should reject /api/v1/auth/me request without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});
