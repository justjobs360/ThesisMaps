import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MOCK_GRAPH_DATA } from '@/lib/mockData';

const querySchema = z.object({
  projectId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ projectId: searchParams.get('projectId') });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // In production: fetch saved papers for projectId, build citation graph
  return NextResponse.json(MOCK_GRAPH_DATA);
}
