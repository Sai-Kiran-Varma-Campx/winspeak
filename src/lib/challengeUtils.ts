import type { ChallengeCategory } from "@/types";

/** Color based on score thresholds. Used in Dashboard, Report, History, InterviewPrep. */
export function scoreColor(score: number): string {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

/** Returns the route to navigate back to based on challenge category. */
export function getChallengeBackPath(category: ChallengeCategory): string {
  if (category === "hr") return "/interview-prep?tab=hr";
  if (category === "abap") return "/interview-prep?tab=abap";
  return "/";
}
