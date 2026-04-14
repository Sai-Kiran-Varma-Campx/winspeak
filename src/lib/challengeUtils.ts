import type { ChallengeCategory } from "@/types";

/** Color based on score thresholds. Used in Dashboard, Report, History, InterviewPrep. */
export function scoreColor(score: number): string {
  if (score >= 80) return "#5BAF7E";
  if (score >= 60) return "#CCA550";
  return "#CC6B7E";
}

/** Returns the route to navigate back to based on challenge category. */
export function getChallengeBackPath(category: ChallengeCategory): string {
  if (category === "hr") return "/interview-prep?tab=hr";
  if (category === "abap") return "/interview-prep?tab=abap";
  return "/";
}
