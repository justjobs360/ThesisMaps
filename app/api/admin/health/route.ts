import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { redis } from '@/lib/redis';
import { handleRouteError } from '@/lib/route-helpers';

type ServiceStatus = { name: string; status: 'online' | 'offline' | 'not_configured'; latencyMs?: number };

async function ping(name: string, url: string): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { name, status: res.ok ? 'online' : 'offline', latencyMs: Date.now() - start };
  } catch {
    return { name, status: 'offline' };
  }
}

// GET /api/admin/health — live status of external services
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const mlUrl = process.env.ML_SERVICE_URL;
    const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL);

    const checks = await Promise.all([
      ping('Semantic Scholar', 'https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=1'),
      ping('OpenAlex', 'https://api.openalex.org/works?per-page=1'),
      ping('arXiv', 'https://export.arxiv.org/api/query?search_query=all:test&max_results=1'),
      ping('CrossRef', 'https://api.crossref.org/works?rows=1'),
      mlUrl
        ? ping('ML API', `${mlUrl}/health`)
        : Promise.resolve<ServiceStatus>({ name: 'ML API', status: 'not_configured' }),
      (async (): Promise<ServiceStatus> => {
        if (!redisConfigured) return { name: 'Redis Cache', status: 'not_configured' };
        const start = Date.now();
        try {
          await redis.ping();
          return { name: 'Redis Cache', status: 'online', latencyMs: Date.now() - start };
        } catch {
          return { name: 'Redis Cache', status: 'offline' };
        }
      })(),
    ]);

    return NextResponse.json({ services: checks });
  } catch (err) {
    return handleRouteError(err, 'admin/health/GET');
  }
}
