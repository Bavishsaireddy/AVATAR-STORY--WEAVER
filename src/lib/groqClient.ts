import { acquireLlmSlot, releaseLlmSlot, withLlmSlot } from "@/lib/llmThrottle";

export type GroqMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function callGroq(
  systemPrompt: string,
  messages: GroqMessage[],
  temperature: number,
  maxTokens: number = 700
): Promise<string> {
  return withLlmSlot(async () => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      throw new Error(`RATE_LIMIT:${retryAfter ?? "30"}`);
    }
    if (res.status === 401) throw new Error("INVALID_KEY");
    if (!res.ok) {
      const body = await res.text();
      console.error("Groq API error:", res.status, body);
      throw new Error("API_ERROR");
    }

    const data = await res.json();
    return data.choices[0].message.content as string;
  });
}

export async function streamGroq(
  systemPrompt: string,
  messages: GroqMessage[],
  temperature: number,
  maxTokens: number = 700
): Promise<Response> {
  await acquireLlmSlot();
  let released = false;
  const releaseOnce = () => {
    if (released) return;
    released = true;
    releaseLlmSlot();
  };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (res.status === 429) {
      const retryAfter = res.headers.get("retry-after");
      releaseOnce();
      throw new Error(`RATE_LIMIT:${retryAfter ?? "30"}`);
    }
    if (res.status === 401) {
      releaseOnce();
      throw new Error("INVALID_KEY");
    }
    if (!res.ok || !res.body) {
      releaseOnce();
      throw new Error("API_ERROR");
    }

    const encoder = new TextEncoder();
    const upstream = res.body;

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
                const text = parsed.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // Skip malformed lines
              }
            }
          }
        } finally {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          releaseOnce();
        }
      },
      cancel() {
        releaseOnce();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    if (!released) releaseOnce();
    throw e;
  }
}
