import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
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

router.get('/', authenticate, validate(incidentQuerySchema, 'query'), getIncidents);
router.post('/', authenticate, authorize('Admin', 'Analyst'), validate(createIncidentSchema), createIncident);
router.get('/:id', authenticate, getIncident);
router.put('/:id', authenticate, authorize('Admin', 'Analyst'), validate(updateIncidentSchema), updateIncident);
router.delete('/:id', authenticate, authorize('Admin'), deleteIncident);

export default router;
