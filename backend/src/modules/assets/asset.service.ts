import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { withCache, cacheKey } from '../../utils/cache';

import type { $Enums } from '@prisma/client';

export class AssetService {
  async create(data: {
    assetName: string;
    hostname?: string | null;
    ipAddress?: string | null;
    assetType?: string;
    operatingSystem?: string | null;
    owner?: string | null;
    department?: string | null;
    criticality?: string;
    status?: string;
    location?: string | null;
    description?: string | null;
  }) {
    return prisma.asset.create({
      data: {
        assetName: data.assetName,
        hostname: data.hostname ?? null,
        ipAddress: data.ipAddress ?? null,
        assetType: (data.assetType as $Enums.AssetType) || 'OTHER',
        operatingSystem: data.operatingSystem ?? null,
        owner: data.owner ?? null,
        department: data.department ?? null,
        criticality: (data.criticality as $Enums.Criticality) || 'MEDIUM',
        status: (data.status as $Enums.AssetStatus) || 'ACTIVE',
        location: data.location ?? null,
        description: data.description ?? null,
      },
    });
  }

  async findAll(query: {
    page: number;
    limit: number;
    search?: string;
    assetType?: string;
    status?: string;
    criticality?: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const where: Prisma.AssetWhereInput = {};

    if (query.search) {
      where.OR = [
        { assetName: { contains: query.search, mode: 'insensitive' } },
        { hostname: { contains: query.search, mode: 'insensitive' } },
        { ipAddress: { contains: query.search, mode: 'insensitive' } },
        { owner: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.assetType) {
      where.assetType = query.assetType as $Enums.AssetType;
    }

    if (query.status) {
      where.status = query.status as $Enums.AssetStatus;
    }

    if (query.criticality) {
      where.criticality = query.criticality as $Enums.Criticality;
    }

    const allowedSortFields = ['assetName', 'assetType', 'criticality', 'status', 'createdAt', 'updatedAt'];
    const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';

    const orderBy: Prisma.AssetOrderByWithRelationInput = {
      [sortBy]: query.sortOrder,
    };

    const skip = (query.page - 1) * query.limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: Math.min(query.limit, 100),
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        incidents: {
          include: {
            incident: {
              select: {
                id: true,
                title: true,
                status: true,
                severity: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    return asset;
  }

  async update(id: string, data: {
    assetName?: string;
    hostname?: string | null;
    ipAddress?: string | null;
    assetType?: string;
    operatingSystem?: string | null;
    owner?: string | null;
    department?: string | null;
    criticality?: string;
    status?: string;
    location?: string | null;
    description?: string | null;
  }) {
    const updateData: Prisma.AssetUncheckedUpdateInput = {};

    if (data.assetName !== undefined) updateData.assetName = data.assetName;
    if (data.hostname !== undefined) updateData.hostname = data.hostname;
    if (data.ipAddress !== undefined) updateData.ipAddress = data.ipAddress;
    if (data.assetType !== undefined) updateData.assetType = data.assetType as $Enums.AssetType;
    if (data.operatingSystem !== undefined) updateData.operatingSystem = data.operatingSystem;
    if (data.owner !== undefined) updateData.owner = data.owner;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.criticality !== undefined) updateData.criticality = data.criticality as $Enums.Criticality;
    if (data.status !== undefined) updateData.status = data.status as $Enums.AssetStatus;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.description !== undefined) updateData.description = data.description;

    return prisma.asset.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const existing = await prisma.asset.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Asset not found.', 404);
    }

    await prisma.asset.delete({ where: { id } });
    return existing;
  }

  async getDashboardStats() {
    const cache = withCache(cacheKey('assets', 'stats'), 30);

    return cache.get(async () => {
      const [total, active, maintenance, retired, critical, high, recentAssets] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { status: 'ACTIVE' } }),
        prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
        prisma.asset.count({ where: { status: 'RETIRED' } }),
        prisma.asset.count({ where: { criticality: 'CRITICAL' } }),
        prisma.asset.count({ where: { criticality: 'HIGH' } }),
        prisma.asset.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        totalAssets: total,
        activeAssets: active,
        maintenanceAssets: maintenance,
        retiredAssets: retired,
        criticalAssets: critical,
        highAssets: high,
        recentAssets,
      };
    });
  }
}
