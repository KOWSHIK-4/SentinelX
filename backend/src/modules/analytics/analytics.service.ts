import { prisma } from '../../config/database';

export class AnalyticsService {
  async getOverview() {
    const [
      totalIncidents,
      openIncidents,
      inProgressIncidents,
      resolvedIncidents,
      closedIncidents,
      criticalIncidents,
      highIncidents,
      mediumIncidents,
      lowIncidents,
      totalAssets,
      activeAssets,
      maintenanceAssets,
      retiredAssets,
      criticalAssets,
      totalUsers,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: 'OPEN' } }),
      prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.incident.count({ where: { status: 'RESOLVED' } }),
      prisma.incident.count({ where: { status: 'CLOSED' } }),
      prisma.incident.count({ where: { severity: 'CRITICAL' } }),
      prisma.incident.count({ where: { severity: 'HIGH' } }),
      prisma.incident.count({ where: { severity: 'MEDIUM' } }),
      prisma.incident.count({ where: { severity: 'LOW' } }),
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'ACTIVE' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.asset.count({ where: { status: 'RETIRED' } }),
      prisma.asset.count({ where: { criticality: 'CRITICAL' } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      totalIncidents,
      openIncidents,
      inProgressIncidents,
      resolvedIncidents,
      closedIncidents,
      criticalIncidents,
      highIncidents,
      mediumIncidents,
      lowIncidents,
      totalAssets,
      activeAssets,
      maintenanceAssets,
      retiredAssets,
      criticalAssets,
      totalUsers,
    };
  }

  async getIncidents() {
    const severityDist = await prisma.incident.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    const statusDist = await prisma.incident.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const severityMap = severityDist.reduce(
      (acc, s) => {
        acc[s.severity.toLowerCase()] = s._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusMap = statusDist.reduce(
      (acc, s) => {
        acc[s.status.toLowerCase()] = s._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      severityDistribution: {
        critical: severityMap.critical || 0,
        high: severityMap.high || 0,
        medium: severityMap.medium || 0,
        low: severityMap.low || 0,
      },
      statusDistribution: {
        open: statusMap.open || 0,
        inProgress: statusMap.in_progress || 0,
        resolved: statusMap.resolved || 0,
        closed: statusMap.closed || 0,
      },
    };
  }

  async getAssets() {
    const assetsByType = await prisma.asset.groupBy({
      by: ['assetType'],
      _count: { id: true },
    });

    const topAffected = await prisma.incidentAsset.groupBy({
      by: ['assetId'],
      _count: { incidentId: true },
      orderBy: { _count: { incidentId: 'desc' } },
      take: 10,
    });

    const assetIds = topAffected.map((a) => a.assetId);
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        assetName: true,
        assetType: true,
        ipAddress: true,
        criticality: true,
        status: true,
        location: true,
      },
    });

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    const topAffectedAssets = topAffected
      .map((a) => {
        const asset = assetMap.get(a.assetId);
        if (!asset) return null;
        return {
          id: asset.id,
          assetName: asset.assetName,
          assetType: asset.assetType,
          ipAddress: asset.ipAddress,
          criticality: asset.criticality,
          status: asset.status,
          location: asset.location,
          incidentCount: a._count.incidentId,
        };
      })
      .filter(Boolean);

    const typeMap = assetsByType.reduce(
      (acc, a) => {
        acc[a.assetType.toLowerCase()] = a._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      assetsByType: typeMap,
      topAffectedAssets,
    };
  }

  async getTrends() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const incidents = await prisma.incident.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, severity: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyMap = new Map<string, { total: number; critical: number; high: number; medium: number; low: number }>();

    for (const inc of incidents) {
      const key = inc.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(key) || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      entry.total++;
      if (inc.severity === 'CRITICAL') entry.critical++;
      else if (inc.severity === 'HIGH') entry.high++;
      else if (inc.severity === 'MEDIUM') entry.medium++;
      else if (inc.severity === 'LOW') entry.low++;
      monthlyMap.set(key, entry);
    }

    const trend = Array.from(monthlyMap.entries())
      .map(([month, counts]) => ({ month, ...counts }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const recentActivity = await prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        severity: true,
        createdAt: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return { trend, recentActivity };
  }
}
