/**
 * Convert a 0-100 score to a 0-5 star value, rounded UP to nearest 0.5.
 * Per WinSpeak School POC brief:
 *   Stars = CEILING(score / 20, 0.5)
 *   82 → 4.5, 60 → 3.0, 45 → 2.5, 0 → 0
 */
export function scoreToStars(score: number): number {
  if (score == null || isNaN(score) || score <= 0) return 0;
  const raw = score / 20;
  // Ceiling to nearest 0.5
  const stars = Math.ceil(raw * 2) / 2;
  return Math.min(5, Math.max(0, stars));
}
