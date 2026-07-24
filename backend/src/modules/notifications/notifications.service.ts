import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class NotificationService {
  async findAll(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    title: string;
    message: string;
    type: string;
    severity?: string;
    link?: string | null;
    userId: string;
  }) {
    return prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        severity: data.severity ?? 'INFO',
        link: data.link ?? null,
        userId: data.userId,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    const existing = await prisma.notification.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Notification not found.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Unauthorized access to notification.', 403);
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    const existing = await prisma.notification.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Notification not found.', 404);
    }

    if (existing.userId !== userId) {
      throw new AppError('Unauthorized access to notification.', 403);
    }

    await prisma.notification.delete({ where: { id } });
  }
}
