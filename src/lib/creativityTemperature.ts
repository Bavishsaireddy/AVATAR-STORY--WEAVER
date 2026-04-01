import type { CreativityPreference, StoryMode } from "@/types/story";

export const CREATIVITY_PRESET_TEMPERATURE: Record<CreativityPreference, number> = {
  precise: 0.2,
  balanced: 0.55,
  creative: 0.85,
  chaotic: 0.95,
};

const VALID = new Set<CreativityPreference>(["precise", "balanced", "creative", "chaotic"]);

/** 0–100 for UI marker on Precise→Chaotic rail (maps preset model temperature). */
export function preferenceRailPercent(pref: CreativityPreference): number {
  const t = CREATIVITY_PRESET_TEMPERATURE[pref];
  return Math.round(((t - 0.1) / 0.9) * 100);
}

export function parseCreativityPreference(raw: unknown): CreativityPreference {
  if (typeof raw === "string" && VALID.has(raw as CreativityPreference)) {
    return raw as CreativityPreference;
  }
  return "balanced";
}

/** Story stream: `conclude` caps temperature at 0.7 for steadier endings. */
export function storyApiTemperature(pref: CreativityPreference, mode: StoryMode): number {
  const base = CREATIVITY_PRESET_TEMPERATURE[pref];
  const t = mode === "conclude" ? Math.min(base, 0.7) : base;
  return Math.round(Math.min(1, Math.max(0.1, t)) * 100) / 100;
}

/** Slightly hotter than prose for branching suggestions. */
export function choicesApiTemperature(pref: CreativityPreference): number {
  const bumped = Math.min(CREATIVITY_PRESET_TEMPERATURE[pref] + 0.1, 1);
  return Math.round(Math.min(1, Math.max(0.1, bumped)) * 100) / 100;
}

const SPREAD = 0.22;

/**
 * Server-only: **on by default** — each story/choices call jitters temperature ±0.22 around the
 * creativity preset. Set `STORY_TEMPERATURE_VARY=false` in `.env.local` to use exact presets.
 */
export function serverUsesPerCallTemperatureJitter(): boolean {
  const v = process.env.STORY_TEMPERATURE_VARY?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return true;
}

/** When `vary`, sample uniformly in `[base−spread, base+spread]` (clamped to [0.1, 1]). */
export function withPerCallJitter(base: number, vary: boolean): number {
  const b = Math.round(Math.min(1, Math.max(0.1, base)) * 100) / 100;
  if (!vary) return b;
  const lo = Math.max(0.1, b - SPREAD);
  const hi = Math.min(1, b + SPREAD);
  const t = lo + Math.random() * (hi - lo);
  return Math.round(t * 100) / 100;
}
