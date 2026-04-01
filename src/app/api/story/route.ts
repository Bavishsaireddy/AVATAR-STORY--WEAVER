import { NextRequest, NextResponse } from "next/server";
import { streamGroq } from "@/lib/groqClient";
import {
  buildSystemPrompt,
  buildContinuationUserMessage,
  buildLlmMessages,
  buildRemixSystemPrompt,
  buildRemixUserMessage,
} from "@/lib/prompts";
import { htmlToPlainText } from "@/lib/htmlToPlainText";
import { analyzeTextToxicity } from "@/lib/toxicityClassifier";
import { formatToxicityUserMessage } from "@/lib/toxicityMessages";
import {
  parseCreativityPreference,
  serverUsesPerCallTemperatureJitter,
  storyApiTemperature,
  withPerCallJitter,
} from "@/lib/creativityTemperature";
import type { Genre, StoryRequest } from "@/types/story";

const GENRES = new Set<Genre>(["Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror", "Comedy"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: StoryRequest = await req.json();
    const { title, genre, hook, segments, characters, userInput, mode, choiceDescription, remixTargetGenre } =
      body;

    if (!title || !genre || !hook) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const resolvedMode = mode ?? "continue";

    if (resolvedMode === "remix") {
      if (!remixTargetGenre || !GENRES.has(remixTargetGenre)) {
        return NextResponse.json(
          { error: "INVALID_REMIX", message: "Choose a valid target genre for the remix." },
          { status: 400 }
        );
      }
      if (remixTargetGenre === genre) {
        return NextResponse.json(
          {
            error: "INVALID_REMIX",
            message: "Pick a different genre than your story’s genre — that’s what makes it a remix.",
          },
          { status: 400 }
        );
      }
      const hasAiBeat = (segments ?? []).some(
        (s) => s.role === "ai" && htmlToPlainText(s.text).trim().length >= 16
      );
      if (!hasAiBeat) {
        return NextResponse.json(
          { error: "INVALID_REMIX", message: "Need at least one AI paragraph to remix." },
          { status: 400 }
        );
      }
    }

    if (resolvedMode === "start") {
      const plainHook = htmlToPlainText(hook).trim();
      if (plainHook.length >= 8) {
        const tox = await analyzeTextToxicity(plainHook);
        if (tox.flagged) {
          return NextResponse.json(
            {
              error: "TOXICITY",
              message: formatToxicityUserMessage(tox.topLabel, tox.maxScore, tox.threshold),
            },
            { status: 400 }
          );
        }
      }
    }

    if (userInput) {
      const plain = htmlToPlainText(userInput).trim();
      if (plain.length >= 8) {
        const tox = await analyzeTextToxicity(plain);
        if (tox.flagged) {
          return NextResponse.json(
            {
              error: "TOXICITY",
              message: formatToxicityUserMessage(tox.topLabel, tox.maxScore, tox.threshold),
            },
            { status: 400 }
          );
        }
      }
    }

    if (choiceDescription?.trim()) {
      const plain = choiceDescription.trim();
      if (plain.length >= 8) {
        const tox = await analyzeTextToxicity(plain);
        if (tox.flagged) {
          return NextResponse.json(
            {
              error: "TOXICITY",
              message: formatToxicityUserMessage(tox.topLabel, tox.maxScore, tox.threshold),
            },
            { status: 400 }
          );
        }
      }
    }

    const creativityPreference = parseCreativityPreference(body.creativityPreference);
    const baseTemp = storyApiTemperature(creativityPreference, resolvedMode);
    let temperature = withPerCallJitter(baseTemp, serverUsesPerCallTemperatureJitter());
    if (resolvedMode === "conclude") {
      temperature = Math.min(0.7, temperature);
    }
    if (resolvedMode === "remix") {
      temperature = Math.min(0.92, temperature + 0.08);
    }

    const systemPrompt =
      resolvedMode === "remix" && remixTargetGenre
        ? buildRemixSystemPrompt({
            title,
            storyGenre: genre,
            targetGenre: remixTargetGenre,
            hook,
            characters: characters ?? [],
          })
        : buildSystemPrompt({
            title,
            genre,
            hook,
            characters: characters ?? [],
            creativityPreference,
          });

    const startHookPlain =
      resolvedMode === "start" ? htmlToPlainText(hook).trim() : "";

    const userMessage =
      resolvedMode === "remix" && remixTargetGenre
        ? buildRemixUserMessage(remixTargetGenre)
        : buildContinuationUserMessage(resolvedMode, userInput, choiceDescription, {
            startFromHookPlain: resolvedMode === "start" ? startHookPlain : undefined,
          });

    const messages = buildLlmMessages(segments ?? [], userMessage);

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey && !groqKey.includes("your_")) {
      return await streamGroq(systemPrompt, messages, temperature, 700);
    }

    return NextResponse.json(
      { error: "NO_KEY", message: "Add GROQ_API_KEY to .env" },
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
