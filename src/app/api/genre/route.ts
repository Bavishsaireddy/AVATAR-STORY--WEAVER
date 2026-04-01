import { NextResponse } from "next/server";
import { classifyGenreFromText } from "@/lib/genreClassifier";
import type { GenreClassificationRequest } from "@/types/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** First request downloads ONNX weights (~tens of MB); allow headroom on self-hosted / Docker. */
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: GenreClassificationRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : "";
  const hook = typeof body.hook === "string" ? body.hook : "";
  const combined = [title.trim(), hook.trim()].filter(Boolean).join("\n\n");

  try {
    const result = await classifyGenreFromText(combined);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes("Need at least")) {
      return NextResponse.json({ error: "TEXT_TOO_SHORT", message }, { status: 400 });
    }
    console.error("[api/genre]", message);
    return NextResponse.json(
      { error: "CLASSIFIER_FAILED", message: "Genre model failed or timed out. Try again in a moment." },
      { status: 503 }
    );
  }
}
