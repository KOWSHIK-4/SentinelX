import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import incidentRoutes from '../modules/incidents/incident.routes';
import assetRoutes from '../modules/assets/asset.routes';
import analyticsRoutes from '../modules/analytics/analytics.routes';
import reportRoutes from '../modules/reports/reports.routes';
import teamRoutes from '../modules/team/team.routes';
import settingsRoutes from '../modules/settings/settings.routes';
import notificationRoutes from '../modules/notifications/notifications.routes';
import auditRoutes from '../modules/audit/audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/assets', assetRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/team', teamRoutes);
router.use('/settings', settingsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);

export default router;
