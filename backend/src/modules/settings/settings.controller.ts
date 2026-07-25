import { Response, NextFunction } from 'express';
import { SettingsService } from './settings.service';
import { AuthRequest, ApiResponse } from '../../types';
import { createAuditLog } from '../audit/audit.service';

const settingsService = new SettingsService();

export async function getSettings(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const settings = await settingsService.get();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const settings = await settingsService.update(req.body);
    await createAuditLog(req, 'Settings Updated', 'Settings', settings.id, 'Settings updated', 'Info');
    res.json({ success: true, data: settings, message: 'Settings updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function resetSettings(req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const settings = await settingsService.reset();
    await createAuditLog(req, 'Settings Reset', 'Settings', settings.id, 'Settings reset to defaults', 'Warning');
    res.json({ success: true, data: settings, message: 'Settings reset to defaults.' });
  } catch (error) {
    next(error);
  }
}

export async function getSystemInfo(_req: AuthRequest, res: Response<ApiResponse>, next: NextFunction) {
  try {
    const info = await settingsService.getSystemInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    next(error);
  }
}