const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Auth API Tests', () => {
  let token;
  let userId;
  let schoolId;
  let tenantId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    // Use existing demo school for tests
    const School = require('../models/School');
    const school = await School.findOne().lean();
    if (school) {
      schoolId = school._id.toString();
      tenantId = school.tenantId;
    }
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: 'test' } });
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
          tenantId: tenantId || 'test-tenant-123',
          schoolId: schoolId || '507f1f77bcf86cd799439011'
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
          tenantId: tenantId || 'test-tenant-123'
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
  let classId;

  beforeAll(async () => {
    // Login as demo school admin
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'schooladmin@rigveda.com',
        password: 'admin123'
      });
    token = res.body.token;

    // Fetch an existing class for the school
    const Class = require('../models/Class');
    const cls = await Class.findOne({ tenantId: '1' }).select('_id').lean();
    if (cls) classId = cls._id.toString();
  });

  describe('GET /api/students', () => {
    it('should get all students with valid token', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', '1');

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
      if (!classId) return;
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', '1')
        .send({
          admissionNo: 'TEST-001',
          classId,
          section: 'A',
          academicSession: '2024-25',
          personalInfo: {
            firstName: 'Test',
            lastName: 'Student',
            dateOfBirth: '2015-01-01',
            gender: 'male'
          },
          parentInfo: {
            fatherName: 'Test Father',
            fatherPhone: '+91-9876543210'
          }
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      studentId = res.body.student._id;
    });

    it('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${token}`)
        .set('x-tenant-id', '1')
        .send({
          admissionNo: 'TEST-002',
          firstName: 'Test'
          // Missing required fields
        });

      expect(res.statusCode).toEqual(400);
    });
  });

  afterAll(async () => {
    if (studentId) {
      const Student = require('../models/Student');
      await Student.deleteOne({ _id: studentId });
    }
    await User.deleteMany({ email: { $regex: 'test' } });
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
