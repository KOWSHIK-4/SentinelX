import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingRoles = await prisma.role.findMany();

  if (existingRoles.length === 0) {
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
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sentinelx.io',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
      },
    });

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    console.log('  - 3 roles created: Admin, Analyst, Viewer');
    console.log(`  - ${permissions.length} permissions created`);
    console.log('  - 1 admin user created: admin@sentinelx.io / Admin123!');
  }

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@sentinelx.io' } });
  if (!adminUser) {
    console.error('Admin user not found. Aborting.');
    return;
  }

  const existingIncidents = await prisma.incident.count();
  if (existingIncidents === 0) {
    await prisma.incident.createMany({
      data: [
        { title: 'Suspicious outbound traffic detected', description: 'Large data transfer to unknown external IP address detected during routine monitoring.', status: 'OPEN', severity: 'CRITICAL', createdById: adminUser.id },
        { title: 'Failed login attempts from unknown IP', description: 'Multiple failed SSH login attempts detected from IP range 185.220.101.x.', status: 'IN_PROGRESS', severity: 'HIGH', createdById: adminUser.id },
        { title: 'Unusual database query pattern', description: 'Abnormal query patterns detected on production database during off-hours.', status: 'OPEN', severity: 'MEDIUM', createdById: adminUser.id },
        { title: 'SSL certificate expiring in 7 days', description: 'SSL certificate for main domain will expire. Renewal required.', status: 'OPEN', severity: 'LOW', createdById: adminUser.id },
        { title: 'Phishing campaign targeting employees', description: 'Multiple employees reported suspicious emails冒充 IT department.', status: 'IN_PROGRESS', severity: 'CRITICAL', createdById: adminUser.id },
        { title: 'Malware detected on endpoint', description: 'Antivirus flagged suspicious executable on workstation WS-045.', status: 'RESOLVED', severity: 'HIGH', createdById: adminUser.id },
        { title: 'Firewall rule misconfiguration', description: 'Incorrect firewall rule allowing inbound traffic on port 1433 from external networks.', status: 'RESOLVED', severity: 'HIGH', createdById: adminUser.id },
        { title: 'VPN service outage', description: 'VPN gateway experiencing intermittent connectivity issues affecting remote users.', status: 'CLOSED', severity: 'MEDIUM', createdById: adminUser.id },
        { title: 'Unauthorized access attempt to admin panel', description: 'Brute force attack detected on admin login panel from multiple IPs.', status: 'OPEN', severity: 'CRITICAL', createdById: adminUser.id },
        { title: 'DNS configuration anomaly', description: 'Unusual DNS resolution patterns suggesting possible DNS tunneling.', status: 'IN_PROGRESS', severity: 'HIGH', createdById: adminUser.id },
      ],
    });
    console.log('  - 10 sample incidents created');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
