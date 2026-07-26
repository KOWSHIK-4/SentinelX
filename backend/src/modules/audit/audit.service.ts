import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { AuthRequest } from '../../types';

interface AuditQuery {
  page?: number;
  limit?: number;
  search?: string;
  severity?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export function createAuditLog(
  req: AuthRequest,
  action: string,
  resource: string,
  resourceId: string | null,
  description?: string,
  severity: string = 'Info',
  userOverride?: { userId: string; userName: string },
) {
  const userInfo = userOverride
    ? { userId: userOverride.userId, userName: userOverride.userName }
    : { userId: req.user?.userId || 'unknown', userName: req.user?.email || 'unknown' };

  return prisma.auditLog.create({
    data: {
      ...userInfo,
      action,
      resource,
      resourceId,
      description: description || null,
      ipAddress: req.ip || null,
      userAgent: req.headers['user-agent'] || null,
      severity,
    },
  });
}

export class AuditService {
  async list(query: AuditQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(Math.max(1, query.limit || 20), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { userName: { contains: query.search, mode: 'insensitive' } },
        { action: { contains: query.search, mode: 'insensitive' } },
        { resource: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { ipAddress: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {};
      if (query.startDate) {
        createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        createdAt.lte = new Date(query.endDate);
      }
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) {
      throw new AppError('Audit log not found.', 404);
    }
    return log;
  }

  async delete(id: string) {
    const log = await prisma.auditLog.findUnique({ where: { id } });
    if (!log) {
      throw new AppError('Audit log not found.', 404);
    }
    await prisma.auditLog.delete({ where: { id } });
    return { message: 'Audit log deleted successfully.' };
  }

  async clear() {
    await prisma.auditLog.deleteMany();
    return { message: 'All audit logs cleared successfully.' };
  }
}
