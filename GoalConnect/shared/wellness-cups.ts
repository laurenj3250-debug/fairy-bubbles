export const WELLNESS_CUPS = [
  { index: 0, name: "Body",      short: "Bod", color: "#C2546A" },
  { index: 1, name: "Adventure", short: "Adv", color: "#3A9DAF" },
  { index: 2, name: "Novelty",   short: "Nov", color: "#C45990" },
  { index: 3, name: "Soul",      short: "Sou", color: "#8E50AF" },
  { index: 4, name: "People",    short: "Ppl", color: "#CFA050" },
  { index: 5, name: "Mastery",   short: "Mas", color: "#4FA070" },
] as const;

/** Safely parse the `cups` jsonb column into a validated number array */
export function parseCups(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is number => typeof x === "number" && x >= 0 && x < WELLNESS_CUPS.length);
}

/** Composite score: how much an item helps your most depleted cups. Higher = more needed. */
export function cupScore(cups: number[], cupLevels: number[]): number {
  if (cups.length === 0) return -1;
  return cups.reduce((sum, idx) => sum + (5 - (cupLevels[idx] ?? 3)), 0);
}
