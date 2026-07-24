import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { ReportsService } from './reports.service';
import { AuthRequest, ApiResponse } from '../../types';
import { reportFilterSchema, exportReportSchema } from './reports.schema';

type ReportFilters = z.infer<typeof reportFilterSchema>;
type ExportReport = z.infer<typeof exportReportSchema>;

const reportsService = new ReportsService();

export async function getIncidentsReport(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const filters = (req.validatedQuery || {}) as unknown as ReportFilters;
    const result = await reportsService.getIncidentsReport(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAssetsReport(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const filters = (req.validatedQuery || {}) as unknown as ReportFilters;
    const result = await reportsService.getAssetsReport(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getSummaryReport(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const filters = (req.validatedQuery || {}) as unknown as ReportFilters;
    const result = await reportsService.getSummaryReport(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function exportReport(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const { type, format, filters } = req.body as ExportReport;
    const result = await reportsService.exportReport(type, format, filters);
    res.json({ success: true, data: result, message: 'Report exported successfully.' });
  } catch (error) {
    next(error);
  }
}
