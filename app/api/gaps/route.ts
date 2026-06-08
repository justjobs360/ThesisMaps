import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MOCK_RESEARCH_GAPS } from '@/lib/mockData';

const querySchema = z.object({
  projectId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ projectId: searchParams.get('projectId') });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // In production: call ML microservice for gap detection
  try {
    const mlUrl = process.env.ML_SERVICE_URL;
    if (mlUrl) {
      const res = await fetch(`${mlUrl}/gaps?projectId=${parsed.data.projectId}`, {
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    }
  } catch {}

  return NextResponse.json({ gaps: MOCK_RESEARCH_GAPS });
}
