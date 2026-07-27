import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(Math.floor(Math.random() * 24));
  d.setMinutes(Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  console.log('Seeding database...');

  // ── Roles & Permissions ──────────────────────────────────────────────
  const existingRoles = await prisma.role.findMany();

  let adminRole: { id: string; name: string };
  let analystRole: { id: string; name: string };
  let viewerRole: { id: string; name: string };

  if (existingRoles.length === 0) {
    adminRole = await prisma.role.create({
      data: { name: 'Admin', description: 'Full system access with all permissions' },
    });
    analystRole = await prisma.role.create({
      data: { name: 'Analyst', description: 'Can view and manage incidents, assets, and reports' },
    });
    viewerRole = await prisma.role.create({
      data: { name: 'Viewer', description: 'Read-only access to dashboards and reports' },
    });

    const permissions = [
      { name: 'incidents:read', resource: 'incidents', action: 'read' },
      { name: 'incidents:write', resource: 'incidents', action: 'write' },
      { name: 'incidents:delete', resource: 'incidents', action: 'delete' },
      { name: 'assets:read', resource: 'assets', action: 'read' },
      { name: 'assets:write', resource: 'assets', action: 'write' },
      { name: 'analytics:read', resource: 'analytics', action: 'read' },
      { name: 'reports:read', resource: 'reports', action: 'read' },
      { name: 'reports:export', resource: 'reports', action: 'export' },
      { name: 'team:read', resource: 'team', action: 'read' },
      { name: 'team:manage', resource: 'team', action: 'manage' },
      { name: 'settings:read', resource: 'settings', action: 'read' },
      { name: 'settings:update', resource: 'settings', action: 'update' },
      { name: 'users:manage', resource: 'users', action: 'manage' },
      { name: 'audit:read', resource: 'audit', action: 'read' },
    ];

    for (const perm of permissions) {
      await prisma.permission.create({ data: perm });
    }

    const allPermissions = await prisma.permission.findMany();

    for (const perm of allPermissions) {
      if (perm.action === 'read') {
        await prisma.rolePermission.create({
          data: { roleId: viewerRole.id, permissionId: perm.id },
        });
      }
    }

    for (const perm of allPermissions) {
      if (perm.action !== 'manage' || perm.resource === 'users') {
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

    console.log('  - 3 roles created: Admin, Analyst, Viewer');
    console.log(`  - ${permissions.length} permissions created`);
  } else {
    adminRole = existingRoles.find((r) => r.name === 'Admin')!;
    analystRole = existingRoles.find((r) => r.name === 'Analyst')!;
    viewerRole = existingRoles.find((r) => r.name === 'Viewer')!;
  }

  // ── Users ────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@sentinelx.io' } });
  if (adminUser) {
    console.log('  - Admin user already exists: admin@sentinelx.io');
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole!.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole!.id },
    });
    console.log('  - Ensured admin user has Admin role');
  } else {
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const newUser = await prisma.user.create({
      data: {
        email: 'admin@sentinelx.io',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
      },
    });
    await prisma.userRole.create({
      data: { userId: newUser.id, roleId: adminRole!.id },
    });
    console.log('  - Admin user created: admin@sentinelx.io / Admin123!');
  }

  const existingAnalyst = await prisma.user.findUnique({ where: { email: 'analyst@sentinelx.io' } });
  let analystUser: { id: string; email: string };

  if (existingAnalyst) {
    analystUser = existingAnalyst;
    console.log('  - Analyst user already exists: analyst@sentinelx.io');
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: analystUser.id, roleId: analystRole!.id } },
      update: {},
      create: { userId: analystUser.id, roleId: analystRole!.id },
    });
    console.log('  - Ensured analyst user has Analyst role');
  } else {
    const hashedPassword = await bcrypt.hash('Analyst123!', 12);
    analystUser = await prisma.user.create({
      data: {
        email: 'analyst@sentinelx.io',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Analyst',
      },
    });
    await prisma.userRole.create({
      data: { userId: analystUser.id, roleId: analystRole!.id },
    });
    console.log('  - Analyst user created: analyst@sentinelx.io / Analyst123!');
  }

  const existingViewer = await prisma.user.findUnique({ where: { email: 'viewer@sentinelx.io' } });
  let viewerUser: { id: string; email: string };

  if (existingViewer) {
    viewerUser = existingViewer;
    console.log('  - Viewer user already exists: viewer@sentinelx.io');
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: viewerUser.id, roleId: viewerRole!.id } },
      update: {},
      create: { userId: viewerUser.id, roleId: viewerRole!.id },
    });
    console.log('  - Ensured viewer user has Viewer role');
  } else {
    const hashedPassword = await bcrypt.hash('Viewer123!', 12);
    viewerUser = await prisma.user.create({
      data: {
        email: 'viewer@sentinelx.io',
        password: hashedPassword,
        firstName: 'Victor',
        lastName: 'Viewer',
      },
    });
    await prisma.userRole.create({
      data: { userId: viewerUser.id, roleId: viewerRole!.id },
    });
    console.log('  - Viewer user created: viewer@sentinelx.io / Viewer123!');
  }

  const users = [adminUser ?? (await prisma.user.findUnique({ where: { email: 'admin@sentinelx.io' } }))!, analystUser, viewerUser];
  const adminUserId = users[0].id;

  // ── Clean existing seed data ─────────────────────────────────────────
  // (preserves roles, permissions, users, settings)
  const existingIncidentCount = await prisma.incident.count();
  if (existingIncidentCount > 0) {
    await prisma.incidentAsset.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.asset.deleteMany();
    console.log('  - Cleared existing incidents, assets, notifications, audit logs');
  }

  // ── Incidents (40) ───────────────────────────────────────────────────
    type IncidentInput = {
      title: string;
      description: string;
      status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      assignedTo?: string;
      createdById: string;
      createdAt: Date;
    };

    const incidentData: IncidentInput[] = [
      // ── OPEN (14) ──
      {
        title: 'Suspicious outbound traffic detected',
        description: 'Large data transfer to unknown external IP address detected during routine monitoring. Approximately 50GB of data was transferred to 45.33.32.156 over 4 hours.',
        status: 'OPEN', severity: 'CRITICAL', createdById: adminUserId, createdAt: daysAgo(1),
      },
      {
        title: 'Unusual database query pattern',
        description: 'Abnormal query patterns detected on production database during off-hours. Queries originated from a non-standard application user account.',
        status: 'OPEN', severity: 'MEDIUM', createdById: adminUserId, createdAt: daysAgo(2),
      },
      {
        title: 'SSL certificate expiring in 7 days',
        description: 'SSL certificate for main domain sentinelx.io will expire in 7 days. Renewal required to prevent service disruption.',
        status: 'OPEN', severity: 'LOW', createdById: adminUserId, createdAt: daysAgo(3),
      },
      {
        title: 'Unauthorized access attempt to admin panel',
        description: 'Brute force attack detected on admin login panel from multiple IPs across 3 different geographic regions. 2,347 failed attempts recorded in 15 minutes.',
        status: 'OPEN', severity: 'CRITICAL', createdById: adminUserId, createdAt: daysAgo(1),
      },
      {
        title: 'Ransomware detected on file server',
        description: 'Ransomware binary detected on shared file server FS-01. Files with .encrypted extension appearing. Isolating server from network immediately.',
        status: 'OPEN', severity: 'CRITICAL', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(0),
      },
      {
        title: 'DDoS attack targeting web application',
        description: 'Application is experiencing a distributed denial of service attack with traffic exceeding 10 Gbps from multiple botnet nodes. Mitigation in progress.',
        status: 'OPEN', severity: 'CRITICAL', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(0),
      },
      {
        title: 'Unauthorized SSH access from external IP',
        description: 'Successful SSH login detected from unrecognized external IP 203.0.113.45 to bastion host. Access was from a privileged service account.',
        status: 'OPEN', severity: 'HIGH', createdById: analystUser.id, assignedTo: adminUserId, createdAt: daysAgo(2),
      },
      {
        title: 'Data exfiltration via DNS tunneling',
        description: 'Unusual DNS query patterns detected suggesting possible DNS tunneling. High volume of TXT record queries to suspicious domains.',
        status: 'OPEN', severity: 'CRITICAL', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(1),
      },
      {
        title: 'Insider threat - unauthorized data access',
        description: 'Employee accessing customer PII records without legitimate business need. HR department notified and investigation opened.',
        status: 'OPEN', severity: 'CRITICAL', createdById: adminUserId, createdAt: daysAgo(1),
      },
      {
        title: 'Zero-day exploit detected on web server',
        description: 'IDS/IPS detected exploitation attempt targeting CVE-2026-01234 on Apache server. No public patch currently available.',
        status: 'OPEN', severity: 'CRITICAL', createdById: analystUser.id, assignedTo: analystUser.id, createdAt: daysAgo(3),
      },
      {
        title: 'Suspicious PowerShell execution on domain controller',
        description: 'PowerShell Empire stager detected executing on DC-01. Process tree analysis shows parent process was spawned from macro-enabled document.',
        status: 'OPEN', severity: 'HIGH', createdById: analystUser.id, assignedTo: adminUserId, createdAt: daysAgo(4),
      },
      {
        title: 'Misconfigured S3 bucket exposes sensitive data',
        description: 'AWS S3 bucket sentinelx-backups was found publicly accessible. 12GB of backup data including customer information was exposed.',
        status: 'OPEN', severity: 'HIGH', createdById: analystUser.id, createdAt: daysAgo(5),
      },
      {
        title: 'Compromised API key detected in public repository',
        description: 'GitHub scan detected a valid API key for production environment committed to public repository. Key has been rotated.',
        status: 'OPEN', severity: 'HIGH', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(2),
      },
      {
        title: 'Weak password detected on privileged account',
        description: 'Password audit revealed domain admin account using a weak password that matches common password lists. Immediate reset required.',
        status: 'OPEN', severity: 'MEDIUM', createdById: analystUser.id, createdAt: daysAgo(6),
      },
      // ── IN_PROGRESS (8) ──
      {
        title: 'Failed login attempts from unknown IP',
        description: 'Multiple failed SSH login attempts detected from IP range 185.220.101.x targeting jumpbox servers. Blocked at firewall level.',
        status: 'IN_PROGRESS', severity: 'HIGH', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(3),
      },
      {
        title: 'Phishing campaign targeting employees',
        description: 'Multiple employees reported suspicious emails impersonating IT department requesting password verification. Campaign appears widespread.',
        status: 'IN_PROGRESS', severity: 'CRITICAL', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(2),
      },
      {
        title: 'DNS configuration anomaly',
        description: 'Unusual DNS resolution patterns suggesting possible DNS tunneling or cache poisoning. Investigative queries in progress.',
        status: 'IN_PROGRESS', severity: 'HIGH', createdById: analystUser.id, assignedTo: adminUserId, createdAt: daysAgo(5),
      },
      {
        title: 'Lateral movement detected on internal network',
        description: 'Alert from EDR solution detected pass-the-hash attack moving from compromised workstation to file server. Containment in progress.',
        status: 'IN_PROGRESS', severity: 'CRITICAL', createdById: analystUser.id, assignedTo: analystUser.id, createdAt: daysAgo(1),
      },
      {
        title: 'Unpatched vulnerability in CMS platform',
        description: 'Internal scan revealed CMS platform running version with known RCE vulnerability (CVE-2026-04567). Patch being tested and rolled out.',
        status: 'IN_PROGRESS', severity: 'HIGH', createdById: adminUserId, createdAt: daysAgo(4),
      },
      {
        title: 'Abnormal network scanning activity',
        description: 'Internal host 192.168.2.45 performing port scans across multiple subnets. Possible reconnaissance activity.',
        status: 'IN_PROGRESS', severity: 'MEDIUM', createdById: analystUser.id, createdAt: daysAgo(3),
      },
      {
        title: 'Suspicious email forwarding rule created',
        description: 'User finance-admin@sentinelx.io had an auto-forwarding rule created forwarding all email to external Gmail address.',
        status: 'IN_PROGRESS', severity: 'MEDIUM', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(2),
      },
      {
        title: 'Container escape attempt on Kubernetes cluster',
        description: 'Falco alert detected suspicious syscall pattern from container in production namespace suggesting container escape attempt.',
        status: 'IN_PROGRESS', severity: 'CRITICAL', createdById: analystUser.id, assignedTo: adminUserId, createdAt: daysAgo(1),
      },
      // ── RESOLVED (12) ──
      {
        title: 'Malware detected on endpoint',
        description: 'Antivirus flagged suspicious executable on workstation WS-045. Trojan identified and quarantined. Full scan completed.',
        status: 'RESOLVED', severity: 'HIGH', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(10),
      },
      {
        title: 'Firewall rule misconfiguration',
        description: 'Incorrect firewall rule allowing inbound traffic on port 1433 from external networks. Rule corrected and traffic verified.',
        status: 'RESOLVED', severity: 'HIGH', createdById: adminUserId, createdAt: daysAgo(12),
      },
      {
        title: 'Cross-site scripting vulnerability on public portal',
        description: 'Stored XSS vulnerability identified in customer support portal contact form. Input sanitization implemented and portal patched.',
        status: 'RESOLVED', severity: 'MEDIUM', createdById: analystUser.id, createdAt: daysAgo(15),
      },
      {
        title: 'Compromised user account secured and password reset',
        description: 'User account marketing@sentinelx.io showed signs of compromise. Account locked, password reset, and MFA enforced.',
        status: 'RESOLVED', severity: 'MEDIUM', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(8),
      },
      {
        title: 'Unauthorized device connected to corporate network',
        description: 'Rogue device with MAC address 00:1A:2B:3C:4D:5E detected on internal Wi-Fi. Device blocked and owner identified.',
        status: 'RESOLVED', severity: 'LOW', createdById: analystUser.id, createdAt: daysAgo(20),
      },
      {
        title: 'Outdated TLS protocol detected on mail server',
        description: 'Mail server still accepting TLS 1.0 connections. TLS 1.0 and 1.1 disabled. Only TLS 1.2 and 1.3 now accepted.',
        status: 'RESOLVED', severity: 'MEDIUM', createdById: adminUserId, createdAt: daysAgo(14),
      },
      {
        title: 'Suspicious cron job on production database server',
        description: 'Unauthorized cron job found on db-01 scheduled to exfiltrate data to external FTP server. Cron job removed and investigation complete.',
        status: 'RESOLVED', severity: 'HIGH', createdById: adminUserId, assignedTo: adminUserId, createdAt: daysAgo(7),
      },
      {
        title: 'Exposed internal documentation on public web server',
        description: 'Internal Confluence backup accidentally placed in web-accessible directory. Backup removed and directory access restricted.',
        status: 'RESOLVED', severity: 'LOW', createdById: analystUser.id, createdAt: daysAgo(18),
      },
      {
        title: 'Memory scraper malware isolated on payment terminal',
        description: 'POS terminal POS-03 infected with memory scraping malware targeting credit card data. Terminal isolated, malware removed, forensic copy taken.',
        status: 'RESOLVED', severity: 'CRITICAL', createdById: adminUserId, assignedTo: analystUser.id, createdAt: daysAgo(6),
      },
      {
        title: 'Ransomware attack on backup server contained',
        description: 'Ransomware attempted to encrypt backup server BS-01. Air-gapped backup policy prevented spread. Server restored from clean backup.',
        status: 'RESOLVED', severity: 'CRITICAL', createdById: adminUserId, assignedTo: adminUserId, createdAt: daysAgo(9),
      },
      {
        title: 'Spear phishing campaign targeting executives',
        description: 'Targeted spear phishing emails sent to C-suite executives containing malicious PDF attachments. Email gateway rules updated.',
        status: 'RESOLVED', severity: 'HIGH', createdById: analystUser.id, assignedTo: analystUser.id, createdAt: daysAgo(11),
      },
      {
        title: 'Social engineering attack on IT help desk',
        description: 'Attacker impersonated VP of Engineering requesting emergency password reset. Help desk procedure updated to require in-person verification.',
        status: 'RESOLVED', severity: 'MEDIUM', createdById: adminUserId, createdAt: daysAgo(16),
      },
      // ── CLOSED (6) ──
      {
        title: 'VPN service outage',
        description: 'VPN gateway experiencing intermittent connectivity issues affecting remote users. Root cause identified as ISP routing issue. Service restored.',
        status: 'CLOSED', severity: 'MEDIUM', createdById: adminUserId, createdAt: daysAgo(25),
      },
      {
        title: 'Legacy user account cleanup completed',
        description: 'Quarterly audit of Active Directory completed. 47 dormant accounts disabled and 12 terminated employee accounts removed.',
        status: 'CLOSED', severity: 'LOW', createdById: analystUser.id, createdAt: daysAgo(28),
      },
      {
        title: 'Internal penetration test findings reviewed',
        description: 'All findings from Q1 internal penetration test reviewed and remediated. Report signed off by CISO.',
        status: 'CLOSED', severity: 'LOW', createdById: adminUserId, createdAt: daysAgo(30),
      },
      {
        title: 'Quarterly security awareness training completed',
        description: 'All employees completed mandatory security awareness training. Phishing simulation click rate reduced to 3.2%.',
        status: 'CLOSED', severity: 'LOW', createdById: analystUser.id, createdAt: daysAgo(27),
      },
      {
        title: 'Annual SOC 2 audit completed',
        description: 'Annual SOC 2 Type II audit completed successfully with zero critical findings. Report available in compliance portal.',
        status: 'CLOSED', severity: 'MEDIUM', createdById: adminUserId, createdAt: daysAgo(22),
      },
      {
        title: 'Third-party vendor risk assessment closed',
        description: 'Risk assessment for cloud infrastructure vendor CloudSync completed. Vendor meets all security requirements.',
        status: 'CLOSED', severity: 'LOW', createdById: analystUser.id, createdAt: daysAgo(29),
      },
    ];

    const createdIncidents: { id: string; title: string }[] = [];
    for (const data of incidentData) {
      const incident = await prisma.incident.create({ data });
      createdIncidents.push(incident);
    }
    console.log(`  - ${createdIncidents.length} incidents created`);

  // ── Assets (25) ──────────────────────────────────────────────────────
    type AssetInput = {
      assetName: string;
      hostname: string;
      ipAddress: string;
      assetType: 'SERVER' | 'WORKSTATION' | 'LAPTOP' | 'FIREWALL' | 'SWITCH' | 'ROUTER' | 'CLOUD_VM' | 'DATABASE' | 'OTHER';
      operatingSystem: string;
      owner: string;
      department: string;
      criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
      location: string;
      description: string;
      createdAt: Date;
    };

    const assetData: AssetInput[] = [
      {
        assetName: 'Primary Web Server', hostname: 'web-01.sentinelx.io', ipAddress: '10.0.1.10',
        assetType: 'SERVER', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'Infra Team', department: 'Engineering',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack A3',
        description: 'Primary web server hosting main application.', createdAt: daysAgo(180),
      },
      {
        assetName: 'Database Server', hostname: 'db-01.sentinelx.io', ipAddress: '10.0.2.10',
        assetType: 'DATABASE', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'DBA Team', department: 'Engineering',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack B1',
        description: 'Primary PostgreSQL database server.', createdAt: daysAgo(180),
      },
      {
        assetName: 'Gateway Firewall', hostname: 'fw-01.sentinelx.io', ipAddress: '10.0.0.1',
        assetType: 'FIREWALL', operatingSystem: 'FortiOS 7.4', owner: 'Security Team', department: 'Security',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack A1',
        description: 'Main network gateway firewall.', createdAt: daysAgo(365),
      },
      {
        assetName: 'Internal Switch', hostname: 'sw-01.sentinelx.io', ipAddress: '10.0.0.2',
        assetType: 'SWITCH', operatingSystem: 'Cisco IOS XE', owner: 'Network Team', department: 'Infrastructure',
        criticality: 'HIGH', status: 'ACTIVE', location: 'DC-1 Rack A2',
        description: 'Core distribution switch.', createdAt: daysAgo(365),
      },
      {
        assetName: 'Dev Laptop - Alice', hostname: 'alice-dev', ipAddress: '192.168.1.50',
        assetType: 'LAPTOP', operatingSystem: 'macOS Sonoma 14.5', owner: 'Alice Johnson', department: 'Engineering',
        criticality: 'MEDIUM', status: 'ACTIVE', location: 'Remote',
        description: 'Developer workstation for Alice Johnson.', createdAt: daysAgo(120),
      },
      {
        assetName: 'Mail Server', hostname: 'mail-01.sentinelx.io', ipAddress: '10.0.3.10',
        assetType: 'SERVER', operatingSystem: 'Debian 12', owner: 'Infra Team', department: 'Engineering',
        criticality: 'HIGH', status: 'MAINTENANCE', location: 'DC-1 Rack A4',
        description: 'Corporate mail server - under maintenance.', createdAt: daysAgo(200),
      },
      {
        assetName: 'Load Balancer', hostname: 'lb-01.sentinelx.io', ipAddress: '10.0.1.1',
        assetType: 'ROUTER', operatingSystem: 'HAProxy 2.8', owner: 'Network Team', department: 'Infrastructure',
        criticality: 'HIGH', status: 'ACTIVE', location: 'DC-1 Rack A2',
        description: 'Application load balancer for web tier.', createdAt: daysAgo(180),
      },
      {
        assetName: 'Cloud VM - Staging', hostname: 'staging-vm-01', ipAddress: '10.0.10.10',
        assetType: 'CLOUD_VM', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'DevOps Team', department: 'Engineering',
        criticality: 'LOW', status: 'ACTIVE', location: 'AWS us-east-1',
        description: 'Staging environment VM for pre-production testing.', createdAt: daysAgo(90),
      },
      {
        assetName: 'Retired NAS', hostname: 'nas-old', ipAddress: '10.0.5.10',
        assetType: 'SERVER', operatingSystem: 'FreeNAS 11', owner: 'Infra Team', department: 'Engineering',
        criticality: 'LOW', status: 'RETIRED', location: 'DC-1 Rack C5',
        description: 'Decommissioned network storage awaiting secure wipe.', createdAt: daysAgo(500),
      },
      {
        assetName: 'Workstation - Ops Center', hostname: 'ops-ws-01', ipAddress: '192.168.1.10',
        assetType: 'WORKSTATION', operatingSystem: 'Windows 11 Pro', owner: 'SOC Team', department: 'Security',
        criticality: 'MEDIUM', status: 'ACTIVE', location: 'SOC Floor',
        description: 'Primary SOC monitoring workstation.', createdAt: daysAgo(150),
      },
      {
        assetName: 'Backup Server', hostname: 'bs-01.sentinelx.io', ipAddress: '10.0.4.10',
        assetType: 'SERVER', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'DBA Team', department: 'Engineering',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack B3',
        description: 'Air-gapped backup server with nightly backup schedule.', createdAt: daysAgo(160),
      },
      {
        assetName: 'Gateway API Server', hostname: 'api-01.sentinelx.io', ipAddress: '10.0.1.20',
        assetType: 'SERVER', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'Platform Team', department: 'Engineering',
        criticality: 'HIGH', status: 'ACTIVE', location: 'DC-1 Rack A5',
        description: 'API gateway for microservices architecture.', createdAt: daysAgo(140),
      },
      {
        assetName: 'Monitoring Server', hostname: 'mon-01.sentinelx.io', ipAddress: '10.0.6.10',
        assetType: 'SERVER', operatingSystem: 'Debian 12', owner: 'DevOps Team', department: 'Engineering',
        criticality: 'HIGH', status: 'ACTIVE', location: 'DC-1 Rack A6',
        description: 'Central monitoring and alerting server running Prometheus and Grafana.', createdAt: daysAgo(130),
      },
      {
        assetName: 'Finance Workstation', hostname: 'fin-ws-01', ipAddress: '192.168.2.10',
        assetType: 'WORKSTATION', operatingSystem: 'Windows 11 Pro', owner: 'Finance Team', department: 'Finance',
        criticality: 'HIGH', status: 'ACTIVE', location: 'Floor 3 - Finance',
        description: 'Finance department workstation with ERP access.', createdAt: daysAgo(200),
      },
      {
        assetName: 'HR Workstation', hostname: 'hr-ws-01', ipAddress: '192.168.2.20',
        assetType: 'WORKSTATION', operatingSystem: 'Windows 11 Pro', owner: 'HR Team', department: 'HR',
        criticality: 'MEDIUM', status: 'ACTIVE', location: 'Floor 2 - HR',
        description: 'HR department workstation with employee records access.', createdAt: daysAgo(190),
      },
      {
        assetName: 'Executive Laptop - CEO', hostname: 'ceo-laptop', ipAddress: '192.168.1.100',
        assetType: 'LAPTOP', operatingSystem: 'macOS Sonoma 14.5', owner: 'Sarah Chen', department: 'Executive',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'Remote',
        description: 'CEO laptop with highest security policies applied.', createdAt: daysAgo(100),
      },
      {
        assetName: 'Dev Laptop - Bob', hostname: 'bob-dev', ipAddress: '192.168.1.51',
        assetType: 'LAPTOP', operatingSystem: 'macOS Sonoma 14.5', owner: 'Bob Martinez', department: 'Engineering',
        criticality: 'MEDIUM', status: 'ACTIVE', location: 'Remote',
        description: 'Developer workstation for Bob Martinez.', createdAt: daysAgo(110),
      },
      {
        assetName: 'Dev Laptop - Carol', hostname: 'carol-dev', ipAddress: '192.168.1.52',
        assetType: 'LAPTOP', operatingSystem: 'Ubuntu 24.04 LTS', owner: 'Carol Nguyen', department: 'Engineering',
        criticality: 'MEDIUM', status: 'ACTIVE', location: 'Remote',
        description: 'Developer workstation for Carol Nguyen.', createdAt: daysAgo(90),
      },
      {
        assetName: 'Internal Firewall', hostname: 'fw-02.sentinelx.io', ipAddress: '10.0.0.5',
        assetType: 'FIREWALL', operatingSystem: 'FortiOS 7.4', owner: 'Security Team', department: 'Security',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack A1',
        description: 'Internal segmentation firewall for data center.', createdAt: daysAgo(365),
      },
      {
        assetName: 'Distribution Switch', hostname: 'sw-02.sentinelx.io', ipAddress: '10.0.0.3',
        assetType: 'SWITCH', operatingSystem: 'Cisco IOS XE', owner: 'Network Team', department: 'Infrastructure',
        criticality: 'HIGH', status: 'ACTIVE', location: 'DC-1 Rack B2',
        description: 'Distribution layer switch for server farm.', createdAt: daysAgo(365),
      },
      {
        assetName: 'Edge Router', hostname: 'router-01.sentinelx.io', ipAddress: '203.0.113.1',
        assetType: 'ROUTER', operatingSystem: 'Cisco IOS XR', owner: 'Network Team', department: 'Infrastructure',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack A1',
        description: 'Edge router connecting to upstream ISP.', createdAt: daysAgo(365),
      },
      {
        assetName: 'Production Database', hostname: 'db-02.sentinelx.io', ipAddress: '10.0.2.20',
        assetType: 'DATABASE', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'DBA Team', department: 'Engineering',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'DC-1 Rack B2',
        description: 'Secondary production PostgreSQL database for analytics.', createdAt: daysAgo(170),
      },
      {
        assetName: 'Cloud VM - Production', hostname: 'prod-vm-01', ipAddress: '10.0.20.10',
        assetType: 'CLOUD_VM', operatingSystem: 'Ubuntu 24.04 LTS', owner: 'DevOps Team', department: 'Engineering',
        criticality: 'CRITICAL', status: 'ACTIVE', location: 'AWS us-east-1',
        description: 'Production environment VM for worker services.', createdAt: daysAgo(80),
      },
      {
        assetName: 'Cloud Server - Analytics', hostname: 'analytics-vm-01', ipAddress: '10.0.20.20',
        assetType: 'CLOUD_VM', operatingSystem: 'Ubuntu 22.04 LTS', owner: 'Data Team', department: 'Engineering',
        criticality: 'MEDIUM', status: 'MAINTENANCE', location: 'AWS us-west-2',
        description: 'Analytics VM under maintenance for hardware upgrade.', createdAt: daysAgo(60),
      },
      {
        assetName: 'Legacy Application Server', hostname: 'legacy-app-01', ipAddress: '10.0.8.10',
        assetType: 'SERVER', operatingSystem: 'CentOS 7', owner: 'Infra Team', department: 'Engineering',
        criticality: 'LOW', status: 'RETIRED', location: 'DC-1 Rack C1',
        description: 'Decommissioned legacy application server awaiting migration sign-off.', createdAt: daysAgo(600),
      },
    ];

    const createdAssets: { id: string; assetName: string }[] = [];
    for (const data of assetData) {
      const asset = await prisma.asset.create({ data });
      createdAssets.push(asset);
    }
    console.log(`  - ${createdAssets.length} assets created`);

  // ── Incident-Asset Links ──────────────────────────────────────────────
    const allIncidents = await prisma.incident.findMany();
    const allAssets = await prisma.asset.findMany();

    const incidentMap = new Map(allIncidents.map((i) => [i.title, i.id]));
    const assetMap = new Map(allAssets.map((a) => [a.assetName, a.id]));

    type LinkDef = { incidentTitle: string; assetNames: string[] };
    const links: LinkDef[] = [
      { incidentTitle: 'Suspicious outbound traffic detected', assetNames: ['Primary Web Server', 'Gateway Firewall'] },
      { incidentTitle: 'Unusual database query pattern', assetNames: ['Database Server', 'Production Database'] },
      { incidentTitle: 'SSL certificate expiring in 7 days', assetNames: ['Primary Web Server', 'Load Balancer'] },
      { incidentTitle: 'Unauthorized access attempt to admin panel', assetNames: ['Primary Web Server', 'Gateway Firewall', 'Edge Router'] },
      { incidentTitle: 'Ransomware detected on file server', assetNames: ['Backup Server', 'Legacy Application Server'] },
      { incidentTitle: 'DDoS attack targeting web application', assetNames: ['Primary Web Server', 'Load Balancer', 'Gateway Firewall'] },
      { incidentTitle: 'Unauthorized SSH access from external IP', assetNames: ['Cloud VM - Staging', 'Gateway Firewall'] },
      { incidentTitle: 'Data exfiltration via DNS tunneling', assetNames: ['Gateway Firewall', 'Edge Router', 'Primary Web Server'] },
      { incidentTitle: 'Insider threat - unauthorized data access', assetNames: ['Database Server', 'Production Database', 'Finance Workstation'] },
      { incidentTitle: 'Zero-day exploit detected on web server', assetNames: ['Primary Web Server', 'Gateway API Server'] },
      { incidentTitle: 'Suspicious PowerShell execution on domain controller', assetNames: ['Workstation - Ops Center'] },
      { incidentTitle: 'Misconfigured S3 bucket exposes sensitive data', assetNames: ['Cloud VM - Production', 'Cloud Server - Analytics'] },
      { incidentTitle: 'Compromised API key detected in public repository', assetNames: ['Gateway API Server', 'Cloud VM - Production'] },
      { incidentTitle: 'Weak password detected on privileged account', assetNames: ['Database Server', 'Primary Web Server', 'Mail Server'] },
      { incidentTitle: 'Failed login attempts from unknown IP', assetNames: ['Gateway Firewall', 'Edge Router'] },
      { incidentTitle: 'Phishing campaign targeting employees', assetNames: ['Mail Server', 'Workstation - Ops Center'] },
      { incidentTitle: 'DNS configuration anomaly', assetNames: ['Edge Router', 'Internal Switch'] },
      { incidentTitle: 'Lateral movement detected on internal network', assetNames: ['Finance Workstation', 'Workstation - Ops Center', 'Internal Firewall'] },
      { incidentTitle: 'Unpatched vulnerability in CMS platform', assetNames: ['Primary Web Server', 'Gateway API Server'] },
      { incidentTitle: 'Abnormal network scanning activity', assetNames: ['Internal Switch', 'Distribution Switch'] },
      { incidentTitle: 'Suspicious email forwarding rule created', assetNames: ['Mail Server', 'Workstation - Ops Center'] },
      { incidentTitle: 'Container escape attempt on Kubernetes cluster', assetNames: ['Cloud VM - Production', 'Cloud VM - Staging'] },
      { incidentTitle: 'Malware detected on endpoint', assetNames: ['Workstation - Ops Center', 'Dev Laptop - Alice'] },
      { incidentTitle: 'Firewall rule misconfiguration', assetNames: ['Gateway Firewall', 'Internal Firewall'] },
      { incidentTitle: 'Cross-site scripting vulnerability on public portal', assetNames: ['Primary Web Server'] },
      { incidentTitle: 'Compromised user account secured and password reset', assetNames: ['Mail Server', 'Workstation - Ops Center'] },
      { incidentTitle: 'Unauthorized device connected to corporate network', assetNames: ['Internal Switch', 'Distribution Switch'] },
      { incidentTitle: 'Outdated TLS protocol detected on mail server', assetNames: ['Mail Server', 'Load Balancer'] },
      { incidentTitle: 'Suspicious cron job on production database server', assetNames: ['Database Server', 'Production Database'] },
      { incidentTitle: 'Exposed internal documentation on public web server', assetNames: ['Primary Web Server'] },
      { incidentTitle: 'Memory scraper malware isolated on payment terminal', assetNames: ['Workstation - Ops Center', 'Internal Firewall'] },
      { incidentTitle: 'Ransomware attack on backup server contained', assetNames: ['Backup Server', 'Database Server'] },
      { incidentTitle: 'Spear phishing campaign targeting executives', assetNames: ['Mail Server', 'Executive Laptop - CEO'] },
      { incidentTitle: 'Social engineering attack on IT help desk', assetNames: ['Workstation - Ops Center'] },
      { incidentTitle: 'VPN service outage', assetNames: ['Gateway Firewall', 'Edge Router', 'Load Balancer'] },
      { incidentTitle: 'Legacy user account cleanup completed', assetNames: ['Legacy Application Server'] },
      { incidentTitle: 'Internal penetration test findings reviewed', assetNames: ['Primary Web Server', 'Database Server', 'Gateway API Server'] },
      { incidentTitle: 'Quarterly security awareness training completed', assetNames: [] },
      { incidentTitle: 'Annual SOC 2 audit completed', assetNames: ['Gateway Firewall', 'Database Server', 'Primary Web Server', 'Internal Firewall'] },
      { incidentTitle: 'Third-party vendor risk assessment closed', assetNames: ['Cloud Server - Analytics', 'Cloud VM - Production'] },
    ];

    let linkCount = 0;
    for (const link of links) {
      const incidentId = incidentMap.get(link.incidentTitle);
      if (!incidentId) continue;
      for (const assetName of link.assetNames) {
        const assetId = assetMap.get(assetName);
        if (!assetId) continue;
        await prisma.incidentAsset.create({
          data: { incidentId, assetId },
        });
        linkCount++;
      }
    }
    console.log(`  - ${linkCount} incident-asset links created`);

  // ── Notifications ────────────────────────────────────────────────────
    const recentIncidents = await prisma.incident.findMany({ orderBy: { createdAt: 'desc' }, take: 15 });

    const notificationData: { title: string; message: string; type: string; severity: string; userId: string; link: string; createdAt: Date }[] = [];

    for (const user of users) {
      for (const inc of recentIncidents) {
        const severity = inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? inc.severity : 'INFO';
        notificationData.push({
          title: `Incident ${inc.severity === 'CRITICAL' ? 'Alert' : 'Update'}`,
          message: `${inc.title} - ${inc.description.slice(0, 100)}`,
          type: 'INCIDENT',
          severity,
          userId: user.id,
          link: `/incidents/${inc.id}`,
          createdAt: daysAgo(Math.floor(Math.random() * 5)),
        });
      }
    }

    notificationData.push({
      title: 'Welcome to SentinelX',
      message: 'Your account has been created. Complete your profile to get started.',
      type: 'SYSTEM', severity: 'INFO',
      userId: users[1].id,
      link: '/settings',
      createdAt: daysAgo(7),
    });
    notificationData.push({
      title: 'Welcome to SentinelX',
      message: 'Your account has been created. Complete your profile to get started.',
      type: 'SYSTEM', severity: 'INFO',
      userId: users[2].id,
      link: '/settings',
      createdAt: daysAgo(7),
    });
    notificationData.push({
      title: 'Weekly Report Ready',
      message: 'Your weekly security summary report is now available.',
      type: 'REPORT', severity: 'INFO',
      userId: users[0].id,
      link: '/reports',
      createdAt: daysAgo(2),
    });
    notificationData.push({
      title: 'Asset Added',
      message: 'New asset "Cloud VM - Production" has been added to inventory.',
      type: 'ASSET', severity: 'INFO',
      userId: users[0].id,
      link: '/assets',
      createdAt: daysAgo(80),
    });

    for (const notif of notificationData) {
      await prisma.notification.create({ data: notif });
    }
    console.log(`  - ${notificationData.length} notifications created`);

  // ── Audit Logs ───────────────────────────────────────────────────────
    type AuditInput = {
      userId: string;
      userName: string;
      action: string;
      resource: string;
      resourceId?: string;
      description: string;
      ipAddress: string;
      userAgent: string;
      severity: string;
      createdAt: Date;
    };

    const auditData: AuditInput[] = [
      // Admin actions
      { userId: users[0].id, userName: 'System Admin', action: 'LOGIN', resource: 'Auth', description: 'User logged in successfully', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(1) },
      { userId: users[0].id, userName: 'System Admin', action: 'CREATE_INCIDENT', resource: 'Incident', description: 'Created incident: Suspicious outbound traffic detected', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(1) },
      { userId: users[0].id, userName: 'System Admin', action: 'UPDATE_INCIDENT', resource: 'Incident', description: 'Updated incident severity to CRITICAL', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Warning', createdAt: daysAgo(1) },
      { userId: users[0].id, userName: 'System Admin', action: 'CREATE_ASSET', resource: 'Asset', description: 'Created asset: Primary Web Server', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 Windows NT 10.0; Win64; x64 Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(180) },
      { userId: users[0].id, userName: 'System Admin', action: 'CREATE_ASSET', resource: 'Asset', description: 'Created asset: Database Server', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 Windows NT 10.0; Win64; x64 Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(180) },
      { userId: users[0].id, userName: 'System Admin', action: 'LOGIN', resource: 'Auth', description: 'User logged in successfully from new device', ipAddress: '203.0.113.45', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', severity: 'Info', createdAt: daysAgo(2) },
      { userId: users[0].id, userName: 'System Admin', action: 'UPDATE_SETTINGS', resource: 'Settings', description: 'Updated MFA settings for organization', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(3) },
      { userId: users[0].id, userName: 'System Admin', action: 'GENERATE_REPORT', resource: 'Reports', description: 'Generated monthly security report', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(5) },
      { userId: users[0].id, userName: 'System Admin', action: 'UPDATE_INCIDENT', resource: 'Incident', description: 'Resolved incident: Malware detected on endpoint', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(10) },
      { userId: users[0].id, userName: 'System Admin', action: 'DELETE_USER', resource: 'User', description: 'Disabled inactive user account: john.doe@sentinelx.io', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Warning', createdAt: daysAgo(7) },
      { userId: users[0].id, userName: 'System Admin', action: 'ASSIGN_INCIDENT', resource: 'Incident', description: 'Assigned incident to Jane Analyst', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(0) },
      { userId: users[0].id, userName: 'System Admin', action: 'CREATE_USER', resource: 'User', description: 'Created new user: Jane Analyst', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(30) },
      { userId: users[0].id, userName: 'System Admin', action: 'CREATE_USER', resource: 'User', description: 'Created new user: Victor Viewer', ipAddress: '10.0.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(30) },
      // Analyst actions
      { userId: users[1].id, userName: 'Jane Analyst', action: 'LOGIN', resource: 'Auth', description: 'User logged in successfully', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(0) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'CREATE_INCIDENT', resource: 'Incident', description: 'Created incident: Unauthorized SSH access from external IP', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(2) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'UPDATE_INCIDENT', resource: 'Incident', description: 'Updated incident status to IN_PROGRESS', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(1) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'CREATE_ASSET', resource: 'Asset', description: 'Created asset: Monitoring Server', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(130) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'UPDATE_ASSET', resource: 'Asset', description: 'Updated asset criticality to CRITICAL', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(50) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'GENERATE_REPORT', resource: 'Reports', description: 'Generated incident response report for Q1', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(8) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'LOGIN', resource: 'Auth', description: 'User logged in from remote location', ipAddress: '73.162.89.12', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', severity: 'Info', createdAt: daysAgo(1) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'ADD_COMMENT', resource: 'Incident', description: 'Added investigation notes to incident: Ransomware detected on file server', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(0) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'EXPORT_DATA', resource: 'Analytics', description: 'Exported dashboard data as CSV', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(4) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'RUN_SCAN', resource: 'Scanner', description: 'Initiated vulnerability scan on subnet 10.0.1.0/24', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Info', createdAt: daysAgo(6) },
      { userId: users[1].id, userName: 'Jane Analyst', action: 'LOGIN_FAILED', resource: 'Auth', description: 'Failed login attempt with incorrect password', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0', severity: 'Warning', createdAt: daysAgo(3) },
      // Viewer actions
      { userId: users[2].id, userName: 'Victor Viewer', action: 'LOGIN', resource: 'Auth', description: 'User logged in successfully', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', severity: 'Info', createdAt: daysAgo(0) },
      { userId: users[2].id, userName: 'Victor Viewer', action: 'VIEW_INCIDENT', resource: 'Incident', description: 'Viewed incident details: Phishing campaign targeting employees', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', severity: 'Info', createdAt: daysAgo(1) },
      { userId: users[2].id, userName: 'Victor Viewer', action: 'VIEW_DASHBOARD', resource: 'Dashboard', description: 'Viewed security dashboard overview', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', severity: 'Info', createdAt: daysAgo(1) },
      { userId: users[2].id, userName: 'Victor Viewer', action: 'GENERATE_REPORT', resource: 'Reports', description: 'Viewed incident summary report', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', severity: 'Info', createdAt: daysAgo(2) },
      { userId: users[2].id, userName: 'Victor Viewer', action: 'LOGIN', resource: 'Auth', description: 'User logged in successfully', ipAddress: '10.0.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', severity: 'Info', createdAt: daysAgo(2) },
      { userId: users[2].id, userName: 'Victor Viewer', action: 'VIEW_ASSET', resource: 'Asset', description: 'Viewed asset details: Cloud VM - Production', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0', severity: 'Info', createdAt: daysAgo(3) },
      // System actions
      { userId: users[0].id, userName: 'System', action: 'SYSTEM_BACKUP', resource: 'System', description: 'Automated daily backup completed successfully', ipAddress: '127.0.0.1', userAgent: 'System', severity: 'Info', createdAt: daysAgo(0) },
      { userId: users[0].id, userName: 'System', action: 'SYSTEM_UPDATE', resource: 'System', description: 'Security patches applied to 15 servers', ipAddress: '127.0.0.1', userAgent: 'System', severity: 'Info', createdAt: daysAgo(5) },
      { userId: users[0].id, userName: 'System', action: 'SYSTEM_SCAN', resource: 'System', description: 'Automated vulnerability scan completed - 3 new findings', ipAddress: '127.0.0.1', userAgent: 'System', severity: 'Warning', createdAt: daysAgo(1) },
    ];

    for (const log of auditData) {
      await prisma.auditLog.create({ data: log });
    }
    console.log(`  - ${auditData.length} audit logs created`);

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
