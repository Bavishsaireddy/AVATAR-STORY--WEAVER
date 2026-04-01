import { NextRequest, NextResponse } from "next/server";
import { callGroq, type GroqMessage } from "@/lib/groqClient";
import {
  buildSystemPrompt,
  buildLlmMessages,
  CHOICES_SYSTEM_PROMPT,
  buildChoicesUserPrompt,
} from "@/lib/prompts";
import {
  choicesApiTemperature,
  parseCreativityPreference,
  serverUsesPerCallTemperatureJitter,
  withPerCallJitter,
} from "@/lib/creativityTemperature";
import type { StoryRequest, StoryChoice } from "@/types/story";

async function callLLM(system: string, messages: GroqMessage[], temp: number): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey && !groqKey.includes("your_")) {
    return await callGroq(system, messages, temp, 400);
  }

  throw new Error("NO_KEY");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: StoryRequest = await req.json();
    const { title, genre, hook, segments, characters } = body;
    const creativityPreference = parseCreativityPreference(body.creativityPreference);
    const baseChoices = choicesApiTemperature(creativityPreference);
    const temperature = withPerCallJitter(baseChoices, serverUsesPerCallTemperatureJitter());

    const storyContext = buildSystemPrompt({
      title,
      genre,
      hook,
      characters: characters ?? [],
      creativityPreference,
    });
    const fullSystem = `${storyContext}\n\n${CHOICES_SYSTEM_PROMPT}`;
    const messages = buildLlmMessages(segments ?? [], buildChoicesUserPrompt());

    const raw = await callLLM(fullSystem, messages, temperature);

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
