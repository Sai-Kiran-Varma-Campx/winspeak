import type { Challenge, AnalysisStep } from "@/types";

export const TIPS: string[] = [
  "💡 Tip: Pausing for 1–2 seconds between points makes you sound more confident.",
  "🎯 Tip: Use the rule of three — structure ideas in groups of three.",
  "🗣 Tip: Varying your pitch keeps listeners engaged.",
  "⚡ Tip: Filler words like 'um' reduce your perceived credibility by 20%.",
  "🌟 Tip: Start with a strong hook — it sets the tone for everything.",
];

export const CHALLENGES: Challenge[] = [
  {
    id: "w2",
    title: "Persuasion Master",
    description:
      "Convince the AI investor to fund your startup idea in 60 seconds.",
    xp: 1000,
    status: "active",
    week: "W2",
    deadline: "Complete by Sunday to earn 1000 XP",
  },
  {
    id: "w1",
    title: "Story Starter",
    description: "Tell a compelling story in under 90 seconds.",
    xp: 800,
    status: "completed",
    week: "W1",
  },
  {
    id: "w3",
    title: "Debate Club",
    description: "Argue both sides of a topic convincingly.",
    xp: 1200,
    status: "locked",
    week: "W3",
  },
];

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { label: "Transcribing audio" },
  { label: "Analysing fluency & grammar" },
  { label: "Scoring vocabulary & clarity" },
  { label: "Generating personalized feedback" },
];

export const ANALYSIS_STEP_THRESHOLDS = [20, 45, 65, 85];

export const RECORDING_DURATION_SECS = 60;
export const MAX_RETRIES = 2;
export const CIRCULAR_TIMER_RADIUS = 88;
export const CIRCULAR_TIMER_CIRCUMFERENCE = 2 * Math.PI * CIRCULAR_TIMER_RADIUS; // ≈ 552.9
