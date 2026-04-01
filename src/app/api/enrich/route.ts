import { NextRequest, NextResponse } from "next/server";
import { callGroq, type GroqMessage } from "@/lib/groqClient";
import { ENRICH_SIDEBAR_SYSTEM_PROMPT, buildEnrichSidebarUserPrompt } from "@/lib/prompts";
import type { EnrichSidebarRequest, StoryDNA, Character } from "@/types/story";
import { normalizeCharacters, normalizeDna } from "@/lib/normalize";

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let saved: EnrichSidebarRequest;
  try {
    saved = (await req.json()) as EnrichSidebarRequest;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const { characters, dna, newText, genre } = saved;
  const prevCharacters = characters ?? [];
  const prevDna = dna ?? null;

  try {
    if (!newText?.trim() || !genre) {
      return NextResponse.json({ characters: prevCharacters, dna: prevDna });
    }

    const userMessage = buildEnrichSidebarUserPrompt(prevCharacters, prevDna, newText, genre);
    const messages = [{ role: "user" as const, content: userMessage }];

    const raw = await callLLM(ENRICH_SIDEBAR_SYSTEM_PROMPT, messages, 0.25, 2048);

    let parsed: { characters?: unknown; dna?: unknown };
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      const slice = first >= 0 && last > first ? cleaned.slice(first, last + 1) : cleaned;
      parsed = JSON.parse(slice);
    } catch {
      return NextResponse.json({ characters: prevCharacters, dna: prevDna });
    }

    const nextCharacters = normalizeCharacters(parsed.characters, prevCharacters);
    const nextDna = normalizeDna(parsed.dna as Partial<StoryDNA>, prevDna);

    return NextResponse.json({
      characters: nextCharacters,
      dna: nextDna ?? prevDna,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("RATE_LIMIT")) {
      const seconds = msg.split(":")[1] ?? "30";
      return NextResponse.json({ error: "RATE_LIMIT", retryAfter: Number(seconds) }, { status: 429 });
    }
    if (msg === "INVALID_KEY") {
      return NextResponse.json({ error: "INVALID_KEY" }, { status: 401 });
    }
    console.error("[api/enrich]", msg);
    return NextResponse.json({ characters: prevCharacters, dna: prevDna });
  }
}
