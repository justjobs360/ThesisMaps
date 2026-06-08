import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MOCK_OUTLINE_SECTIONS } from '@/lib/mockData';

const querySchema = z.object({
  projectId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ projectId: searchParams.get('projectId') });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  return NextResponse.json(MOCK_OUTLINE_SECTIONS);
}

export async function POST(request: Request) {
  const body = z.object({
    projectId: z.string().uuid(),
    title: z.string().min(1).max(200),
    parentId: z.string().uuid().optional(),
    orderIndex: z.number().int().nonnegative().optional(),
  }).parse(await request.json());

  // In production: insert into outline_sections table
  return NextResponse.json({ id: crypto.randomUUID(), ...body, createdAt: new Date().toISOString() }, { status: 201 });
}
