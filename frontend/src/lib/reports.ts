import { useAuthStore } from '@/store/authStore';
import { api } from './client';
import { BASE_URL } from './client';
import type { Incident } from './incidents';
import type { Asset } from './assets';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  severity?: string;
  status?: string;
  assetType?: string;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface StatusBreakdown {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface AssetTypeBreakdown {
  server: number;
  workstation: number;
  laptop: number;
  firewall: number;
  switch: number;
  router: number;
  cloudVm: number;
  database: number;
  other: number;
}

export interface CriticalityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface IncidentsReport {
  data: Incident[];
  total: number;
  severityBreakdown: SeverityBreakdown;
  statusBreakdown: StatusBreakdown;
}

export interface AssetsReport {
  data: Asset[];
  total: number;
  typeBreakdown: AssetTypeBreakdown;
  criticalityBreakdown: CriticalityBreakdown;
}

export interface SummaryReport {
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
  totalAssets: number;
  activeAssets: number;
  criticalAssets: number;
  recentIncidents: Incident[];
  reportGeneratedAt: string;
}

export interface ReportsIncidentsResponse {
  success: boolean;
  data: IncidentsReport;
}

export interface ReportsAssetsResponse {
  success: boolean;
  data: AssetsReport;
}

export interface ReportsSummaryResponse {
  success: boolean;
  data: SummaryReport;
}

export interface ExportResponse {
  success: boolean;
  data: {
    type: string;
    format: string;
    data: unknown;
    exportedAt: string;
  };
  message: string;
}

export const reportsApi = {
  getIncidents: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<ReportsIncidentsResponse>(`/reports/incidents${query}`, { cacheTTL: 30000 });
  },

  getAssets: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<ReportsAssetsResponse>(`/reports/assets${query}`, { cacheTTL: 30000 });
  },

  getSummary: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<ReportsSummaryResponse>(`/reports/summary${query}`, { cacheTTL: 30000 });
  },

  export: (data: { type: string; format: string; filters?: ReportFilters }) =>
    api<ExportResponse>('/reports/export', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false,
    }),

  downloadExport: async (data: { type: string; format: string; filters?: ReportFilters }): Promise<Blob> => {
    const token = useAuthStore.getState().token;
    const res = await fetch(`${BASE_URL}/reports/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to export report.' }));
      throw new Error(err.error || 'Failed to export report.');
    }

    return res.blob();
  },
};
