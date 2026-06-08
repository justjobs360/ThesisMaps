import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder',
});

export const CACHE_TTL = {
  metadata: 60 * 60 * 24,     // 24 hours
  search: 60 * 60 * 6,        // 6 hours
  citations: 60 * 60 * 2,     // 2 hours
  graph: 60 * 60 * 12,        // 12 hours
} as const;

export function cacheKey(...parts: string[]): string {
  return parts.join(':');
}
