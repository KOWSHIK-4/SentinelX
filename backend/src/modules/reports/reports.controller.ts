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

export async function exportReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { type, format, filters } = req.body as ExportReport;
    const result = await reportsService.exportReport(type, format, filters || {});

    if (format === 'pdf' && result instanceof Buffer) {
      const filename = `${type}-report-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', result.length);
      res.end(result);
      return;
    }

    if (format === 'csv' && typeof result === 'string') {
      const filename = `${type}-report-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(result);
      return;
    }

    res.json({ success: true, data: result, message: 'Report exported successfully.' });
  } catch (error) {
    next(error);
  }
}
