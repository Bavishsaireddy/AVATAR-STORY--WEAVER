export type Genre = "Fantasy" | "Sci-Fi" | "Mystery" | "Romance" | "Horror" | "Comedy";

export type SegmentRole = "user" | "ai";

export type StoryPhase = "setup" | "writing" | "concluded";

export type StoryMode = "start" | "continue" | "choice" | "conclude";

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
}

export interface StoryState {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  characters: Character[];
  dna: StoryDNA | null;
  temperature: number;
  isLoading: boolean;
  error: string | null;
  phase: StoryPhase;
  pendingChoices: StoryChoice[];
}

export interface StoryRequest {
  title: string;
  genre: Genre;
  hook: string;
  segments: StorySegment[];
  characters: Character[];
  userInput?: string;
  temperature: number;
  mode: StoryMode;
  choiceDescription?: string;
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
    pageBg: "bg-[#0c0a06]",
    panelBg: "bg-amber-950/25",
    panelBorder: "border-amber-800/30",
    headerBg: "bg-[#0c0a06]/90",
    storyFont: "font-serif",
    storyText: "text-amber-50",
    accentText: "text-amber-400",
    accentBg: "bg-amber-950/40",
    accentBorder: "border-amber-600/40",
    inputBg: "bg-amber-950/20",
    inputBorder: "border-amber-800/40",
    primaryBtn: "bg-amber-400 text-stone-900 hover:bg-amber-300 active:bg-amber-500",
    choiceCardBase: "bg-amber-950/30 border-amber-700/40 text-amber-50",
    choiceCardHover: "hover:border-amber-500 hover:bg-amber-900/30",
    labelText: "text-amber-400/70",
    mutedText: "text-amber-900/60",
    divider: "border-amber-900/30",
    glowStyle: "radial-gradient(ellipse at top, rgba(120,53,15,0.2) 0%, transparent 60%)",
  },

  "Sci-Fi": {
    pageBg: "bg-[#020c0e]",
    panelBg: "bg-cyan-950/25",
    panelBorder: "border-cyan-800/30",
    headerBg: "bg-[#020c0e]/90",
    storyFont: "font-mono",
    storyText: "text-cyan-50",
    accentText: "text-cyan-400",
    accentBg: "bg-cyan-950/40",
    accentBorder: "border-cyan-600/40",
    inputBg: "bg-cyan-950/20",
    inputBorder: "border-cyan-800/40",
    primaryBtn: "bg-cyan-400 text-slate-900 hover:bg-cyan-300 active:bg-cyan-500",
    choiceCardBase: "bg-cyan-950/30 border-cyan-700/40 text-cyan-50",
    choiceCardHover: "hover:border-cyan-500 hover:bg-cyan-900/30",
    labelText: "text-cyan-400/70",
    mutedText: "text-cyan-900/60",
    divider: "border-cyan-900/30",
    glowStyle: "radial-gradient(ellipse at top, rgba(8,145,178,0.15) 0%, transparent 60%)",
  },

  Mystery: {
    pageBg: "bg-[#07060a]",
    panelBg: "bg-yellow-950/20",
    panelBorder: "border-yellow-900/30",
    headerBg: "bg-[#07060a]/90",
    storyFont: "font-serif",
    storyText: "text-yellow-50",
    accentText: "text-yellow-500",
    accentBg: "bg-yellow-950/40",
    accentBorder: "border-yellow-700/40",
    inputBg: "bg-yellow-950/20",
    inputBorder: "border-yellow-900/40",
    primaryBtn: "bg-yellow-600 text-black hover:bg-yellow-500 active:bg-yellow-700",
    choiceCardBase: "bg-yellow-950/30 border-yellow-800/40 text-yellow-50",
    choiceCardHover: "hover:border-yellow-600 hover:bg-yellow-900/20",
    labelText: "text-yellow-600/70",
    mutedText: "text-yellow-950/60",
    divider: "border-yellow-950/40",
    glowStyle: "radial-gradient(ellipse at top, rgba(113,63,18,0.15) 0%, transparent 60%)",
  },

  Romance: {
    pageBg: "bg-[#0d0408]",
    panelBg: "bg-pink-950/25",
    panelBorder: "border-pink-800/30",
    headerBg: "bg-[#0d0408]/90",
    storyFont: "font-serif",
    storyText: "text-pink-50",
    accentText: "text-pink-400",
    accentBg: "bg-pink-950/40",
    accentBorder: "border-pink-600/40",
    inputBg: "bg-pink-950/20",
    inputBorder: "border-pink-800/40",
    primaryBtn: "bg-pink-400 text-white hover:bg-pink-300 active:bg-pink-500",
    choiceCardBase: "bg-pink-950/30 border-pink-700/40 text-pink-50",
    choiceCardHover: "hover:border-pink-500 hover:bg-pink-900/30",
    labelText: "text-pink-400/70",
    mutedText: "text-pink-950/60",
    divider: "border-pink-900/30",
    glowStyle: "radial-gradient(ellipse at top, rgba(131,24,67,0.2) 0%, transparent 60%)",
  },

  Horror: {
    pageBg: "bg-[#050505]",
    panelBg: "bg-red-950/15",
    panelBorder: "border-red-900/25",
    headerBg: "bg-[#050505]/95",
    storyFont: "font-serif",
    storyText: "text-slate-300",
    accentText: "text-red-500",
    accentBg: "bg-red-950/30",
    accentBorder: "border-red-800/30",
    inputBg: "bg-red-950/10",
    inputBorder: "border-red-900/30",
    primaryBtn: "bg-red-700 text-white hover:bg-red-600 active:bg-red-800",
    choiceCardBase: "bg-red-950/20 border-red-800/30 text-slate-200",
    choiceCardHover: "hover:border-red-600 hover:bg-red-950/30",
    labelText: "text-red-500/70",
    mutedText: "text-red-950/50",
    divider: "border-red-950/30",
    glowStyle: "radial-gradient(ellipse at top, rgba(127,29,29,0.15) 0%, transparent 60%)",
  },

  Comedy: {
    pageBg: "bg-[#050e05]",
    panelBg: "bg-green-950/25",
    panelBorder: "border-green-800/30",
    headerBg: "bg-[#050e05]/90",
    storyFont: "font-serif",
    storyText: "text-green-50",
    accentText: "text-green-400",
    accentBg: "bg-green-950/40",
    accentBorder: "border-green-600/40",
    inputBg: "bg-green-950/20",
    inputBorder: "border-green-800/40",
    primaryBtn: "bg-green-400 text-slate-900 hover:bg-green-300 active:bg-green-500",
    choiceCardBase: "bg-green-950/30 border-green-700/40 text-green-50",
    choiceCardHover: "hover:border-green-500 hover:bg-green-900/30",
    labelText: "text-green-400/70",
    mutedText: "text-green-950/60",
    divider: "border-green-900/30",
    glowStyle: "radial-gradient(ellipse at top, rgba(20,83,45,0.2) 0%, transparent 60%)",
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

// Kept for backwards compatibility in any remaining code
export const GENRE_COLORS: Record<Genre, { bg: string; text: string; border: string; accent: string }> = {
  Fantasy:  { bg: "bg-amber-950/40",  text: "text-amber-400",  border: "border-amber-600/40",  accent: "#f59e0b" },
  "Sci-Fi": { bg: "bg-cyan-950/40",   text: "text-cyan-400",   border: "border-cyan-600/40",   accent: "#06b6d4" },
  Mystery:  { bg: "bg-yellow-950/40", text: "text-yellow-500", border: "border-yellow-700/40", accent: "#eab308" },
  Romance:  { bg: "bg-pink-950/40",   text: "text-pink-400",   border: "border-pink-600/40",   accent: "#ec4899" },
  Horror:   { bg: "bg-red-950/30",    text: "text-red-500",    border: "border-red-800/30",    accent: "#ef4444" },
  Comedy:   { bg: "bg-green-950/40",  text: "text-green-400",  border: "border-green-600/40",  accent: "#22c55e" },
};
