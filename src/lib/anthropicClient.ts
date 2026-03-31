export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string;
};

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";

function buildHeaders() {
  return {
    "x-api-key": process.env.ANTHROPIC_API_KEY!,
    "anthropic-version": "2023-06-01",
    "Content-Type": "application/json",
  };
}

function buildBody(
  systemPrompt: string,
  messages: AnthropicMessage[],
  temperature: number,
  maxTokens: number,
  stream: boolean
) {
  return JSON.stringify({
      model: "claude-3-sonnet-20240229",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages,
    stream,
  });
}

// ─── Non-streaming call (for choices, characters, DNA) ───────────────────────

export async function callClaude(
  systemPrompt: string,
  messages: AnthropicMessage[],
  temperature: number,
  maxTokens: number = 700
): Promise<string> {
  const res = await fetch(ANTHROPIC_BASE, {
    method: "POST",
    headers: buildHeaders(),
    body: buildBody(systemPrompt, messages, temperature, maxTokens, false),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    throw new Error(`RATE_LIMIT:${retryAfter ?? "30"}`);
  }
  if (res.status === 401) throw new Error("INVALID_KEY");
  if (!res.ok) {
    const body = await res.text();
    console.error("Anthropic API error:", res.status, body);
    throw new Error("API_ERROR");
  }

  const data = await res.json();
  return data.content[0].text as string;
}

// ─── Streaming call (for story continuations — typewriter effect) ─────────────
// Returns a Response with a ReadableStream of raw text chunks.

export async function streamClaude(
  systemPrompt: string,
  messages: AnthropicMessage[],
  temperature: number,
  maxTokens: number = 700
): Promise<Response> {
  const res = await fetch(ANTHROPIC_BASE, {
    method: "POST",
    headers: buildHeaders(),
    body: buildBody(systemPrompt, messages, temperature, maxTokens, true),
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    throw new Error(`RATE_LIMIT:${retryAfter ?? "30"}`);
  }
  if (res.status === 401) throw new Error("INVALID_KEY");
  if (!res.ok || !res.body) {
    const errBody = await res.text().catch(() => "unreadable");
    console.error(`Anthropic stream error ${res.status}:`, errBody);
    throw new Error("API_ERROR");
  }

  const encoder = new TextEncoder();
  const upstream = res.body;

  // Parse Anthropic SSE format and stream only the text delta chunks to the client
  const readable = new ReadableStream({
    async start(controller) {
      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.type === "text_delta" &&
                parsed.delta.text
              ) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // Skip malformed JSON — normal at SSE boundaries
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
