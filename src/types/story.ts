export type Genre = "Fantasy" | "Sci-Fi" | "Mystery" | "Romance" | "Horror" | "Comedy";

/** Set once at story start; API routes map this to numeric temperature. */
export type CreativityPreference = "precise" | "balanced" | "creative" | "chaotic";

export type SegmentRole = "user" | "ai";

export type StoryPhase = "setup" | "writing" | "concluded";

export type StoryMode = "start" | "continue" | "choice" | "conclude" | "remix";

export interface StorySegment {
  id: string;
  role: SegmentRole;
  text: string;
  timestamp: number;
}

export interface Character {
  name: string;
  description: string;
}

export interface StoryChoice {
  id: number;
  title: string;
  description: string;
}

export interface StoryDNA {
  mysteries: string[];         // Unresolved plot threads / open questions
  worldRules: string[];        // Established facts about the world
  tensionLevel: number;        // 1–10
  tensionDescription: string;  // One-line summary of current emotional tension
  /** 2–4 sentences: narrative recap for the live sidebar (updated each enrichment). */
  runningSummary: string;
}

export interface StoryState {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  characters: Character[];
  dna: StoryDNA | null;
  creativityPreference: CreativityPreference;
  isLoading: boolean;
  error: string | null;
  phase: StoryPhase;
  pendingChoices: StoryChoice[];
}

/** Row summary for the saved-stories sidebar (Postgres-backed). */
export interface SavedStoryListItem {
  id: string;
  title: string;
  genre: Genre;
  phase: StoryPhase;
  updatedAt: string;
  beatCount: number;
}

export interface StoryRequest {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  characters: Character[];
  userInput?: string;
  creativityPreference: CreativityPreference;
  mode: StoryMode;
  choiceDescription?: string;
  /** Required when `mode === "remix"` — must differ from `genre`. */
  remixTargetGenre?: Genre;
}

export interface StoryResponse {
  text: string;
}

export interface ChoicesResponse {
  choices: StoryChoice[];
}

export interface CharactersRequest {
  characters: Character[];
  newText: string;
}

export interface CharactersResponse {
  characters: Character[];
}

export interface DNARequest {
  dna: StoryDNA | null;
  newText: string;
  genre: Genre;
}

export interface DNAResponse {
  dna: StoryDNA;
}

/** One LLM round-trip for characters + DNA (saves rate limit vs two calls). */
export interface EnrichSidebarRequest {
  characters: Character[];
  dna: StoryDNA | null;
  newText: string;
  genre: Genre;
}

export interface EnrichSidebarResponse {
  characters: Character[];
  dna: StoryDNA | null;
}

export interface GenreClassificationRequest {
  title?: string;
  hook?: string;
}

export interface GenreClassificationResponse {
  genre: Genre;
  scores: Record<Genre, number>;
  /** ONNX / Transformers.js checkpoint id (DistilBERT — BERT-family NLI). */
  model: string;
}

/** Toxic-comment BERT family (Detoxify-style) — ONNX in Node via Transformers.js. */
export interface ToxicityAnalysisResponse {
  flagged: boolean;
  maxScore: number;
  scores: Record<string, number>;
  topLabel: string;
  model: string;
  threshold: number;
}

// ─── Genre Theming System ────────────────────────────────────────────────────

export interface GenreTheme {
  pageBg: string;
  panelBg: string;
  panelBorder: string;
  headerBg: string;

  storyFont: string;   // Tailwind font class applied to story prose
  storyText: string;   // Story prose text color

  accentText: string;
  accentBg: string;
  accentBorder: string;
  /** High-contrast chips for in-text keyword highlights (summary, choices). */
  keywordHighlight: string;

  inputBg: string;
  inputBorder: string;

  primaryBtn: string;
  choiceCardBase: string;
  choiceCardHover: string;

  labelText: string;    // Muted label/meta text color
  mutedText: string;    // Even more muted

