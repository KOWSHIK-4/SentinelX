import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { generateIncidentPDF, generateAssetPDF, generateExecutiveSummaryPDF } from '../../utils/pdf';
import { withCache, cacheKey } from '../../utils/cache';

import type { $Enums } from '@prisma/client';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  severity?: string;
  status?: string;
  assetType?: string;
}

function buildDateFilter(startDate?: string, endDate?: string): { gte?: Date; lte?: Date } | undefined {
  if (!startDate && !endDate) return undefined;
  const filter: { gte?: Date; lte?: Date } = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) filter.lte = new Date(endDate);
  return filter;
}

export class ReportsService {
  async getIncidentsReport(filters: ReportFilters) {
    const where: Prisma.IncidentWhereInput = {};

    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
    if (dateFilter) where.createdAt = dateFilter;
    if (filters.severity) where.severity = filters.severity as $Enums.IncidentSeverity;
    if (filters.status) where.status = filters.status as $Enums.IncidentStatus;
    if (filters.assetType) {
      where.assets = {
        some: {
          asset: { assetType: filters.assetType as $Enums.AssetType },
        },
      };
    }

    const filterKey = JSON.stringify(filters);
    const cache = withCache(cacheKey('reports', 'incidents', filterKey), 120);

    return cache.get(async () => {
      const [incidents, total, severityBreakdown, statusBreakdown] = await Promise.all([
        prisma.incident.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            assignedUser: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            assets: {
              include: {
                asset: {
                  select: { id: true, assetName: true, assetType: true, ipAddress: true, status: true, criticality: true },
                },
              },
            },
          },
        }),
        prisma.incident.count({ where }),
        Promise.all([
          prisma.incident.count({ where: { ...where, severity: 'CRITICAL' } }),
          prisma.incident.count({ where: { ...where, severity: 'HIGH' } }),
          prisma.incident.count({ where: { ...where, severity: 'MEDIUM' } }),
          prisma.incident.count({ where: { ...where, severity: 'LOW' } }),
        ]),
        Promise.all([
          prisma.incident.count({ where: { ...where, status: 'OPEN' } }),
          prisma.incident.count({ where: { ...where, status: 'IN_PROGRESS' } }),
          prisma.incident.count({ where: { ...where, status: 'RESOLVED' } }),
          prisma.incident.count({ where: { ...where, status: 'CLOSED' } }),
        ]),
      ]);

