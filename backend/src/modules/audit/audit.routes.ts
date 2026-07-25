import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { auditQuerySchema } from './audit.schema';
import {
  listAuditLogs,
  getAuditLog,
  deleteAuditLog,
  clearAuditLogs,
} from './audit.controller';

const router = Router();

router.get('/', authenticate, validate(auditQuerySchema, 'query'), listAuditLogs);
router.get('/:id', authenticate, getAuditLog);
router.delete('/:id', authenticate, authorize('Admin'), deleteAuditLog);
router.delete('/', authenticate, authorize('Admin'), clearAuditLogs);

export default router;
