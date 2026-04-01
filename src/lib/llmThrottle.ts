/**
 * Global throttle for outbound Anthropic / Groq calls so bursts (story + enrich + choices)
 * don't spike provider rate limits. Concurrency-only — no proxy, no local model.
 *
 * `LLM_MAX_CONCURRENT` (default 2): max in-flight LLM HTTP requests at once, including
 * streams until the upstream body is fully read (or the client aborts).
 */

const waiters: (() => void)[] = [];
let active = 0;

export function getLlmMaxConcurrent(): number {
  const raw = process.env.LLM_MAX_CONCURRENT?.trim();
  const n = raw !== undefined ? Number.parseInt(raw, 10) : 2;
  if (!Number.isFinite(n)) return 2;
  return Math.max(1, Math.min(16, n));
}

export async function acquireLlmSlot(): Promise<void> {
  const limit = getLlmMaxConcurrent();
  if (active < limit) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => {
    waiters.push(() => {
      active++;
      resolve();
    });
  });
}

export function releaseLlmSlot(): void {
  active--;
  const next = waiters.shift();
  if (next) next();
}

/** Non-streaming: hold one slot for the whole request. */
export async function withLlmSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireLlmSlot();
  try {
    return await fn();
  } finally {
    releaseLlmSlot();
  }
}
