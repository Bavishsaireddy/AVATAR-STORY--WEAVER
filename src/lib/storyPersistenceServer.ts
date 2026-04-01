import type {
  Character,
  CreativityPreference,
  Genre,
  StoryChoice,
  StoryDNA,
  StoryPhase,
  StorySegment,
} from "@/types/story";

const GENRES = new Set<Genre>(["Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror", "Comedy"]);
const PREFS = new Set<CreativityPreference>(["precise", "balanced", "creative", "chaotic"]);
const PHASES = new Set<StoryPhase>(["setup", "writing", "concluded"]);

export interface PersistedStoryBody {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  characters: Character[];
  dna: StoryDNA | null;
  creativityPreference: CreativityPreference;
  phase: StoryPhase;
  pendingChoices: StoryChoice[];
}

export function parsePersistedStoryBody(raw: unknown): PersistedStoryBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim().slice(0, 200) : "";
  const genre = o.genre;
  const hook = typeof o.hook === "string" ? o.hook : "";
  if (!title || !GENRES.has(genre as Genre)) return null;

  const creativityPreference = o.creativityPreference;
  if (!PREFS.has(creativityPreference as CreativityPreference)) return null;

  const phase = o.phase;
  if (!PHASES.has(phase as StoryPhase)) return null;

  const segments = Array.isArray(o.segments) ? (o.segments as StorySegment[]) : [];
  const characters = Array.isArray(o.characters) ? (o.characters as Character[]) : [];
  const pendingChoices = Array.isArray(o.pendingChoices) ? (o.pendingChoices as StoryChoice[]) : [];
  let dna: StoryDNA | null = null;
  if (o.dna && typeof o.dna === "object") {
    const d = o.dna as Record<string, unknown>;
    dna = {
      mysteries: Array.isArray(d.mysteries) ? d.mysteries.map(String) : [],
      worldRules: Array.isArray(d.worldRules) ? d.worldRules.map(String) : [],
      tensionLevel:
        typeof d.tensionLevel === "number" && Number.isFinite(d.tensionLevel)
          ? Math.min(10, Math.max(1, Math.round(d.tensionLevel)))
          : 5,
      tensionDescription: typeof d.tensionDescription === "string" ? d.tensionDescription : "",
      runningSummary: typeof d.runningSummary === "string" ? d.runningSummary : "",
    };
  }

  return {
    title,
    genre: genre as Genre,
    hook,
    segments,
    characters,
    dna,
    creativityPreference: creativityPreference as CreativityPreference,
    phase: phase as StoryPhase,
    pendingChoices,
  };
}

export function getClientIdFromRequest(req: Request): string | null {
  const h = req.headers.get("x-story-client-id");
  if (typeof h === "string" && /^[a-zA-Z0-9-]{8,128}$/.test(h.trim())) {
    return h.trim();
  }
  return null;
}
