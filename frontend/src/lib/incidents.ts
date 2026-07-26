import { api, clearCacheForPattern } from './client';

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
