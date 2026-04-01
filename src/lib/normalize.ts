import type { StoryDNA, Character } from "@/types/story";

export function normalizeDna(d: Partial<StoryDNA> | undefined, fallback: StoryDNA | null): StoryDNA | null {
  if (!d || typeof d !== "object") {
    return fallback;
  }
  /** Models often omit or mistype arrays — merge with fallback instead of dropping the whole DNA block. */
  const mysteries = Array.isArray(d.mysteries)
    ? d.mysteries.filter((x): x is string => typeof x === "string")
    : (fallback?.mysteries ?? []);
  const worldRules = Array.isArray(d.worldRules)
    ? d.worldRules.filter((x): x is string => typeof x === "string")
    : (fallback?.worldRules ?? []);
  const tl =
    typeof d.tensionLevel === "number" && Number.isFinite(d.tensionLevel)
      ? Math.min(10, Math.max(1, Math.round(d.tensionLevel)))
      : (fallback?.tensionLevel ?? 5);
  const tensionDescription =
    typeof d.tensionDescription === "string" ? d.tensionDescription : (fallback?.tensionDescription ?? "");
  const runningSummary =
    typeof d.runningSummary === "string" && d.runningSummary.trim()
      ? d.runningSummary.trim()
      : (fallback?.runningSummary ?? "");

  return {
    mysteries,
    worldRules,
    tensionLevel: tl,
    tensionDescription,
    runningSummary,
  };
}

export function normalizeCharacters(raw: unknown, fallback: Character[]): Character[] {
  if (!Array.isArray(raw)) return fallback;
  const out: Character[] = [];
  for (const c of raw) {
    if (!c || typeof c !== "object") continue;
    const name = "name" in c && typeof (c as Character).name === "string" ? (c as Character).name.trim() : "";
    if (!name) continue;
    const description =
      "description" in c && typeof (c as Character).description === "string"
        ? (c as Character).description.trim()
        : "";
    out.push({ name, description });
  }
  return out.length > 0 ? out : fallback;
}
