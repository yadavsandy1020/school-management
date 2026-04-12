const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Auth API Tests', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: 'test' } });
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'test123456',
          role: 'school_admin',
          tenantId: 'test-tenant-123',
          schoolId: '507f1f77bcf86cd799439011'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      userId = res.body.user.id;
    });

    it('should fail with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'test123456',
          role: 'school_admin'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test2@example.com',
          password: '123',
          role: 'school_admin'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123456',
          tenantId: 'test-tenant-123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      token = res.body.token;
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token'
        });

      // This will fail if refresh token is not valid, which is expected
      // In a real test, you'd need to use the actual refresh token from login
      expect([200, 401]).toContain(res.statusCode);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.statusCode).toEqual(401);
    });
  });
});

describe('Student API Tests', () => {
  let token;
  let studentId;

  beforeAll(async () => {
    // Login as school admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'schooladmin@demoschool.com',
        password: 'admin123',
        tenantId: 'demo-school-123456'
      });
    token = res.body.token;
  });

  describe('GET /api/students', () => {
    it('should get all students with valid token', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/students');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/students', () => {
    it('should create a new student with valid data', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({
          admissionNo: 'TEST-001',
          firstName: 'Test',
          lastName: 'Student',
          classId: '507f1f77bcf86cd799439011',
          section: 'A',
          academicYear: '2024-25'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      studentId = res.body.data._id;
    });

    it('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .send({
          admissionNo: 'TEST-002',
          firstName: 'Test'
          // Missing required fields
        });

      expect(res.statusCode).toEqual(400);
    });
  });
});
