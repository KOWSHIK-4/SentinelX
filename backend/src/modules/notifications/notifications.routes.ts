import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from './notifications.controller';

const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/', authenticate, createNotification);
router.put('/read-all', authenticate, markAllNotificationsRead);
router.put('/:id/read', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
