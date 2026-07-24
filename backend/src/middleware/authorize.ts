import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest, ApiResponse } from '../types';

export function authorize(...allowedRoles: string[]) {
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
        include: { role: true },
      });

      const roleNames = userRoles.map((ur) => ur.role.name);

      const hasRole = allowedRoles.some((role) => roleNames.includes(role));

      if (!hasRole) {
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
        error: 'Authorization check failed.',
      });
    }
  };
}