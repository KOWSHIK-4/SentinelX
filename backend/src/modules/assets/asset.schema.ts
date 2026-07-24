import { z } from 'zod';

export const createAssetSchema = z.object({
  assetName: z.string().min(1, 'Asset name is required.').max(255),
  hostname: z.string().max(255).optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
  assetType: z.enum(['SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER']).optional(),
  operatingSystem: z.string().max(255).optional().nullable(),
  owner: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).optional(),
  location: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
});

export const updateAssetSchema = z.object({
  assetName: z.string().min(1).max(255).optional(),
  hostname: z.string().max(255).optional().nullable(),
  ipAddress: z.string().max(45).optional().nullable(),
  assetType: z.enum(['SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER']).optional(),
  operatingSystem: z.string().max(255).optional().nullable(),
  owner: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).optional(),
  location: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
});

export const assetQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  assetType: z.enum(['SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'RETIRED']).optional(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  sortBy: z.enum(['assetName', 'assetType', 'criticality', 'status', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const linkAssetSchema = z.object({
  assetIds: z.array(z.string()).min(1, 'At least one asset ID is required.'),
});
