import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
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

  async uploadLogo(file: Express.Multer.File): Promise<string> {
    const settings = await this.ensureSettings();

    if (env.CLOUDINARY_URL) {
      cloudinary.v2.config({ url: env.CLOUDINARY_URL });
      const result = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          { folder: 'sentinelx/logos', public_id: `logo-${settings.id}` },
          (error, result) => {
            if (error) reject(new AppError('Failed to upload to Cloudinary.', 500));
            else resolve(result!);
          },
        );
        uploadStream.end(file.buffer);
      });

      const logoUrl = result.secure_url;
      await prisma.settings.update({
        where: { id: settings.id },
        data: { logoUrl },
      });
      return logoUrl;
    }

    const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR, 'logos');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.png';
    const filename = `logo-${settings.id}-${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const logoUrl = `/api/uploads/logos/${filename}`;
    await prisma.settings.update({
      where: { id: settings.id },
      data: { logoUrl },
    });
    return logoUrl;
  }
}
