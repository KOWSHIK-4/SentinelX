import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuditService } from './audit.service';
import { AuthRequest, ApiResponse } from '../../types';
import { auditQuerySchema } from './audit.schema';

type AuditQuery = z.infer<typeof auditQuerySchema>;

const auditService = new AuditService();

export async function listAuditLogs(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const query = (req.validatedQuery || req.query) as unknown as AuditQuery;
    const result = await auditService.list(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLog(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const log = await auditService.findById(req.params.id);
    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
}

export async function deleteAuditLog(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const result = await auditService.delete(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
}

export async function clearAuditLogs(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const result = await auditService.clear();
    res.json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
}
