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