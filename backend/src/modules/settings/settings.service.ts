import { prisma } from '../../config/database';
import type { z } from 'zod';
import type { updateSettingsSchema } from './settings.schema';

type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export class SettingsService {
  private async ensureSettings() {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    return settings;
  }

  async get() {
    return this.ensureSettings();
  }

  async update(data: UpdateSettingsInput) {
    const settings = await this.ensureSettings();
    return prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }

  async reset() {
    const settings = await this.ensureSettings();
    return prisma.settings.update({
      where: { id: settings.id },
      data: {
        organizationName: '',
        companyName: null,
        industry: null,
        website: null,
        email: null,
        phone: null,
        timeZone: null,
        address: null,
        logoUrl: null,
        primaryColor: null,
        accentColor: null,
        applicationName: null,
        passwordMinLength: 12,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: true,
        sessionTimeoutMinutes: 60,
        mfaEnabled: false,
        emailNotifications: true,
        browserNotifications: true,
        criticalAlerts: true,
        dailySummaryEmails: false,
        theme: 'system',
        sidebarCollapsed: false,
        compactMode: false,
      },
    });
  }

  async getSystemInfo() {
    return {
      applicationVersion: '1.0.0',
      databaseStatus: 'connected',
      apiStatus: 'healthy',
      dockerStatus: 'running',
      lastBackupTime: '2026-07-24T03:00:00.000Z',
    };
  }
}