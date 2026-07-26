import { api, clearCacheForPattern } from './client';
import type { PaginationInfo } from './incidents';

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
