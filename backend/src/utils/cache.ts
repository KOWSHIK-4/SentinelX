import { cacheGet, cacheSet, cacheDeletePattern } from '../config/redis';

export function withCache(key: string, ttl: number = 300) {
  return {
    get: async <T>(fetch: () => Promise<T>): Promise<T> => {
      const cached = await cacheGet<T>(key);
      if (cached !== null) return cached;
      const data = await fetch();
      await cacheSet(key, data, ttl);
      return data;
    },
    invalidate: async () => {
      await cacheDeletePattern(key);
    },
  };
}

export function cacheKey(...parts: string[]): string {
  return `sentinelx:${parts.join(':')}`;
}
