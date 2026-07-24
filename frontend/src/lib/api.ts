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

  create: (data: { title: string; description: string; severity?: string; status?: string; assignedTo?: string | null }) =>
    api<IncidentResponse>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; description?: string; status?: string; severity?: string; assignedTo?: string | null }) =>
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
