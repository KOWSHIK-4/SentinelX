import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePermission, Permissions } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { createIncidentSchema, updateIncidentSchema, incidentQuerySchema } from './incident.schema';
import {
  createIncident,
  getIncidents,
  getIncident,
  updateIncident,
  deleteIncident,
  getDashboardStats,
} from './incident.controller';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);

router.get('/', authenticate, validate(incidentQuerySchema, 'query'), requirePermission(Permissions.INCIDENTS_READ), getIncidents);
router.post('/', authenticate, requirePermission(Permissions.INCIDENTS_WRITE), validate(createIncidentSchema), createIncident);
router.get('/:id', authenticate, requirePermission(Permissions.INCIDENTS_READ), getIncident);
router.put('/:id', authenticate, requirePermission(Permissions.INCIDENTS_WRITE), validate(updateIncidentSchema), updateIncident);
router.delete('/:id', authenticate, requirePermission(Permissions.INCIDENTS_DELETE), deleteIncident);

export default router;
