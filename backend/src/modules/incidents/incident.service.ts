import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { AuthRequest } from '../../types';

const incidentInclude = {
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
} as const;

import type { $Enums } from '@prisma/client';

export class IncidentService {
  async create(req: AuthRequest, data: {
    title: string;
    description: string;
    status?: string;
    severity?: string;
    assignedTo?: string | null;
    assetIds?: string[];
  }) {
    const { assetIds, ...incidentData } = data;

    return prisma.incident.create({
      data: {
        title: incidentData.title,
        description: incidentData.description,
        status: (incidentData.status as $Enums.IncidentStatus) || 'OPEN',
        severity: (incidentData.severity as $Enums.IncidentSeverity) || 'MEDIUM',
        assignedTo: incidentData.assignedTo ?? null,
        createdById: req.user!.userId,
        ...(assetIds && assetIds.length > 0
          ? { assets: { create: assetIds.map((assetId) => ({ assetId })) } }
          : {}),
      },
      include: incidentInclude,
    });
  }

  async findAll(query: {
    page: number;
    limit: number;
    status?: string;
    severity?: string;
    assignedTo?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const where: Prisma.IncidentWhereInput = {};

    if (query.status) {
      where.status = query.status as $Enums.IncidentStatus;
    }

    if (query.severity) {
      where.severity = query.severity as $Enums.IncidentSeverity;
    }

    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const orderBy: Prisma.IncidentOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    const skip = (query.page - 1) * query.limit;

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        include: incidentInclude,
      }),
      prisma.incident.count({ where }),
    ]);

    return {
      data: incidents,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: incidentInclude,
    });

    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    return incident;
  }

  async update(id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    severity?: string;
    assignedTo?: string | null;
    assetIds?: string[];
  }) {
    const existing = await prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Incident not found.', 404);
    }

    const updateData: Prisma.IncidentUncheckedUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status as $Enums.IncidentStatus;
    if (data.severity !== undefined) updateData.severity = data.severity as $Enums.IncidentSeverity;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;

    if (data.assetIds !== undefined) {
      await prisma.incidentAsset.deleteMany({ where: { incidentId: id } });
      if (data.assetIds.length > 0) {
        await prisma.incidentAsset.createMany({
          data: data.assetIds.map((assetId) => ({ incidentId: id, assetId })),
        });
      }
    }

    return prisma.incident.update({
      where: { id },
      data: updateData,
      include: incidentInclude,
    });
  }

  async delete(id: string) {
    const existing = await prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Incident not found.', 404);
    }

    await prisma.incident.delete({ where: { id } });
  }

  async getDashboardStats() {
    const [
      total,
      open,
      inProgress,
      resolved,
      critical,
      high,
      recentIncidents,
    ] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: 'OPEN' } }),
      prisma.incident.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.incident.count({ where: { status: 'RESOLVED' } }),
      prisma.incident.count({ where: { severity: 'CRITICAL' } }),
      prisma.incident.count({ where: { severity: 'HIGH' } }),
      prisma.incident.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      totalIncidents: total,
      openIncidents: open,
      inProgressIncidents: inProgress,
      resolvedIncidents: resolved,
      criticalIncidents: critical,
      highIncidents: high,
      recentIncidents,
    };
  }
}
