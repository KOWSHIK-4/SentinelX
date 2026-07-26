import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';

let adminToken: string;
let analystToken: string;
let viewerToken: string;
let testAssetId: string;
let secondAssetId: string;

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

describe('Assets API', () => {
  beforeAll(async () => {
    await ensureRoleWithPermissions('Admin', [
      { resource: 'assets', action: 'read' },
      { resource: 'assets', action: 'write' },
    ]);

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send(adminUser);
    adminToken = adminRes.body.data.token;

    analystToken = await registerAndAssignRole(`analyst-assets-${Date.now()}@test.com`, 'Analyst', [
      { resource: 'assets', action: 'read' },
      { resource: 'assets', action: 'write' },
    ]);

    viewerToken = await registerAndAssignRole(`viewer-assets-${Date.now()}@test.com`, 'Viewer', [
      { resource: 'assets', action: 'read' },
    ]);
  });

  afterAll(async () => {
  });

  describe('POST /api/assets — Create Asset', () => {
    it('should create an asset as Admin and return 201', async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assetName: 'Test Web Server',
          hostname: 'web-01',
          ipAddress: '10.0.1.10',
          assetType: 'SERVER',
          operatingSystem: 'Ubuntu 22.04',
          owner: 'Infra Team',
          department: 'Engineering',
          criticality: 'HIGH',
          status: 'ACTIVE',
          location: 'DC-1 Rack A3',
          description: 'Primary web server.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.assetName).toBe('Test Web Server');
      expect(res.body.data.hostname).toBe('web-01');
      expect(res.body.data.ipAddress).toBe('10.0.1.10');
      expect(res.body.data.assetType).toBe('SERVER');
      expect(res.body.data.operatingSystem).toBe('Ubuntu 22.04');
      expect(res.body.data.owner).toBe('Infra Team');
      expect(res.body.data.department).toBe('Engineering');
      expect(res.body.data.criticality).toBe('HIGH');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.location).toBe('DC-1 Rack A3');
      expect(res.body.data.description).toBe('Primary web server.');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.message).toBe('Asset created successfully.');

      testAssetId = res.body.data.id;
    });

    it('should create an asset with defaults for optional fields', async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: 'Minimal Asset' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.assetName).toBe('Minimal Asset');
      expect(res.body.data.assetType).toBe('OTHER');
      expect(res.body.data.criticality).toBe('MEDIUM');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.hostname).toBeNull();
      expect(res.body.data.ipAddress).toBeNull();

      secondAssetId = res.body.data.id;
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .post('/api/assets')
        .send({ assetName: 'Unauthenticated Asset' })
        .expect(401);
    });

    it('should reject Viewer from creating with 403', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ assetName: 'Viewer Asset' })
        .expect(403);
    });

    it('should allow Analyst to create assets', async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ assetName: 'Analyst Created Asset' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing assetName with 400', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('should reject empty assetName with 400', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: '' })
        .expect(400);
    });

    it('should reject invalid assetType enum with 400', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: 'Bad Type', assetType: 'INVALID_TYPE' })
        .expect(400);
    });

    it('should reject invalid criticality enum with 400', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: 'Bad Criticality', criticality: 'ULTRA' })
        .expect(400);
    });

    it('should reject assetName exceeding 255 characters with 400', async () => {
      await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: 'A'.repeat(256) })
        .expect(400);
    });
  });

  describe('GET /api/assets — List Assets', () => {
    it('should return paginated assets', async () => {
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(10);
      expect(typeof res.body.pagination.total).toBe('number');
      expect(typeof res.body.pagination.totalPages).toBe('number');
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/assets?limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.pagination.limit).toBe(2);
    });

    it('should respect page parameter', async () => {
      const res = await request(app)
        .get('/api/assets?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
      expect(res.body.pagination.page).toBe(1);
    });

    it('should allow Viewer to read assets', async () => {
      await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);
    });

    it('should allow Analyst to read assets', async () => {
      await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);
    });

    it('should reject unauthenticated request with 401', async () => {
      await request(app)
        .get('/api/assets')
        .expect(401);
    });
  });

  describe('GET /api/assets — Search', () => {
    it('should search by assetName', async () => {
      const res = await request(app)
        .get('/api/assets?search=Test+Web')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      for (const asset of res.body.data) {
        const props = [asset.assetName, asset.hostname, asset.ipAddress, asset.owner, asset.department, asset.location]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        expect(props).toContain('test');
      }
    });

    it('should search by hostname', async () => {
      const res = await request(app)
        .get('/api/assets?search=web-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty results for non-matching search', async () => {
      const res = await request(app)
        .get('/api/assets?search=zzzzzznonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.pagination.total).toBe(0);
    });
  });

  describe('GET /api/assets — Filters', () => {
    it('should filter by assetType', async () => {
      const res = await request(app)
        .get('/api/assets?assetType=SERVER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      for (const asset of res.body.data) {
        expect(asset.assetType).toBe('SERVER');
      }
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/assets?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      for (const asset of res.body.data) {
        expect(asset.status).toBe('ACTIVE');
      }
    });

    it('should filter by criticality', async () => {
      const res = await request(app)
        .get('/api/assets?criticality=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      for (const asset of res.body.data) {
        expect(asset.criticality).toBe('HIGH');
      }
    });

    it('should combine multiple filters', async () => {
      const res = await request(app)
        .get('/api/assets?assetType=SERVER&status=ACTIVE&criticality=HIGH')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      for (const asset of res.body.data) {
        expect(asset.assetType).toBe('SERVER');
        expect(asset.status).toBe('ACTIVE');
        expect(asset.criticality).toBe('HIGH');
      }
    });
  });

  describe('GET /api/assets — Sorting', () => {
    it('should sort by assetName asc', async () => {
      const res = await request(app)
        .get('/api/assets?sortBy=assetName&sortOrder=asc&limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const names = res.body.data.map((a: { assetName: string }) => a.assetName);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });

    it('should sort by assetName desc', async () => {
      const res = await request(app)
        .get('/api/assets?sortBy=assetName&sortOrder=desc&limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const names = res.body.data.map((a: { assetName: string }) => a.assetName);
      const sorted = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).toEqual(sorted);
    });

    it('should sort by createdAt desc by default', async () => {
      const res = await request(app)
        .get('/api/assets?limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const dates = res.body.data.map((a: { createdAt: string }) => new Date(a.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });

    it('should reject invalid sortBy field with 400', async () => {
      await request(app)
        .get('/api/assets?sortBy=invalidField')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should sort by criticality asc', async () => {
      const res = await request(app)
        .get('/api/assets?sortBy=criticality&sortOrder=asc&limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const values = res.body.data.map((a: { criticality: string }) => a.criticality);
      const enumOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const sorted = [...values].sort((a, b) => enumOrder.indexOf(a) - enumOrder.indexOf(b));
      expect(values).toEqual(sorted);
    });

    it('should sort by status desc', async () => {
      const res = await request(app)
        .get('/api/assets?sortBy=status&sortOrder=desc&limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const values = res.body.data.map((a: { status: string }) => a.status);
      const sorted = [...values].sort((a, b) => b.localeCompare(a));
      expect(values).toEqual(sorted);
    });
  });

  describe('GET /api/assets/:id — Get Single Asset', () => {
    it('should return a single asset by ID', async () => {
      const res = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testAssetId);
      expect(res.body.data.assetName).toBe('Test Web Server');
      expect(res.body.data.incidents).toBeDefined();
      expect(Array.isArray(res.body.data.incidents)).toBe(true);
    });

    it('should return 404 for non-existent asset', async () => {
      await request(app)
        .get('/api/assets/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/assets/:id — Update Asset', () => {
    it('should update an asset as Admin and return 200', async () => {
      const res = await request(app)
        .put(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          assetName: 'Updated Web Server',
          hostname: 'web-02',
          criticality: 'CRITICAL',
          status: 'MAINTENANCE',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.assetName).toBe('Updated Web Server');
      expect(res.body.data.hostname).toBe('web-02');
      expect(res.body.data.criticality).toBe('CRITICAL');
      expect(res.body.data.status).toBe('MAINTENANCE');
      expect(res.body.message).toBe('Asset updated successfully.');
    });

    it('should partially update only provided fields', async () => {
      const res = await request(app)
        .put(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description only.' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated description only.');
      expect(res.body.data.assetName).toBe('Updated Web Server');
    });

    it('should reject Viewer from updating with 403', async () => {
      await request(app)
        .put(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ assetName: 'Hacked' })
        .expect(403);
    });

    it('should allow Analyst to update', async () => {
      const res = await request(app)
        .put(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('should return 404 for non-existent asset', async () => {
      await request(app)
        .put('/api/assets/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: 'Ghost' })
        .expect(404);
    });

    it('should reject invalid status enum with 400', async () => {
      await request(app)
        .put(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('DELETE /api/assets/:id — Delete Asset', () => {
    let assetToDeleteId: string;
    let analystDeleteAssetId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetName: 'Asset To Delete' });
      assetToDeleteId = res.body.data.id;

      const analystRes = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({ assetName: 'Analyst Asset To Delete' });
      analystDeleteAssetId = analystRes.body.data.id;
    });

    it('should reject Viewer from deleting with 403', async () => {
      await request(app)
        .delete(`/api/assets/${assetToDeleteId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should allow Analyst to delete (has ASSETS_WRITE permission)', async () => {
      const res = await request(app)
        .delete(`/api/assets/${analystDeleteAssetId}`)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Asset deleted successfully.');
    });

    it('should delete an asset as Admin and return 200', async () => {
      const res = await request(app)
        .delete(`/api/assets/${assetToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Asset deleted successfully.');
    });

    it('should return 404 after deletion', async () => {
      await request(app)
        .get(`/api/assets/${assetToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent asset', async () => {
      await request(app)
        .delete('/api/assets/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/assets/stats — Dashboard Statistics', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app)
        .get('/api/assets/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(typeof res.body.data.totalAssets).toBe('number');
      expect(typeof res.body.data.activeAssets).toBe('number');
      expect(typeof res.body.data.maintenanceAssets).toBe('number');
      expect(typeof res.body.data.retiredAssets).toBe('number');
      expect(typeof res.body.data.criticalAssets).toBe('number');
      expect(typeof res.body.data.highAssets).toBe('number');
      expect(Array.isArray(res.body.data.recentAssets)).toBe(true);
    });
  });

  describe('Database Persistence Verification', () => {
    it('should persist created asset in database', async () => {
      const dbAsset = await prisma.asset.findUnique({ where: { id: testAssetId } });
      expect(dbAsset).not.toBeNull();
      expect(dbAsset!.assetName).toBe('Updated Web Server');
    });

    it('should persist updated fields in database', async () => {
      const dbAsset = await prisma.asset.findUnique({ where: { id: testAssetId } });
      expect(dbAsset).not.toBeNull();
      expect(dbAsset!.criticality).toBe('CRITICAL');
      expect(dbAsset!.status).toBe('ACTIVE');
    });

    it('should have correct default values in database', async () => {
      const dbAsset = await prisma.asset.findUnique({ where: { id: secondAssetId } });
      expect(dbAsset).not.toBeNull();
      expect(dbAsset!.assetType).toBe('OTHER');
      expect(dbAsset!.criticality).toBe('MEDIUM');
      expect(dbAsset!.status).toBe('ACTIVE');
    });

    it('should have valid timestamps', async () => {
      const dbAsset = await prisma.asset.findUnique({ where: { id: testAssetId } });
      expect(dbAsset).not.toBeNull();
      expect(dbAsset!.createdAt).toBeInstanceOf(Date);
      expect(dbAsset!.updatedAt).toBeInstanceOf(Date);
      expect(dbAsset!.updatedAt.getTime()).toBeGreaterThanOrEqual(dbAsset!.createdAt.getTime());
    });

    it('should cascade audit log entries for CRUD operations', async () => {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          resource: 'Asset',
          resourceId: testAssetId,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(2);
      const actions = auditLogs.map((l) => l.action);
      expect(actions).toContain('Create Asset');
      expect(actions).toContain('Update Asset');
    });
  });
});
