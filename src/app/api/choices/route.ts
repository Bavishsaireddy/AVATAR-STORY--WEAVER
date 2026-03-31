import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropicClient";
import { callGroq } from "@/lib/groqClient";
import {
  buildSystemPrompt,
  buildAnthropicMessages,
  CHOICES_SYSTEM_PROMPT,
  buildChoicesUserPrompt,
} from "@/lib/prompts";
import type { StoryRequest, StoryChoice } from "@/types/story";

async function callLLM(system: string, messages: { role: "user" | "assistant"; content: string }[], temp: number): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (anthropicKey && !anthropicKey.includes("your_")) {
    try {
      return await callClaude(system, messages, temp, 400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT" || msg === "INVALID_KEY") throw err;
      console.log("Anthropic unavailable, falling back to Groq...");
    }
  }

  if (groqKey && !groqKey.includes("your_")) {
    return await callGroq(system, messages, temp, 400);
  }

  throw new Error("NO_KEY");
}

export async function POST(req: NextRequest) {
  try {
    const body: StoryRequest = await req.json();
    const { title, genre, hook, segments, characters, temperature } = body;

    const storyContext = buildSystemPrompt({ title, genre, hook, characters: characters ?? [] });
    const fullSystem = `${storyContext}\n\n${CHOICES_SYSTEM_PROMPT}`;
    const messages = buildAnthropicMessages(segments ?? [], buildChoicesUserPrompt());

    const raw = await callLLM(fullSystem, messages, Math.min(temperature ?? 0.9, 1.0));

    let choices: StoryChoice[];
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      choices = parsed.choices;
      if (!Array.isArray(choices) || choices.length !== 3) throw new Error("Invalid choices format");
    } catch {
      console.error("Failed to parse choices JSON:", raw);
      return NextResponse.json({ error: "PARSE_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ choices });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.startsWith("RATE_LIMIT")) {
      const seconds = message.split(":")[1] ?? "30";
      return NextResponse.json({ error: "RATE_LIMIT", retryAfter: Number(seconds) }, { status: 429 });
    }
    console.error("Choices API error:", message);
    return NextResponse.json({ error: "API_ERROR" }, { status: 500 });
  }
}
