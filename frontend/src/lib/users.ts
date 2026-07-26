import { api, clearCacheForPattern } from './client';

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
