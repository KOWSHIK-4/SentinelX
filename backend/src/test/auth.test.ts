import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

let authToken: string;

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 with token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.firstName).toBe(testUser.firstName);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.roles).toBeDefined();
      expect(res.body.data.user.roles).toHaveLength(0);

      authToken = res.body.data.token;
    });

    it('should reject duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });

    it('should reject invalid email with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject short password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testUser.email })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return 200 with token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.roles).toBeDefined();

      authToken = res.body.data.token;
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid');
    });

    it('should reject non-existent email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'SomePass123!' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.roles).toBeDefined();
    });

    it('should reject request without token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Authentication required');
    });

    it('should reject request with invalid token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});