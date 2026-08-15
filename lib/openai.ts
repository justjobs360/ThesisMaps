// Minimal server-side OpenAI Chat Completions client (no SDK dependency — a
// single fetch keeps the bundle lean and CSP-irrelevant since it runs on the
// server). Used to generate personalized, paper-grounded analysis where the
// built-in keyword heuristics produce generic/repetitive output.

import { AI_VOICE } from '@/lib/aiVoice';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';

// Matches the `papers.embedding vector(768)` column in supabase/schema.sql.
// text-embedding-3-* supports native dimension reduction via the `dimensions`
// parameter, so we request 768 directly and avoid migrating the column/index.
export const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_MODEL = 'text-embedding-3-small';

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * Embeds one or more texts into 768-dimension vectors, preserving input order.
 * Batch where possible — one call with N inputs is far cheaper than N calls.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  if (texts.length === 0) return [];

  const res = await fetch(EMBEDDINGS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      // The API rejects empty strings; keep positions stable with a placeholder.
      input: texts.map((t) => t.trim() || 'untitled'),
      dimensions: EMBEDDING_DIMENSIONS,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI embeddings ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { data?: { index: number; embedding: number[] }[] };
  const rows = data.data ?? [];
  // The API may return results out of order — sort by index before mapping.
  return [...rows].sort((a, b) => a.index - b.index).map((r) => r.embedding);
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ChatOptions = {
  json?: boolean; // request a JSON object response
  temperature?: number; // only applied to non-reasoning models
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'; // reasoning models only
  maxTokens?: number; // maps to max_completion_tokens (includes reasoning tokens)
  /** Set false to skip the shared house-style instruction (defaults to on). */
  voice?: boolean;
};

// GPT-5 / o-series are reasoning models: they require `max_completion_tokens`
// (not `max_tokens`), reject non-default `temperature`, and accept
// `reasoning_effort`. Older chat models (gpt-4o…) take `temperature` instead.
function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o\d)/.test(model);
}

/**
 * Calls OpenAI chat completions and returns the raw message content string.
 *
 * Every generation in the app funnels through here, so the shared writing voice
 * is prepended once rather than repeated in each route. It goes FIRST so each
 * caller's persona and its `Respond ONLY with a JSON object…` schema clause stay
 * last, where recency helps the model honour the shape.
 *
 * Pass `voice: false` for calls where house style is irrelevant.
 */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.4-mini';
  const reasoning = isReasoningModel(model);

  const payload: ChatMessage[] =
    opts.voice === false ? messages : [{ role: 'system', content: AI_VOICE }, ...messages];

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: payload,
      max_completion_tokens: opts.maxTokens ?? 3000,
      ...(reasoning
        ? { reasoning_effort: opts.reasoningEffort ?? 'low' }
        : { temperature: opts.temperature ?? 0.4 }),
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

/** Calls OpenAI expecting a JSON object and parses it, throwing on malformed output. */
export async function chatJSON<T>(messages: ChatMessage[], opts: Omit<ChatOptions, 'json'> = {}): Promise<T> {
  const raw = await chat(messages, { ...opts, json: true });
  return JSON.parse(raw) as T;
}
