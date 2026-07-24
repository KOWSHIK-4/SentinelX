import { Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { AuthRequest, ApiResponse } from '../../types';

const analyticsService = new AnalyticsService();

export async function getOverview(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const data = await analyticsService.getOverview();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getIncidents(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const data = await analyticsService.getIncidents();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getAssets(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const data = await analyticsService.getAssets();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTrends(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const data = await analyticsService.getTrends();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
