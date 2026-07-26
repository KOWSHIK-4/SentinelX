import { api, clearCacheForPattern } from './client';
import type { PaginationInfo } from './incidents';

export interface Asset {
  id: string;
  assetName: string;
  hostname: string | null;
  ipAddress: string | null;
  assetType: 'SERVER' | 'WORKSTATION' | 'LAPTOP' | 'FIREWALL' | 'SWITCH' | 'ROUTER' | 'CLOUD_VM' | 'DATABASE' | 'OTHER';
  operatingSystem: string | null;
  owner: string | null;
  department: string | null;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';
  location: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetListResponse {
  success: boolean;
  data: Asset[];
  pagination: PaginationInfo;
}

export interface AssetResponse {
  success: boolean;
  data: Asset;
  message?: string;
}

export interface AssetDetailResponse {
  success: boolean;
  data: Asset & {
    incidents: {
      incident: {
        id: string;
        title: string;
        status: string;
        severity: string;
        createdAt: string;
      };
    }[];
  };
}

export interface AssetDashboardStats {
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  criticalAssets: number;
  highAssets: number;
  recentAssets: Asset[];
}

export interface AssetDashboardStatsResponse {
  success: boolean;
  data: AssetDashboardStats;
}

export const assetApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<AssetListResponse>(`/assets${query}`);
  },

  getById: (id: string) =>
    api<AssetDetailResponse>(`/assets/${id}`),

  create: (data: {
    assetName: string;
    hostname?: string | null;
    ipAddress?: string | null;
    assetType?: string;
    operatingSystem?: string | null;
    owner?: string | null;
    department?: string | null;
    criticality?: string;
    status?: string;
    location?: string | null;
    description?: string | null;
  }) => {
    clearCacheForPattern(/\/assets/);
    return api<AssetResponse>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  update: (id: string, data: {
    assetName?: string;
    hostname?: string | null;
    ipAddress?: string | null;
    assetType?: string;
    operatingSystem?: string | null;
    owner?: string | null;
    department?: string | null;
    criticality?: string;
    status?: string;
    location?: string | null;
    description?: string | null;
  }) => {
    clearCacheForPattern(/\/assets/);
    return api<AssetResponse>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  delete: (id: string) => {
    clearCacheForPattern(/\/assets/);
    return api<{ success: boolean; message: string }>(`/assets/${id}`, {
      method: 'DELETE',
      useCache: false,
    });
  },

  getDashboardStats: () =>
    api<AssetDashboardStatsResponse>('/assets/stats', { cacheTTL: 15000 }),
};
