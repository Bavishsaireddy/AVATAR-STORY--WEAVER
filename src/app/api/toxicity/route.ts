import { NextResponse } from "next/server";
import { analyzeTextToxicity } from "@/lib/toxicityClassifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "EMPTY_TEXT" }, { status: 400 });
  }

  try {
    const result = await analyzeTextToxicity(text);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/toxicity]", message);
    return NextResponse.json(
      { error: "CLASSIFIER_FAILED", message: "Toxicity model unavailable. Try again shortly." },
      { status: 503 }
    );
  }
}
