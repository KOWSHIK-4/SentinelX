import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';

let adminToken: string;
let analystToken: string;
let viewerToken: string;
let testIncidentId: string;

const adminUser = { email: 'admin@sentinelx.io', password: 'Admin123!' };

async function ensureRoleWithPermissions(roleName: string, permissions: { resource: string; action: string }[]) {
  let role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    role = await prisma.role.create({ data: { name: roleName, description: roleName } });
  } else {
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  }
  for (const { resource, action } of permissions) {
    const permName = `${resource}:${action}`;
    let perm = await prisma.permission.findUnique({ where: { name: permName } });
    if (!perm) {
      perm = await prisma.permission.create({ data: { name: permName, resource, action } });
    }
    await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: perm.id } });
  }
  return role;
}

async function registerAndAssignRole(email: string, roleName: string, requiredPermissions: { resource: string; action: string }[]) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'TestPass123!',
      firstName: roleName,
      lastName: 'User',
    });

  const userId = res.body.data.user.id;

  const role = await ensureRoleWithPermissions(roleName, requiredPermissions);

  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId: role.id } },
  });
  if (!existing) {
    await prisma.userRole.create({ data: { userId, roleId: role.id } });
  }

  return res.body.data.token;
}

describe('Incidents API', () => {
  beforeAll(async () => {
    await ensureRoleWithPermissions('Admin', [
      { resource: 'incidents', action: 'read' },
      { resource: 'incidents', action: 'write' },
      { resource: 'incidents', action: 'delete' },
    ]);

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send(adminUser);
    adminToken = adminRes.body.data.token;

    analystToken = await registerAndAssignRole(`analyst-${Date.now()}@test.com`, 'Analyst', [
      { resource: 'incidents', action: 'read' },
      { resource: 'incidents', action: 'write' },
    ]);
    viewerToken = await registerAndAssignRole(`viewer-${Date.now()}@test.com`, 'Viewer', [
      { resource: 'incidents', action: 'read' },
    ]);
  });

  describe('POST /api/incidents', () => {
    it('should create an incident as Admin and return 201', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Incident',
          description: 'This is a test incident for testing purposes.',
          severity: 'HIGH',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Incident');
      expect(res.body.data.severity).toBe('HIGH');
      expect(res.body.data.status).toBe('OPEN');

      testIncidentId = res.body.data.id;
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/incidents')
        .send({ title: 'Test', description: 'Test' })
        .expect(401);
    });

    it('should reject Viewer from creating with 403', async () => {
      await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Test', description: 'Test' })
        .expect(403);
    });

    it('should allow Analyst to create incidents', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ title: 'Analyst Created', description: 'Created by analyst' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing title with 400', async () => {
      await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Test' })
        .expect(400);
    });
  });

  describe('GET /api/incidents', () => {
    it('should return paginated incidents', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/incidents?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach((inc: { status: string }) => {
        expect(inc.status).toBe('OPEN');
      });
    });

    it('should filter by severity', async () => {
      const res = await request(app)
        .get('/api/incidents?severity=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      res.body.data.forEach((inc: { severity: string }) => {
        expect(inc.severity).toBe('HIGH');
      });
    });

    it('should search by title', async () => {
      const res = await request(app)
        .get('/api/incidents?search=Test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate correctly', async () => {
      const res = await request(app)
        .get('/api/incidents?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should allow Viewer to read incidents', async () => {
      await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);
    });

    it('should allow Analyst to read incidents', async () => {
      await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);
    });
  });

  describe('GET /api/incidents/:id', () => {
    it('should return a single incident by ID', async () => {
      const res = await request(app)
        .get(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testIncidentId);
      expect(res.body.data.createdBy).toBeDefined();
    });

    it('should return 404 for non-existent incident', async () => {
      await request(app)
        .get('/api/incidents/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/incidents/:id', () => {
    it('should update an incident as Admin', async () => {
      const res = await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title', status: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should reject Viewer from updating with 403', async () => {
      await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should allow Analyst to update', async () => {
      const res = await request(app)
        .put(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ status: 'RESOLVED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });

  describe('DELETE /api/incidents/:id', () => {
    it('should reject Viewer from deleting with 403', async () => {
      await request(app)
        .delete(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should reject Analyst from deleting with 403', async () => {
      await request(app)
        .delete(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);
    });

    it('should delete an incident as Admin', async () => {
      await request(app)
        .delete(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 404 after deletion', async () => {
      await request(app)
        .get(`/api/incidents/${testIncidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/incidents/stats', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app)
        .get('/api/incidents/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalIncidents).toBe('number');
      expect(typeof res.body.data.openIncidents).toBe('number');
      expect(typeof res.body.data.criticalIncidents).toBe('number');
      expect(typeof res.body.data.resolvedIncidents).toBe('number');
      expect(Array.isArray(res.body.data.recentIncidents)).toBe(true);
    });
  });
});
