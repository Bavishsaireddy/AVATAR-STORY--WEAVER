export function formatToxicityUserMessage(
  topLabel: string,
  maxScore: number,
  threshold: number
): string {
  const pct = (maxScore * 100).toFixed(0);
  const label = topLabel ? topLabel.replace(/_/g, " ") : "harmful";
  return `This text scored high on ${label} (${pct}% ≥ ${(threshold * 100).toFixed(0)}% threshold). Rephrase harassment, threats, slurs, or explicit abuse — fiction tone is fine.`;
}
