import { NextRequest, NextResponse } from "next/server";
import { streamClaude } from "@/lib/anthropicClient";
import { streamGroq } from "@/lib/groqClient";
import {
  buildSystemPrompt,
  buildContinuationUserMessage,
  buildAnthropicMessages,
} from "@/lib/prompts";
import type { StoryRequest } from "@/types/story";

export async function POST(req: NextRequest) {
  try {
    const body: StoryRequest = await req.json();
    const { title, genre, hook, segments, characters, userInput, temperature, mode, choiceDescription } = body;

    if (!title || !genre || !hook) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt({ title, genre, hook, characters: characters ?? [] });
    const userMessage = buildContinuationUserMessage(mode, userInput, choiceDescription);
    const messages = buildAnthropicMessages(segments ?? [], userMessage);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Try Anthropic first, auto-fallback to Groq if unavailable
    if (anthropicKey && !anthropicKey.includes("your_")) {
      try {
        return await streamClaude(systemPrompt, messages, temperature ?? 0.7, 700);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "RATE_LIMIT" || msg === "INVALID_KEY") throw err; // propagate real errors
        console.log("Anthropic unavailable, falling back to Groq...");
      }
    }

    if (groqKey && !groqKey.includes("your_")) {
      return await streamGroq(systemPrompt, messages, temperature ?? 0.7, 700);
    }

    return NextResponse.json(
      { error: "NO_KEY", message: "Add ANTHROPIC_API_KEY or GROQ_API_KEY to .env.local" },
      { status: 500 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.startsWith("RATE_LIMIT")) {
      const seconds = message.split(":")[1] ?? "30";
      return NextResponse.json({ error: "RATE_LIMIT", retryAfter: Number(seconds) }, { status: 429 });
    }
    if (message === "INVALID_KEY") {
      return NextResponse.json({ error: "INVALID_KEY" }, { status: 401 });
    }
    console.error("Story API error:", message);
    return NextResponse.json({ error: "API_ERROR" }, { status: 500 });
  }
}
