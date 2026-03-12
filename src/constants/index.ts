import type { SkillMap, Challenge, GrammarIssue, FillerWord, AnalysisStep } from "@/types";

export const SKILL_DATA: SkillMap = {
  Fluency: {
    score: 78,
    feedback:
      "Your speech flowed naturally with minimal unplanned stops. Work on smoothing out the mid-section where pacing dipped slightly.",
  },
  Grammar: {
    score: 85,
    feedback:
      "Strong grammatical accuracy throughout. Two minor errors detected — review your subject-verb agreement in complex sentences.",
  },
  Vocabulary: {
    score: 72,
    feedback:
      "Good range of industry terms, though some word choices were repetitive. Try varying synonyms for high-frequency words like 'good' and 'great'.",
  },
  Clarity: {
    score: 88,
    feedback:
      "Excellent articulation and enunciation. Your key points came through clearly and were easy to follow.",
  },
  Structure: {
    score: 65,
    feedback:
      "Your intro and body were solid, but the conclusion felt abrupt. Aim for a clear closing statement that reinforces your main idea.",
  },
  Relevancy: {
    score: 91,
    feedback:
      "Stayed tightly on-topic throughout. Every point connected back to the core pitch — this is your strongest area.",
  },
};

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

export const GRAMMAR_ISSUES: GrammarIssue[] = [
  { wrong: "We was planning", correct: "We were planning" },
  { wrong: "More easier", correct: "Easier" },
];

export const FILLER_WORDS: FillerWord[] = [
  { word: "um", count: 4 },
  { word: "like", count: 2 },
  { word: "you know", count: 1 },
];

export const IDEAL_TRANSCRIPT = `Good evening! My name is Arjun and I'm here to pitch SoilSense — an AI-powered precision farming assistant built for small and marginal farmers across India.

The problem is straightforward: 70% of Indian farmers lack real-time soil and weather data, leading to 30% crop wastage every season. SoilSense solves this with a ₹299-per-season subscription that delivers hyper-local soil analysis, irrigation alerts, and crop recommendations directly to a farmer's basic smartphone — no internet required.

We've already onboarded 1,200 farmers in Andhra Pradesh in just three months, with an 87% retention rate. Our unit economics are strong — ₹180 cost per acquisition, ₹600 lifetime value per season.

We're seeking ₹2 crore to expand to three new states and build multilingual voice support. The Indian agri-tech market is ₹35,000 crore and growing at 25% annually.

Invest in SoilSense — and let's grow India's food future together.`;

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
