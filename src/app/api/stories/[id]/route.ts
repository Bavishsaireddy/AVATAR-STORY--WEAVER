import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getClientIdFromRequest, parsePersistedStoryBody } from "@/lib/storyPersistenceServer";
import type {
  Character,
  CreativityPreference,
  Genre,
  StoryChoice,
  StoryDNA,
  StoryPhase,
  StorySegment,
} from "@/types/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "NO_DATABASE" }, { status: 503 });
  }

  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    return NextResponse.json({ error: "NO_CLIENT_ID" }, { status: 400 });
  }

  const { id } = await ctx.params;
  let row;
  try {
    row = await prisma.savedStory.findFirst({
      where: { id, clientId },
    });
  } catch (e) {
    console.error("[api/stories/[id] GET]", e);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 503 });
  }

  if (!row) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    genre: row.genre as Genre,
    hook: row.hook,
    segments: row.segments as unknown as StorySegment[],
    characters: row.characters as unknown as Character[],
    dna: row.dna as unknown as StoryDNA | null,
    creativityPreference: row.creativityPreference as CreativityPreference,
    phase: row.phase as StoryPhase,
    pendingChoices: row.pendingChoices as unknown as StoryChoice[],
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "NO_DATABASE" }, { status: 503 });
  }

  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    return NextResponse.json({ error: "NO_CLIENT_ID" }, { status: 400 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = parsePersistedStoryBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  let updated;
  try {
    updated = await prisma.savedStory.updateMany({
      where: { id, clientId },
      data: {
        title: parsed.title,
        genre: parsed.genre,
        hook: parsed.hook,
        segments: parsed.segments as unknown as Prisma.InputJsonValue,
        characters: parsed.characters as unknown as Prisma.InputJsonValue,
        dna: parsed.dna === null ? Prisma.JsonNull : (parsed.dna as unknown as Prisma.InputJsonValue),
        creativityPreference: parsed.creativityPreference,
        phase: parsed.phase,
        pendingChoices: parsed.pendingChoices as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.error("[api/stories/[id] PATCH]", e);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 503 });
  }

  if (updated.count === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "NO_DATABASE" }, { status: 503 });
  }

  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    return NextResponse.json({ error: "NO_CLIENT_ID" }, { status: 400 });
  }

  const { id } = await ctx.params;
  let del;
  try {
    del = await prisma.savedStory.deleteMany({
      where: { id, clientId },
    });
  } catch (e) {
    console.error("[api/stories/[id] DELETE]", e);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 503 });
  }

  if (del.count === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