  divider: string;      // Border color for dividers

  glowStyle: string;    // Inline style string for radial glow
}

export const GENRE_THEMES: Record<Genre, GenreTheme> = {
  Fantasy: {
    pageBg: "bg-white",
    panelBg: "bg-white",
    panelBorder: "border-zinc-200",
    headerBg: "bg-white/95",
    storyFont: "font-serif",
    storyText: "text-zinc-900",
    accentText: "text-amber-800",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-300",
    keywordHighlight:
      "rounded px-1 py-0.5 font-semibold text-amber-950 bg-amber-200 border border-amber-300/60",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    primaryBtn: "bg-amber-600 text-white hover:bg-amber-500 active:bg-amber-700",
    choiceCardBase: "bg-white border-amber-200 text-zinc-900",
    choiceCardHover: "hover:border-amber-400 hover:bg-amber-50/90",
    labelText: "text-zinc-500",
    mutedText: "text-zinc-400",
    divider: "border-zinc-200",
    glowStyle: "radial-gradient(ellipse at top, rgba(245,158,11,0.07) 0%, transparent 55%)",
  },

  "Sci-Fi": {
    pageBg: "bg-white",
    panelBg: "bg-white",
    panelBorder: "border-zinc-200",
    headerBg: "bg-white/95",
    storyFont: "font-mono",
    storyText: "text-zinc-900",
    accentText: "text-cyan-800",
    accentBg: "bg-cyan-50",
    accentBorder: "border-cyan-300",
    keywordHighlight:
      "rounded px-1 py-0.5 font-semibold text-cyan-950 bg-cyan-200 border border-cyan-300/60",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    primaryBtn: "bg-cyan-600 text-white hover:bg-cyan-500 active:bg-cyan-700",
    choiceCardBase: "bg-white border-cyan-200 text-zinc-900",
    choiceCardHover: "hover:border-cyan-400 hover:bg-cyan-50/90",
    labelText: "text-zinc-500",
    mutedText: "text-zinc-400",
    divider: "border-zinc-200",
    glowStyle: "radial-gradient(ellipse at top, rgba(6,182,212,0.07) 0%, transparent 55%)",
  },

  Mystery: {
    pageBg: "bg-white",
    panelBg: "bg-white",
    panelBorder: "border-zinc-200",
    headerBg: "bg-white/95",
    storyFont: "font-serif",
    storyText: "text-zinc-900",
    accentText: "text-yellow-800",
    accentBg: "bg-yellow-50",
    accentBorder: "border-yellow-400",
    keywordHighlight:
      "rounded px-1 py-0.5 font-bold text-yellow-950 bg-yellow-200 border border-yellow-400/70",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    primaryBtn: "bg-yellow-600 text-white hover:bg-yellow-500 active:bg-yellow-700",
    choiceCardBase: "bg-white border-yellow-300 text-zinc-900",
    choiceCardHover: "hover:border-yellow-500 hover:bg-yellow-50/90",
    labelText: "text-zinc-500",
    mutedText: "text-zinc-400",
    divider: "border-zinc-200",
    glowStyle: "radial-gradient(ellipse at top, rgba(234,179,8,0.08) 0%, transparent 55%)",
  },

  Romance: {
    pageBg: "bg-white",
    panelBg: "bg-white",
    panelBorder: "border-zinc-200",
    headerBg: "bg-white/95",
    storyFont: "font-serif",
    storyText: "text-zinc-900",
    accentText: "text-pink-800",
    accentBg: "bg-pink-50",
    accentBorder: "border-pink-300",
    keywordHighlight:
      "rounded px-1 py-0.5 font-semibold text-pink-950 bg-pink-200 border border-pink-300/60",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    primaryBtn: "bg-pink-600 text-white hover:bg-pink-500 active:bg-pink-700",
    choiceCardBase: "bg-white border-pink-200 text-zinc-900",
    choiceCardHover: "hover:border-pink-400 hover:bg-pink-50/90",
    labelText: "text-zinc-500",
    mutedText: "text-zinc-400",
    divider: "border-zinc-200",
    glowStyle: "radial-gradient(ellipse at top, rgba(236,72,153,0.07) 0%, transparent 55%)",
  },

  Horror: {
    pageBg: "bg-white",
    panelBg: "bg-white",
    panelBorder: "border-zinc-200",
    headerBg: "bg-white/95",
    storyFont: "font-serif",
    storyText: "text-zinc-900",
    accentText: "text-red-800",
    accentBg: "bg-red-50",
    accentBorder: "border-red-300",
    keywordHighlight:
      "rounded px-1 py-0.5 font-semibold text-red-950 bg-red-200 border border-red-300/60",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    primaryBtn: "bg-red-700 text-white hover:bg-red-600 active:bg-red-800",
    choiceCardBase: "bg-white border-red-200 text-zinc-900",
    choiceCardHover: "hover:border-red-400 hover:bg-red-50/90",
    labelText: "text-zinc-500",
    mutedText: "text-zinc-400",
    divider: "border-zinc-200",
    glowStyle: "radial-gradient(ellipse at top, rgba(239,68,68,0.06) 0%, transparent 55%)",
  },

  Comedy: {
    pageBg: "bg-white",
    panelBg: "bg-white",
    panelBorder: "border-zinc-200",
    headerBg: "bg-white/95",
    storyFont: "font-serif",
    storyText: "text-zinc-900",
    accentText: "text-green-800",
    accentBg: "bg-green-50",
    accentBorder: "border-green-300",
    keywordHighlight:
      "rounded px-1 py-0.5 font-semibold text-green-950 bg-green-200 border border-green-300/60",
    inputBg: "bg-white",
    inputBorder: "border-zinc-300",
    primaryBtn: "bg-green-600 text-white hover:bg-green-500 active:bg-green-700",
    choiceCardBase: "bg-white border-green-200 text-zinc-900",
    choiceCardHover: "hover:border-green-400 hover:bg-green-50/90",
    labelText: "text-zinc-500",
    mutedText: "text-zinc-400",
    divider: "border-zinc-200",
    glowStyle: "radial-gradient(ellipse at top, rgba(34,197,94,0.07) 0%, transparent 55%)",
  },
};

