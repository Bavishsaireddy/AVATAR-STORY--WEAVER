/**
 * ONNX `Xenova/toxic-bert` — Jigsaw / `unitary/toxic-bert` lineage (Detoxify-style models).
 * Runs in **Node** via **Transformers.js** (`@xenova/transformers`), not Python.
 *
 * `@xenova/transformers` is loaded only via dynamic `import()` so Next.js Turbopack
 * does not try to resolve a broken hashed external during the build collect phase.
 */
const MODEL_ID = "Xenova/toxic-bert";

type ToxicRow = { label: string; score: number };

let classifierLoad: Promise<(text: string, opts: { topk: number }) => Promise<ToxicRow[]>> | null = null;

async function getClassifier() {
  if (!classifierLoad) {
    classifierLoad = (async () => {
      const { env, pipeline } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      if (typeof process !== "undefined" && process.env.TRANSFORMERS_CACHE) {
        env.cacheDir = process.env.TRANSFORMERS_CACHE;
      }
      const pipe = await pipeline("text-classification", MODEL_ID);
      return pipe as (text: string, opts: { topk: number }) => Promise<ToxicRow[]>;
    })();
  }
  return classifierLoad;
}

export function getToxicityThreshold(): number {
  const raw = process.env.TOXICITY_MAX_SCORE_THRESHOLD;
  const n = raw !== undefined ? Number.parseFloat(raw) : 0.55;
  if (!Number.isFinite(n)) return 0.55;
  return Math.min(0.99, Math.max(0.05, n));
}

export async function analyzeTextToxicity(text: string): Promise<{
  flagged: boolean;
  maxScore: number;
  scores: Record<string, number>;
  topLabel: string;
  model: string;
  threshold: number;
}> {
  const trimmed = text.trim().slice(0, 2500);
  const threshold = getToxicityThreshold();

  if (trimmed.length < 8) {
    return {
      flagged: false,
      maxScore: 0,
      scores: {},
      topLabel: "",
      model: MODEL_ID,
      threshold,
    };
  }

  const classifier = await getClassifier();
  const raw = await classifier(trimmed, { topk: 6 });
  const rows = raw;

  const scores: Record<string, number> = {};
  for (const r of rows) {
    scores[r.label] = r.score;
  }

  const maxScore = rows.length ? Math.max(...rows.map((r) => r.score)) : 0;
  const topLabel = rows[0]?.label ?? "";
  const flagged = maxScore >= threshold;

  return {
    flagged,
    maxScore,
    scores,
    topLabel,
    model: MODEL_ID,
    threshold,
  };
}
