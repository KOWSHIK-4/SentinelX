import type { User } from '@/store/authStore';
import { useAuthStore } from '@/store/authStore';

interface ApiOptions extends Omit<RequestInit, 'cache'> {
  skipAuth?: boolean;
  useCache?: boolean;
  cacheTTL?: number;
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

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const cacheStore = new Map<string, { data: unknown; timestamp: number }>();
const DEFAULT_CACHE_TTL = 30000;

function getCacheKey(endpoint: string, options?: ApiOptions): string {
  const token = useAuthStore.getState().token || '';
  return `${token}:${endpoint}:${JSON.stringify(options?.body || '')}`;
}

function getFromCache(key: string, ttl: number): unknown | null {
  const cached = cacheStore.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  cacheStore.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  if (cacheStore.size > 100) {
    const firstKey = cacheStore.keys().next().value;
    if (firstKey) cacheStore.delete(firstKey);
  }
  cacheStore.set(key, { data, timestamp: Date.now() });
}

function clearCacheForPattern(pattern: RegExp): void {
  for (const key of cacheStore.keys()) {
    if (pattern.test(key)) {
      cacheStore.delete(key);
    }
  }
}

export function clearApiCache() {
  cacheStore.clear();
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth = false, useCache = true, cacheTTL = DEFAULT_CACHE_TTL, ...fetchOptions } = options;

  const cacheKey = getCacheKey(endpoint, options);
  if (useCache && fetchOptions.method === undefined) {
    const cached = getFromCache(cacheKey, cacheTTL);
    if (cached) return cached as T;
  }

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

  if (res.status === 401 && !skipAuth) {
    useAuthStore.getState().logout();
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();

  if (!res.ok) {
    const error = data.error || data.message || 'An unexpected error occurred.';
    throw new Error(error);
  }

  if (useCache && fetchOptions.method === undefined) {
    setCache(cacheKey, data);
  }

  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
      useCache: false,
    }),

  register: (firstName: string, lastName: string, email: string, password: string) =>
    api<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
      skipAuth: true,
      useCache: false,
    }),

  profile: () =>
    api<ProfileResponseData>('/auth/profile', { cacheTTL: 60000 }),
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
    api<AnalyticsOverviewResponse>('/analytics/overview', { cacheTTL: 30000 }),

  getIncidents: () =>
    api<AnalyticsIncidentsResponse>('/analytics/incidents', { cacheTTL: 30000 }),

  getAssets: () =>
    api<AnalyticsAssetsResponse>('/analytics/assets', { cacheTTL: 30000 }),

  getTrends: () =>
    api<AnalyticsTrendsResponse>('/analytics/trends', { cacheTTL: 30000 }),
};

export const incidentApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<IncidentListResponse>(`/incidents${query}`);
  },

  getById: (id: string) =>
    api<IncidentResponse>(`/incidents/${id}`),

  create: (data: { title: string; description: string; severity?: string; status?: string; assignedTo?: string | null; assetIds?: string[] }) => {
    clearCacheForPattern(/\/incidents/);
    return api<IncidentResponse>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  update: (id: string, data: { title?: string; description?: string; status?: string; severity?: string; assignedTo?: string | null; assetIds?: string[] }) => {
    clearCacheForPattern(/\/incidents/);
    return api<IncidentResponse>(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  delete: (id: string) => {
    clearCacheForPattern(/\/incidents/);
    return api<{ success: boolean; message: string }>(`/incidents/${id}`, {
      method: 'DELETE',
      useCache: false,
    });
  },

  getDashboardStats: () =>
    api<DashboardStatsResponse>('/incidents/stats', { cacheTTL: 15000 }),
};

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

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin: string | null;
  roles: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamListResponse {
  success: boolean;
  data: TeamMember[];
}

export interface TeamMemberResponse {
  success: boolean;
  data: TeamMember;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export const teamApi = {
  list: () =>
    api<TeamListResponse>('/team', { cacheTTL: 30000 }),

  create: (data: { email: string; password: string; firstName: string; lastName: string; roleName: string }) => {
    clearCacheForPattern(/\/team/);
    return api<TeamMemberResponse>('/team', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  update: (id: string, data: { email?: string; firstName?: string; lastName?: string; roleName?: string; isActive?: boolean }) => {
    clearCacheForPattern(/\/team/);
    return api<TeamMemberResponse>(`/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      useCache: false,
    });
  },

  delete: (id: string) => {
    clearCacheForPattern(/\/team/);
    return api<DeleteResponse>(`/team/${id}`, {
      method: 'DELETE',
      useCache: false,
    });
  },
};

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
};

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  isRead: boolean;
  link: string | null;
  userId: string;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
  message?: string;
}

export const notificationApi = {
  list: () =>
    api<NotificationListResponse>('/notifications', { cacheTTL: 15000 }),

  create: (data: { title: string; message: string; type: string; severity?: string; link?: string | null }) =>
    api<NotificationResponse>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
      useCache: false,
    }),

  markRead: (id: string) => {
    clearCacheForPattern(/\/notifications/);
    return api<NotificationResponse>(`/notifications/${id}/read`, {
      method: 'PUT',
      useCache: false,
    });
  },

  markAllRead: () => {
    clearCacheForPattern(/\/notifications/);
    return api<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
      useCache: false,
    });
  },

  delete: (id: string) => {
    clearCacheForPattern(/\/notifications/);
    return api<DeleteResponse>(`/notifications/${id}`, {
      method: 'DELETE',
      useCache: false,
    });
  },
};

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
};

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  severity: string;
  createdAt: string;
}

export interface AuditListResponse {
  success: boolean;
  data: AuditLog[];
  pagination: PaginationInfo;
}

export interface AuditResponse {
  success: boolean;
  data: AuditLog;
}

export interface AuditDeleteResponse {
  success: boolean;
  message: string;
}

export const auditApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<AuditListResponse>(`/audit${query}`);
  },

  getById: (id: string) =>
    api<AuditResponse>(`/audit/${id}`),

  delete: (id: string) => {
    clearCacheForPattern(/\/audit/);
    return api<AuditDeleteResponse>(`/audit/${id}`, {
      method: 'DELETE',
      useCache: false,
    });
  },

  clear: () => {
    clearCacheForPattern(/\/audit/);
    return api<AuditDeleteResponse>('/audit', {
      method: 'DELETE',
      useCache: false,
    });
  },
};