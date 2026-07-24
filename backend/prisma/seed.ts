import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingRoles = await prisma.role.findMany();
  if (existingRoles.length > 0) {
    console.log('Roles already exist, checking if admin user needs role...');

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@sentinelx.io' } });
    if (adminUser) {
      const hasAdminRole = await prisma.userRole.findFirst({
        where: { userId: adminUser.id, role: { name: 'Admin' } },
      });
      if (!hasAdminRole) {
        const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
        if (adminRole) {
          await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
          console.log('Assigned Admin role to existing admin user.');
        }
      }
    }

    return;
  }

  const adminRole = await prisma.role.create({
    data: { name: 'Admin', description: 'Full system access with all permissions' },
  });
  const analystRole = await prisma.role.create({
    data: { name: 'Analyst', description: 'Can view and manage incidents, assets, and reports' },
  });
  const viewerRole = await prisma.role.create({
    data: { name: 'Viewer', description: 'Read-only access to dashboards and reports' },
  });

  const permissions = [
    { name: 'incidents:read', resource: 'incidents', action: 'read' },
    { name: 'incidents:create', resource: 'incidents', action: 'create' },
    { name: 'incidents:update', resource: 'incidents', action: 'update' },
    { name: 'incidents:delete', resource: 'incidents', action: 'delete' },
    { name: 'assets:read', resource: 'assets', action: 'read' },
    { name: 'assets:create', resource: 'assets', action: 'create' },
    { name: 'assets:update', resource: 'assets', action: 'update' },
    { name: 'assets:delete', resource: 'assets', action: 'delete' },
    { name: 'analytics:read', resource: 'analytics', action: 'read' },
    { name: 'reports:read', resource: 'reports', action: 'read' },
    { name: 'reports:create', resource: 'reports', action: 'create' },
    { name: 'reports:delete', resource: 'reports', action: 'delete' },
    { name: 'team:read', resource: 'team', action: 'read' },
    { name: 'team:manage', resource: 'team', action: 'manage' },
    { name: 'settings:read', resource: 'settings', action: 'read' },
    { name: 'settings:manage', resource: 'settings', action: 'manage' },
    { name: 'users:manage', resource: 'users', action: 'manage' },
  ];

  for (const perm of permissions) {
    await prisma.permission.create({ data: perm });
  }

  const allPermissions = await prisma.permission.findMany();

  const viewPermissions = allPermissions.filter((p) => p.action === 'read');
  const managePermissions = allPermissions.filter((p) => p.action === 'manage');

  for (const perm of viewPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: viewerRole.id, permissionId: perm.id },
    });
  }

  for (const perm of allPermissions) {
    if (perm.action !== 'manage' || perm.resource === 'team' || perm.resource === 'settings') {
      await prisma.rolePermission.create({
        data: { roleId: analystRole.id, permissionId: perm.id },
      });
    }
  }

  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@sentinelx.io' } });
  const adminUser = existingAdmin || (await prisma.user.create({
    data: {
      email: 'admin@sentinelx.io',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
    },
  }));

  await prisma.userRole.create({
    data: { userId: adminUser.id, roleId: adminRole.id },
  });

  console.log('Seed complete:');
  console.log('  - 3 roles created: Admin, Analyst, Viewer');
  console.log(`  - ${permissions.length} permissions created`);
  console.log('  - 1 admin user created: admin@sentinelx.io / Admin123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });