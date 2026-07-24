import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

// When Upstash isn't configured, use a no-op stub instead of pointing a real
// client at a placeholder host — otherwise every get/set fires a doomed HTTP
// request that hangs for seconds before failing. The stub keeps callers simple
// (they still `await redis.get/set`) while caching silently degrades to off.
type RedisLike = Pick<Redis, 'get' | 'set' | 'flushall' | 'ping'>;

const noopRedis: RedisLike = {
  get: async () => null,
  set: async () => null,
  flushall: async () => 'OK',
  ping: async () => 'PONG',
};

export const redis: RedisLike =
  url && token ? new Redis({ url, token }) : noopRedis;

export const CACHE_TTL = {
  metadata: 60 * 60 * 24,     // 24 hours
  search: 60 * 60 * 6,        // 6 hours
  citations: 60 * 60 * 2,     // 2 hours
  graph: 60 * 60 * 12,        // 12 hours
} as const;

export function cacheKey(...parts: string[]): string {
  return parts.join(':');
}