      return {
        data: incidents,
        total,
        severityBreakdown: {
          critical: severityBreakdown[0],
          high: severityBreakdown[1],
          medium: severityBreakdown[2],
          low: severityBreakdown[3],
        },
        statusBreakdown: {
          open: statusBreakdown[0],
          inProgress: statusBreakdown[1],
          resolved: statusBreakdown[2],
          closed: statusBreakdown[3],
        },
      };
    });
  }

  async getAssetsReport(filters: ReportFilters) {
    const where: Prisma.AssetWhereInput = {};

    if (filters.assetType) where.assetType = filters.assetType as $Enums.AssetType;
    if (filters.status) where.status = filters.status as $Enums.AssetStatus;

    const dateFilter = buildDateFilter(filters.startDate, filters.endDate);
    if (dateFilter) where.createdAt = dateFilter;

    const filterKey = JSON.stringify(filters);
    const cache = withCache(cacheKey('reports', 'assets', filterKey), 120);

    return cache.get(async () => {
      const [assets, total, typeBreakdown, criticalityBreakdown] = await Promise.all([
        prisma.asset.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { incidents: true } },
          },
        }),
        prisma.asset.count({ where }),
        Promise.all([
          prisma.asset.count({ where: { ...where, assetType: 'SERVER' } }),
          prisma.asset.count({ where: { ...where, assetType: 'WORKSTATION' } }),
          prisma.asset.count({ where: { ...where, assetType: 'LAPTOP' } }),
          prisma.asset.count({ where: { ...where, assetType: 'FIREWALL' } }),
          prisma.asset.count({ where: { ...where, assetType: 'SWITCH' } }),
          prisma.asset.count({ where: { ...where, assetType: 'ROUTER' } }),
          prisma.asset.count({ where: { ...where, assetType: 'CLOUD_VM' } }),
          prisma.asset.count({ where: { ...where, assetType: 'DATABASE' } }),
          prisma.asset.count({ where: { ...where, assetType: 'OTHER' } }),
        ]),
        Promise.all([
          prisma.asset.count({ where: { ...where, criticality: 'CRITICAL' } }),
          prisma.asset.count({ where: { ...where, criticality: 'HIGH' } }),
          prisma.asset.count({ where: { ...where, criticality: 'MEDIUM' } }),
          prisma.asset.count({ where: { ...where, criticality: 'LOW' } }),
        ]),
      ]);

      return {
        data: assets,
        total,
        typeBreakdown: {
          server: typeBreakdown[0],
          workstation: typeBreakdown[1],
          laptop: typeBreakdown[2],
          firewall: typeBreakdown[3],
          switch: typeBreakdown[4],
          router: typeBreakdown[5],
          cloudVm: typeBreakdown[6],
          database: typeBreakdown[7],
          other: typeBreakdown[8],
        },
        criticalityBreakdown: {
          critical: criticalityBreakdown[0],
          high: criticalityBreakdown[1],
          medium: criticalityBreakdown[2],
          low: criticalityBreakdown[3],
        },
      };
    });
  }

  async getSummaryReport(filters: ReportFilters) {
    const incidentDateFilter = buildDateFilter(filters.startDate, filters.endDate);
    const assetDateFilter = buildDateFilter(filters.startDate, filters.endDate);

    const incidentWhere: Prisma.IncidentWhereInput = {};
    const assetWhere: Prisma.AssetWhereInput = {};

    if (incidentDateFilter) incidentWhere.createdAt = incidentDateFilter;
    if (filters.severity) incidentWhere.severity = filters.severity as $Enums.IncidentSeverity;
    if (filters.status) incidentWhere.status = filters.status as $Enums.IncidentStatus;
    if (filters.assetType) {
      incidentWhere.assets = {
        some: {
          asset: { assetType: filters.assetType as $Enums.AssetType },
        },
      };
      assetWhere.assetType = filters.assetType as $Enums.AssetType;
    }

    if (assetDateFilter) assetWhere.createdAt = assetDateFilter;

    const filterKey = JSON.stringify(filters);
    const cache = withCache(cacheKey('reports', 'summary', filterKey), 120);

    return cache.get(async () => {
      const [totalIncidents, openIncidents, criticalIncidents, totalAssets, activeAssets, criticalAssets, recentIncidents] = await Promise.all([
        prisma.incident.count({ where: incidentWhere }),
        prisma.incident.count({ where: { ...incidentWhere, status: 'OPEN' } }),
        prisma.incident.count({ where: { ...incidentWhere, severity: 'CRITICAL' } }),
        prisma.asset.count({ where: assetWhere }),
        prisma.asset.count({ where: { ...assetWhere, status: 'ACTIVE' } }),
        prisma.asset.count({ where: { ...assetWhere, criticality: 'CRITICAL' } }),
        prisma.incident.findMany({
          where: incidentWhere,
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        }),
      ]);

      return {
        totalIncidents,
        openIncidents,
        criticalIncidents,
        totalAssets,
        activeAssets,
        criticalAssets,
        recentIncidents,
        reportGeneratedAt: new Date().toISOString(),
      };
    });
  }

  async exportReport(type: string, format: string, filters: ReportFilters = {}) {
    const settings = await prisma.settings.findFirst();
    const orgName = settings?.organizationName || 'SentinelX';
    const meta = {
      title: '',
      organizationName: orgName,
      generatedAt: new Date().toISOString(),
      filters: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')) as Record<string, string>,
    };

    switch (type) {
      case 'incidents': {
        const report = await this.getIncidentsReport(filters);
        if (format === 'pdf') {
          meta.title = 'Incident Report';
          const pdfData = {
            data: report.data.map((inc) => ({
              title: inc.title,
              severity: inc.severity,
              status: inc.status,
              createdAt: inc.createdAt instanceof Date ? inc.createdAt.toISOString() : String(inc.createdAt),
              assignedUser: inc.assignedUser ? { firstName: inc.assignedUser.firstName, lastName: inc.assignedUser.lastName } : null,
            })),
            total: report.total,
            severityBreakdown: report.severityBreakdown,
            statusBreakdown: report.statusBreakdown,
          };
          return generateIncidentPDF(pdfData, meta);
        }
        return { type, format, data: report, exportedAt: new Date().toISOString() };
      }
      case 'assets': {
        const report = await this.getAssetsReport(filters);
        if (format === 'pdf') {
          meta.title = 'Asset Report';
          const pdfData = {
            data: report.data.map((a) => ({
              assetName: a.assetName,
              assetType: a.assetType,
              criticality: a.criticality,
              status: a.status,
              ipAddress: a.ipAddress,
            })),
            total: report.total,
            typeBreakdown: report.typeBreakdown,
            criticalityBreakdown: report.criticalityBreakdown,
          };
          return generateAssetPDF(pdfData, meta);
        }
        return { type, format, data: report, exportedAt: new Date().toISOString() };
      }
      case 'critical-incidents': {
        const report = await this.getIncidentsReport({ ...filters, severity: 'CRITICAL' });
        if (format === 'pdf') {
          meta.title = 'Critical Incident Report';
          const pdfData = {
            data: report.data.map((inc) => ({
              title: inc.title,
              severity: inc.severity,
              status: inc.status,
              createdAt: inc.createdAt instanceof Date ? inc.createdAt.toISOString() : String(inc.createdAt),
              assignedUser: inc.assignedUser ? { firstName: inc.assignedUser.firstName, lastName: inc.assignedUser.lastName } : null,
            })),
            total: report.total,
            severityBreakdown: report.severityBreakdown,
            statusBreakdown: report.statusBreakdown,
          };
          return generateIncidentPDF(pdfData, meta);
        }
        return { type, format, data: report, exportedAt: new Date().toISOString() };
      }
      case 'executive-summary': {
        const report = await this.getSummaryReport(filters);
        if (format === 'pdf') {
          meta.title = 'Executive Summary';
          const pdfData = {
            totalIncidents: report.totalIncidents,
            openIncidents: report.openIncidents,
            criticalIncidents: report.criticalIncidents,
            totalAssets: report.totalAssets,
            activeAssets: report.activeAssets,
            criticalAssets: report.criticalAssets,
            recentIncidents: report.recentIncidents.map((inc) => ({
              title: inc.title,
              severity: inc.severity,
              status: inc.status,
              createdAt: inc.createdAt instanceof Date ? inc.createdAt.toISOString() : String(inc.createdAt),
              createdBy: { firstName: inc.createdBy.firstName, lastName: inc.createdBy.lastName },
            })),
          };
          return generateExecutiveSummaryPDF(pdfData, meta);
        }
        return { type, format, data: report, exportedAt: new Date().toISOString() };
      }
      default:
        throw new AppError('Invalid report type.', 400);
    }
  }
}
