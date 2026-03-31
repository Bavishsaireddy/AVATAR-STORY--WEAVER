import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropicClient";
import { callGroq } from "@/lib/groqClient";
import { DNA_SYSTEM_PROMPT, buildDNAUserPrompt } from "@/lib/prompts";
import type { DNARequest, StoryDNA } from "@/types/story";

async function callLLM(system: string, messages: { role: "user" | "assistant"; content: string }[], temp: number): Promise<string> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (anthropicKey && !anthropicKey.includes("your_")) {
    try {
      return await callClaude(system, messages, temp, 400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "RATE_LIMIT" || msg === "INVALID_KEY") throw err;
    }
  }

  if (groqKey && !groqKey.includes("your_")) {
    return await callGroq(system, messages, temp, 400);
  }

  throw new Error("NO_KEY");
}

export async function POST(req: NextRequest) {
  try {
    const body: DNARequest = await req.json();
    const { dna, newText, genre } = body;

    const userMessage = buildDNAUserPrompt(dna, newText, genre);
    const messages = [{ role: "user" as const, content: userMessage }];

    const raw = await callLLM(DNA_SYSTEM_PROMPT, messages, 0.3);

    let updatedDNA: StoryDNA;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      updatedDNA = JSON.parse(cleaned);
      if (!Array.isArray(updatedDNA.mysteries) || !Array.isArray(updatedDNA.worldRules)) {
        throw new Error("Invalid DNA structure");
      }
    } catch {
      return NextResponse.json({ dna: dna ?? null });
    }

    return NextResponse.json({ dna: updatedDNA });
  } catch {
    return NextResponse.json({ dna: null });
  }
}
