import { z } from 'zod';

export const reportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assetType: z.enum(['SERVER', 'WORKSTATION', 'LAPTOP', 'FIREWALL', 'SWITCH', 'ROUTER', 'CLOUD_VM', 'DATABASE', 'OTHER']).optional(),
});

export const exportReportSchema = z.object({
  type: z.enum(['incidents', 'assets', 'critical-incidents', 'executive-summary']),
  format: z.enum(['pdf', 'csv']),
  filters: reportFilterSchema.optional(),
});
