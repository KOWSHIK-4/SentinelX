import type { User } from '@/store/authStore';
import { useAuthStore } from '@/store/authStore';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

interface AuthResponseData {
  success: boolean;
  data: {
    user: User & { roles?: { id: string; name: string }[] };
    token: string;
  };
  message: string;
}

interface ProfileResponseData {
  success: boolean;
  data: User & { roles?: { id: string; name: string }[]; isActive?: boolean; createdAt?: string; updatedAt?: string };
}

const BASE_URL = '/api';

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = useAuthStore.getState().token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = data.error || data.message || 'An unexpected error occurred.';
    throw new Error(error);
  }

  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    }),

  register: (firstName: string, lastName: string, email: string, password: string) =>
    api<AuthResponseData>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, password }),
        skipAuth: true,
      },
    ),

  profile: () =>
    api<ProfileResponseData>('/auth/profile'),
};

export interface IncidentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo: string | null;
  assignedUser: IncidentUser | null;
  createdById: string;
  createdBy: IncidentUser;
  createdAt: string;
  updatedAt: string;
  assets?: {
    asset: {
      id: string;
      assetName: string;
      assetType: string;
      ipAddress: string | null;
      status: string;
      criticality: string;
    };
  }[];
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IncidentListResponse {
  success: boolean;
  data: Incident[];
  pagination: PaginationInfo;
}

export interface IncidentResponse {
  success: boolean;
  data: Incident;
  message?: string;
}

export interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  recentIncidents: Incident[];
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}

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
  }) =>
    api<AssetResponse>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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
  }) =>
    api<AssetResponse>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    api<{ success: boolean; message: string }>(`/assets/${id}`, {
      method: 'DELETE',
    }),

  getDashboardStats: () =>
    api<AssetDashboardStatsResponse>('/assets/stats'),
};

export interface AnalyticsOverview {
  totalIncidents: number;
  openIncidents: number;
  inProgressIncidents: number;
  resolvedIncidents: number;
  closedIncidents: number;
  criticalIncidents: number;
  highIncidents: number;
  mediumIncidents: number;
  lowIncidents: number;
  totalAssets: number;
  activeAssets: number;
  maintenanceAssets: number;
  retiredAssets: number;
  criticalAssets: number;
  totalUsers: number;
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  data: AnalyticsOverview;
}

export interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface StatusDistribution {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface AnalyticsIncidents {
  severityDistribution: SeverityDistribution;
  statusDistribution: StatusDistribution;
}

export interface AnalyticsIncidentsResponse {
  success: boolean;
  data: AnalyticsIncidents;
}

export interface AssetsByType {
  server: number;
  workstation: number;
  laptop: number;
  firewall: number;
  switch: number;
  router: number;
  cloud_vm: number;
  database: number;
  other: number;
}

export interface TopAffectedAsset {
  id: string;
  assetName: string;
  assetType: string;
  ipAddress: string | null;
  criticality: string;
  status: string;
  location: string | null;
  incidentCount: number;
}

export interface AnalyticsAssets {
  assetsByType: AssetsByType;
  topAffectedAssets: TopAffectedAsset[];
}

export interface AnalyticsAssetsResponse {
  success: boolean;
  data: AnalyticsAssets;
}

export interface TrendDataPoint {
  month: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface AnalyticsTrends {
  trend: TrendDataPoint[];
  recentActivity: RecentActivityItem[];
}

export interface AnalyticsTrendsResponse {
  success: boolean;
  data: AnalyticsTrends;
}

export const analyticsApi = {
  getOverview: () =>
    api<AnalyticsOverviewResponse>('/analytics/overview'),

  getIncidents: () =>
    api<AnalyticsIncidentsResponse>('/analytics/incidents'),

  getAssets: () =>
    api<AnalyticsAssetsResponse>('/analytics/assets'),

  getTrends: () =>
    api<AnalyticsTrendsResponse>('/analytics/trends'),
};

export const incidentApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<IncidentListResponse>(`/incidents${query}`);
  },

  getById: (id: string) =>
    api<IncidentResponse>(`/incidents/${id}`),

  create: (data: { title: string; description: string; severity?: string; status?: string; assignedTo?: string | null; assetIds?: string[] }) =>
    api<IncidentResponse>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; description?: string; status?: string; severity?: string; assignedTo?: string | null; assetIds?: string[] }) =>
    api<IncidentResponse>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    api<{ success: boolean; message: string }>(`/incidents/${id}`, {
      method: 'DELETE',
    }),

  getDashboardStats: () =>
    api<DashboardStatsResponse>('/incidents/stats'),
};
