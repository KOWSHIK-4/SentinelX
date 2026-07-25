import { Response, NextFunction } from 'express';
import { NotificationService } from './notifications.service';
import { AuthRequest, ApiResponse } from '../../types';
import { createAuditLog } from '../audit/audit.service';
import { emitUserEvent } from '../../utils/socket';
import { emitEvent } from '../../utils/socket';

const notificationService = new NotificationService();

export async function getNotifications(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const notifications = await notificationService.findAll(req.user!.userId);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function createNotification(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const notification = await notificationService.create({
      ...req.body,
      userId: req.user!.userId,
    });
    emitUserEvent(req.user!.userId, 'notification:created', notification);
    emitEvent('dashboard:statsChanged', { type: 'notification' });
    res.status(201).json({ success: true, data: notification, message: 'Notification created successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user!.userId);
    emitUserEvent(req.user!.userId, 'notification:read', notification);
    res.json({ success: true, data: notification, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    emitUserEvent(req.user!.userId, 'notification:allRead', {});
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    await notificationService.delete(req.params.id, req.user!.userId);
    await createAuditLog(req, 'Notification Deleted', 'Notification', req.params.id, 'Notification deleted', 'Info');
    emitUserEvent(req.user!.userId, 'notification:deleted', { id: req.params.id });
    res.json({ success: true, message: 'Notification deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
