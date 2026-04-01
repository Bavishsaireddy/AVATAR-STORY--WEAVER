import type { CreativityPreference } from "@/types/story";

export const CREATIVITY_OPTIONS: {
  value: CreativityPreference;
  title: string;
  hint: string;
}[] = [
  {
    value: "precise",
    title: "Precise",
    hint: "Tight, consistent prose — low randomness.",
  },
  {
    value: "balanced",
    title: "Balanced",
    hint: "Default mix of stability and surprise.",
  },
  {
    value: "creative",
    title: "Creative",
    hint: "Richer variation (model temperature ~0.8–0.9).",
  },
  {
    value: "chaotic",
    title: "Chaotic",
    hint: "Maximum wildness within safe bounds.",
  },
];
