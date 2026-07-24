import { Prisma, $Enums } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { AuthRequest } from '../../types';

export class IncidentService {
  async create(req: AuthRequest, data: {
    title: string;
    description: string;
    status?: string;
    severity?: string;
    assignedTo?: string | null;
  }) {
    return prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        status: (data.status as $Enums.IncidentStatus) || 'OPEN',
        severity: (data.severity as $Enums.IncidentSeverity) || 'MEDIUM',
        assignedTo: data.assignedTo ?? null,
        createdById: req.user!.userId,
      },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
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
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
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
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
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
  }) {
    const existing = await prisma.incident.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Incident not found.', 404);
    }

    const updateData: Prisma.IncidentUncheckedUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status as Prisma.EnumIncidentStatusFilter['equals'];
    if (data.severity !== undefined) updateData.severity = data.severity as Prisma.EnumIncidentSeverityFilter['equals'];
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;

    return prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
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
