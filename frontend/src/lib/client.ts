import { useAuthStore } from '@/store/authStore';

interface ApiOptions extends Omit<RequestInit, 'cache'> {
  skipAuth?: boolean;
  useCache?: boolean;
  cacheTTL?: number;
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

export function clearCacheForPattern(pattern: RegExp): void {
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

export { BASE_URL };
export type { ApiOptions };
