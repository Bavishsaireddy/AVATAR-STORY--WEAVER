import type { Genre } from "@/types/story";

/** Candidate labels must match `Genre` literals exactly for the UI. */
const GENRE_LABELS: Genre[] = [
  "Fantasy",
  "Sci-Fi",
  "Mystery",
  "Romance",
  "Horror",
  "Comedy",
];

const MODEL_ID = "Xenova/distilbert-base-uncased-mnli";

/** Local shape — avoids static `import` from `@xenova/transformers` (breaks Next Turbopack collect phase). */
interface ZeroShotClassificationOutput {
  labels: string[];
  scores: number[];
}

let classifierLoad: Promise<
  (text: string, labels: string[], opts: { multi_label: boolean; hypothesis_template: string }) => Promise<
    ZeroShotClassificationOutput | ZeroShotClassificationOutput[]
  >
> | null = null;

async function getClassifier() {
  if (!classifierLoad) {
    classifierLoad = (async () => {
      const { env, pipeline } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      if (typeof process !== "undefined" && process.env.TRANSFORMERS_CACHE) {
        env.cacheDir = process.env.TRANSFORMERS_CACHE;
      }
      const pipe = await pipeline("zero-shot-classification", MODEL_ID);
      return pipe as (text: string, labels: string[], opts: { multi_label: boolean; hypothesis_template: string }) => Promise<
        ZeroShotClassificationOutput | ZeroShotClassificationOutput[]
      >;
    })();
  }
  return classifierLoad;
}

function outputToScores(out: ZeroShotClassificationOutput): Record<Genre, number> {
  const scores = {} as Record<Genre, number>;
  for (let i = 0; i < out.labels.length; i++) {
    const label = out.labels[i] as Genre;
    if (GENRE_LABELS.includes(label)) {
      scores[label] = out.scores[i];
    }
  }
  for (const g of GENRE_LABELS) {
    if (scores[g] === undefined) scores[g] = 0;
  }
  return scores;
}

/**
 * Zero-shot NLI over fixed genre labels using DistilBERT (BERT-family) MNLI weights via ONNX.
 */
export async function classifyGenreFromText(combinedText: string): Promise<{
  genre: Genre;
  scores: Record<Genre, number>;
  model: string;
}> {
  const text = combinedText.trim().slice(0, 2500);
  if (text.length < 12) {
    throw new Error("Need at least a short paragraph (title + hook) for a stable guess.");
  }

  const classifier = await getClassifier();
  const raw = await classifier(text, GENRE_LABELS, {
    multi_label: false,
    hypothesis_template: "This is {}.",
  });

  const out = Array.isArray(raw) ? raw[0] : raw;
  if (!out?.labels?.length) {
    throw new Error("Classifier returned no labels.");
  }

  const top = out.labels[0] as Genre;
  if (!GENRE_LABELS.includes(top)) {
    throw new Error(`Unexpected label: ${top}`);
  }

  return {
    genre: top,
    scores: outputToScores(out),
    model: MODEL_ID,
  };
}
