import { NextRequest, NextResponse } from "next/server";
import { callGroq, type GroqMessage } from "@/lib/groqClient";
import { DNA_SYSTEM_PROMPT, buildDNAUserPrompt } from "@/lib/prompts";
import type { DNARequest, StoryDNA } from "@/types/story";

async function callLLM(
  system: string,
  messages: GroqMessage[],
  temp: number,
  maxTokens = 400
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey && !groqKey.includes("your_")) {
    return await callGroq(system, messages, temp, maxTokens);
  }

  throw new Error("NO_KEY");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: DNARequest = await req.json();
    const { dna, newText, genre } = body;

    const userMessage = buildDNAUserPrompt(dna, newText, genre);
    const messages = [{ role: "user" as const, content: userMessage }];

    const raw = await callLLM(DNA_SYSTEM_PROMPT, messages, 0.3, 560);

    let parsed: StoryDNA;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed.mysteries) || !Array.isArray(parsed.worldRules)) {
        throw new Error("Invalid DNA structure");
      }
    } catch {
      return NextResponse.json({ dna: dna ?? null });
    }

    const tl =
      typeof parsed.tensionLevel === "number" && Number.isFinite(parsed.tensionLevel)
        ? Math.min(10, Math.max(1, Math.round(parsed.tensionLevel)))
        : 5;

    const updatedDNA: StoryDNA = {
      mysteries: parsed.mysteries,
      worldRules: parsed.worldRules,
      tensionLevel: tl,
      tensionDescription:
        typeof parsed.tensionDescription === "string" ? parsed.tensionDescription : "",
      runningSummary:
        typeof parsed.runningSummary === "string" && parsed.runningSummary.trim()
          ? parsed.runningSummary.trim()
          : (dna?.runningSummary?.trim() ?? ""),
    };

    return NextResponse.json({ dna: updatedDNA });
  } catch {
    return NextResponse.json({ dna: null });
  }
}
