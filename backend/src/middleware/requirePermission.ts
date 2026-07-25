import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

export const Permissions = {
  INCIDENTS_READ: 'incidents.read',
  INCIDENTS_WRITE: 'incidents.write',
  INCIDENTS_DELETE: 'incidents.delete',
  ASSETS_READ: 'assets.read',
  ASSETS_WRITE: 'assets.write',
  REPORTS_EXPORT: 'reports.export',
  AUDIT_READ: 'audit.read',
  SETTINGS_UPDATE: 'settings.update',
  USERS_MANAGE: 'users.manage',
} as const;

export function requirePermission(...permissions: string[]) {
  return async (
    req: AuthRequest,
    res: Response<ApiResponse>,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
        });
        return;
      }

      const userRoles = await prisma.userRole.findMany({
        where: { userId: req.user.userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      const userPermissions = userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => `${rp.permission.resource}.${rp.permission.action}`),
      );

      const hasPermission = permissions.some((p) => userPermissions.includes(p));

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions. You do not have access to this resource.',
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({
        success: false,
        error: 'Permission check failed.',
      });
    }
  };
}