export const GENRE_EMOJIS: Record<Genre, string> = {
  Fantasy:  "🔮",
  "Sci-Fi": "🚀",
  Mystery:  "🔍",
  Romance:  "💕",
  Horror:   "👁️",
  Comedy:   "😄",
};

const GENRE_SET = new Set<Genre>(["Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror", "Comedy"]);

/** Runtime-safe genre for theming (avoids crash when DB/API sends an unknown string). */
export function coerceGenre(value: unknown): Genre {
  if (typeof value === "string" && GENRE_SET.has(value as Genre)) {
    return value as Genre;
  }
  return "Fantasy";
}

// Kept for backwards compatibility in any remaining code
export const GENRE_COLORS: Record<Genre, { bg: string; text: string; border: string; accent: string }> = {
  Fantasy:  { bg: "bg-amber-50",  text: "text-amber-800",  border: "border-amber-300",  accent: "#d97706" },
  "Sci-Fi": { bg: "bg-cyan-50",   text: "text-cyan-800",   border: "border-cyan-300",   accent: "#0891b2" },
  Mystery:  { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-400", accent: "#ca8a04" },
  Romance:  { bg: "bg-pink-50",   text: "text-pink-800",   border: "border-pink-300",   accent: "#db2777" },
  Horror:   { bg: "bg-red-50",    text: "text-red-800",    border: "border-red-300",    accent: "#dc2626" },
  Comedy:   { bg: "bg-green-50",  text: "text-green-800",  border: "border-green-300",  accent: "#16a34a" },
};
