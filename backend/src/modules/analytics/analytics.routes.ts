import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getOverview, getIncidents, getAssets, getTrends } from './analytics.controller';

const router = Router();

router.get('/overview', authenticate, getOverview);
router.get('/incidents', authenticate, getIncidents);
router.get('/assets', authenticate, getAssets);
router.get('/trends', authenticate, getTrends);

export default router;
