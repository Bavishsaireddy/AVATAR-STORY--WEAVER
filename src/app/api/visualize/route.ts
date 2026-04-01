import { NextRequest, NextResponse } from "next/server";
import { callGroq, type GroqMessage } from "@/lib/groqClient";
import { VISUALIZE_SYSTEM_PROMPT, buildVisualizeUserPrompt } from "@/lib/prompts";
import type { Character, Genre, StoryDNA } from "@/types/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function callLLM(
  system: string,
  messages: GroqMessage[],
  temp: number,
  maxTokens: number
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey && !groqKey.includes("your_")) {
    return await callGroq(system, messages, temp, maxTokens);
  }

  throw new Error("NO_KEY");
}

export async function POST(req: NextRequest) {
  let body: { text: string; genre: Genre; dna: StoryDNA | null; characters: Character[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { text, genre, dna, characters } = body;

  try {
    if (!text?.trim() || !genre) {
      return NextResponse.json({ error: "MISSING_DATA" }, { status: 400 });
    }

    const userMessage = buildVisualizeUserPrompt(text, genre, dna, characters);
    const messages = [{ role: "user" as const, content: userMessage }];

    const raw = await callLLM(VISUALIZE_SYSTEM_PROMPT, messages, 0.6, 150);

    const promptText = raw.replace(/```(txt|text)?\n?/g, "").replace(/```\n?/g, "").trim();

    return NextResponse.json({ prompt: promptText });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("RATE_LIMIT")) {
      const seconds = msg.split(":")[1] ?? "30";
      return NextResponse.json({ error: "RATE_LIMIT", retryAfter: Number(seconds) }, { status: 429 });
    }
    if (msg === "INVALID_KEY") {
      return NextResponse.json({ error: "INVALID_KEY" }, { status: 401 });
    }
    console.error("[api/visualize]", msg);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
