import { useAuthStore } from '@/store/authStore';
import { api, clearCacheForPattern, BASE_URL } from './client';

export interface SettingsData {
  id: string;
  organizationName: string;
  companyName: string | null;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  timeZone: string | null;
  address: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  applicationName: string | null;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  sessionTimeoutMinutes: number;
  mfaEnabled: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  criticalAlerts: boolean;
  dailySummaryEmails: boolean;
  theme: 'dark' | 'light' | 'system';
  sidebarCollapsed: boolean;
  compactMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  success: boolean;
  data: SettingsData;
  message?: string;
}

export interface SystemInfo {
  applicationVersion: string;
  databaseStatus: string;
  apiStatus: string;
  dockerStatus: string;
  lastBackupTime: string;
}

export interface SystemInfoResponse {
  success: boolean;
  data: SystemInfo;
}

export interface LogoUploadResponse {
  success: boolean;
  data: { logoUrl: string };
  message: string;
}

export const settingsApi = {
  get: () =>
    api<SettingsResponse>('/settings', { cacheTTL: 60000 }),

  update: (data: Partial<SettingsData>) => {
    clearCacheForPattern(/\/settings/);
    return api<SettingsResponse>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  reset: () => {
    clearCacheForPattern(/\/settings/);
    return api<SettingsResponse>('/settings/reset', {
      method: 'POST',
      useCache: false,
    });
  },

  getSystemInfo: () =>
    api<SystemInfoResponse>('/settings/system', { cacheTTL: 60000 }),

  uploadLogo: async (file: File): Promise<LogoUploadResponse> => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('logo', file);

    const res = await fetch(`${BASE_URL}/settings/logo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload logo.');
    }
    return data;
  },
};
