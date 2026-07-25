import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, Permissions } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { auditQuerySchema } from './audit.schema';
import {
  listAuditLogs,
  getAuditLog,
  deleteAuditLog,
  clearAuditLogs,
} from './audit.controller';

const router = Router();

router.get('/', authenticate, validate(auditQuerySchema, 'query'), requirePermission(Permissions.AUDIT_READ), listAuditLogs);
router.get('/:id', authenticate, requirePermission(Permissions.AUDIT_READ), getAuditLog);
router.delete('/:id', authenticate, requirePermission(Permissions.USERS_MANAGE), deleteAuditLog);
router.delete('/', authenticate, requirePermission(Permissions.USERS_MANAGE), clearAuditLogs);

export default router;
