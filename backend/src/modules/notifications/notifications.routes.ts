import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from './notifications.controller';

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(255),
  message: z.string().min(1, 'Message is required.').max(5000),
  type: z.string().min(1, 'Type is required.').max(50),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('INFO'),
  link: z.string().nullable().optional(),
});

const router = Router();

router.get('/', authenticate, getNotifications);
router.post('/', authenticate, validate(createNotificationSchema), createNotification);
router.put('/read-all', authenticate, markAllNotificationsRead);
router.put('/:id/read', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
