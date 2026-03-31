import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropicClient";
import { callGroq } from "@/lib/groqClient";
import { CHARACTERS_SYSTEM_PROMPT, buildCharactersUserPrompt } from "@/lib/prompts";
import type { CharactersRequest, Character } from "@/types/story";

async function callLLM(system: string, messages: { role: "user" | "assistant"; content: string }[], temp: number): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (anthropicKey && !anthropicKey.includes("your_")) {
    try {
      return await callClaude(system, messages, temp, 300);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT" || msg === "INVALID_KEY") throw err;
    }
  }

  if (groqKey && !groqKey.includes("your_")) {
    return await callGroq(system, messages, temp, 300);
  }

  throw new Error("NO_KEY");
}

export async function POST(req: NextRequest) {
  try {
    const body: CharactersRequest = await req.json();
    const { characters, newText } = body;

    const userMessage = buildCharactersUserPrompt(characters ?? [], newText);
    const messages = [{ role: "user" as const, content: userMessage }];

    const raw = await callLLM(CHARACTERS_SYSTEM_PROMPT, messages, 0.3);

    let updatedCharacters: Character[];
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      updatedCharacters = JSON.parse(cleaned).characters;
      if (!Array.isArray(updatedCharacters)) throw new Error("Invalid format");
    } catch {
      return NextResponse.json({ characters: characters ?? [] });
    }

    return NextResponse.json({ characters: updatedCharacters });
  } catch {
    return NextResponse.json({ characters: [] });
  }
}
