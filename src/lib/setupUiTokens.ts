import type { Genre } from "@/types/story";

/** `#RRGGBB` → `rgba(r,g,b,a)` for interactive fills / glows */
export function accentAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Inline-style tokens for the setup screen (light shell + genre cards).
 * Story view uses Tailwind `GENRE_THEMES` (also light / white base).
 */
export interface SetupGenreTokens {
  label: string;
  accent: string;
  accentMuted: string;
  fontDisplay: string;
  fontBody: string;
}

export interface SetupPageTokens extends SetupGenreTokens {
  gradientFrom: string;
  gradientTo: string;
  text: string;
  textMuted: string;
  surface: string;
  border: string;
  bg: string;
}

const display = "Georgia, 'Times New Roman', serif";
const body = "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif";

export const SETUP_UI: Record<Genre, SetupPageTokens> = {
  Fantasy: {
    label: "Fantasy",
    accent: "#d97706",
    accentMuted: "#b45309",
    fontDisplay: display,
    fontBody: body,
    gradientFrom: "#ffffff",
    gradientTo: "#fafaf9",
    text: "#18181b",
    textMuted: "rgba(113, 63, 18, 0.55)",
    surface: "rgba(255, 251, 235, 0.95)",
    border: "rgba(245, 158, 11, 0.35)",
    bg: "#ffffff",
  },
  "Sci-Fi": {
    label: "Sci-Fi",
    accent: "#0891b2",
    accentMuted: "#0e7490",
    fontDisplay: "'SF Mono', ui-monospace, monospace",
    fontBody: body,
    gradientFrom: "#ffffff",
    gradientTo: "#f8fafc",
    text: "#18181b",
    textMuted: "rgba(14, 116, 144, 0.55)",
    surface: "rgba(236, 254, 255, 0.95)",
    border: "rgba(6, 182, 212, 0.35)",
    bg: "#ffffff",
  },
  Mystery: {
    label: "Mystery",
    accent: "#ca8a04",
    accentMuted: "#a16207",
    fontDisplay: display,
    fontBody: body,
    gradientFrom: "#ffffff",
    gradientTo: "#fafaf9",
    text: "#18181b",
    textMuted: "rgba(161, 98, 7, 0.55)",
    surface: "rgba(254, 252, 232, 0.95)",
    border: "rgba(234, 179, 8, 0.4)",
    bg: "#ffffff",
  },
  Romance: {
    label: "Romance",
    accent: "#db2777",
    accentMuted: "#be185d",
    fontDisplay: display,
    fontBody: body,
    gradientFrom: "#ffffff",
    gradientTo: "#fdf2f8",
    text: "#18181b",
    textMuted: "rgba(190, 24, 93, 0.5)",
    surface: "rgba(252, 231, 243, 0.95)",
    border: "rgba(236, 72, 153, 0.35)",
    bg: "#ffffff",
  },
  Horror: {
    label: "Horror",
    accent: "#dc2626",
    accentMuted: "#991b1b",
    fontDisplay: display,
    fontBody: body,
    gradientFrom: "#ffffff",
    gradientTo: "#fafafa",
    text: "#18181b",
    textMuted: "rgba(153, 27, 27, 0.5)",
    surface: "rgba(254, 242, 242, 0.95)",
    border: "rgba(248, 113, 113, 0.35)",
    bg: "#ffffff",
  },
  Comedy: {
    label: "Comedy",
    accent: "#16a34a",
    accentMuted: "#15803d",
    fontDisplay: display,
    fontBody: body,
    gradientFrom: "#ffffff",
    gradientTo: "#f0fdf4",
    text: "#18181b",
    textMuted: "rgba(21, 128, 61, 0.55)",
    surface: "rgba(240, 253, 244, 0.95)",
    border: "rgba(74, 222, 128, 0.4)",
    bg: "#ffffff",
  },
};

export const SETUP_GENRES: Genre[] = ["Fantasy", "Sci-Fi", "Mystery", "Romance", "Horror", "Comedy"];
