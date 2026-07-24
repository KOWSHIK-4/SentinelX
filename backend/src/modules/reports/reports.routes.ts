import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { reportFilterSchema, exportReportSchema } from './reports.schema';
import {
  getIncidentsReport,
  getAssetsReport,
  getSummaryReport,
  exportReport,
} from './reports.controller';

const router = Router();

router.get('/incidents', authenticate, validate(reportFilterSchema, 'query'), getIncidentsReport);
router.get('/assets', authenticate, validate(reportFilterSchema, 'query'), getAssetsReport);
router.get('/summary', authenticate, validate(reportFilterSchema, 'query'), getSummaryReport);
router.post('/export', authenticate, authorize('Admin', 'Analyst'), validate(exportReportSchema), exportReport);

export default router;
