// Minimal server-side OpenAI Chat Completions client (no SDK dependency — a
// single fetch keeps the bundle lean and CSP-irrelevant since it runs on the
// server). Used to generate personalized, paper-grounded analysis where the
// built-in keyword heuristics produce generic/repetitive output.

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ChatOptions = {
  json?: boolean; // request a JSON object response
  temperature?: number; // only applied to non-reasoning models
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'; // reasoning models only
  maxTokens?: number; // maps to max_completion_tokens (includes reasoning tokens)
};

// GPT-5 / o-series are reasoning models: they require `max_completion_tokens`
// (not `max_tokens`), reject non-default `temperature`, and accept
// `reasoning_effort`. Older chat models (gpt-4o…) take `temperature` instead.
function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o\d)/.test(model);
}

/** Calls OpenAI chat completions and returns the raw message content string. */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.4-mini';
  const reasoning = isReasoningModel(model);

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
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
