import type { User } from '@/store/authStore';
import { api } from './client';

export interface AuthResponseData {
  success: boolean;
  data: {
    user: User & { roles?: { id: string; name: string }[] };
    token: string;
  };
  message: string;
}

export interface ProfileResponseData {
  success: boolean;
  data: User & { roles?: { id: string; name: string }[]; isActive?: boolean; createdAt?: string; updatedAt?: string };
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
