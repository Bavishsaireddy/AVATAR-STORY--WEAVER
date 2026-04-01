import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getClientIdFromRequest, parsePersistedStoryBody } from "@/lib/storyPersistenceServer";
import type { Genre, SavedStoryListItem, StoryPhase } from "@/types/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ stories: [] as SavedStoryListItem[], db: false });
  }

  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    return NextResponse.json({ stories: [] as SavedStoryListItem[], db: true });
  }

  try {
    const rows = await prisma.savedStory.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: {
        id: true,
        title: true,
        genre: true,
        phase: true,
        updatedAt: true,
        segments: true,
      },
    });

    const stories: SavedStoryListItem[] = rows.map((r) => {
      const segs = Array.isArray(r.segments) ? r.segments : [];
      return {
        id: r.id,
        title: r.title,
        genre: r.genre as Genre,
        phase: r.phase as StoryPhase,
        updatedAt: r.updatedAt.toISOString(),
        beatCount: segs.length,
      };
    });

    return NextResponse.json({ stories, db: true });
  } catch (e) {
    console.error("[api/stories GET]", e);
    return NextResponse.json({ stories: [] as SavedStoryListItem[], db: true, dbError: true });
  }
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "NO_DATABASE", message: "Set DATABASE_URL to enable saving." }, { status: 503 });
  }

  const clientId = getClientIdFromRequest(req);
  if (!clientId) {
    return NextResponse.json({ error: "NO_CLIENT_ID" }, { status: 400 });
  }

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

  try {
    const row = await prisma.savedStory.create({
      data: {
        clientId,
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

    return NextResponse.json({ id: row.id });
  } catch (e) {
    console.error("[api/stories POST]", e);
    return NextResponse.json({ error: "DB_WRITE_FAILED", message: "Could not save story to the database." }, { status: 503 });
  }
}
