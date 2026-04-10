import type { AnalysisStep } from "@/types";
import { SPEAKING_CHALLENGES, SPEAKING_CHECKPOINTS } from "./challenges-speaking";
import { HR_CHALLENGES } from "./challenges-hr";
import { HR_CHECKPOINTS } from "./checkpoints-hr";
import { ABAP_CHALLENGES } from "./challenges-abap";
import { ABAP_CHECKPOINTS } from "./checkpoints-abap";

export const CHALLENGES = [...SPEAKING_CHALLENGES, ...HR_CHALLENGES, ...ABAP_CHALLENGES];

export const CHALLENGE_CHECKPOINTS = { ...SPEAKING_CHECKPOINTS, ...HR_CHECKPOINTS, ...ABAP_CHECKPOINTS };

export const TIPS: string[] = [
  "💡 Tip: Pausing for 1–2 seconds between points makes you sound more confident.",
  "🎯 Tip: Use the rule of three — structure ideas in groups of three.",
  "🗣 Tip: Varying your pitch keeps listeners engaged.",
  "⚡ Tip: Filler words like 'um' reduce your perceived credibility by 20%.",
  "🌟 Tip: Start with a strong hook — it sets the tone for everything.",
  "📈 Tip: Audiences decide in the first 20 seconds — lead with your key point.",
  "🔥 Tip: Confident speakers make eye contact 60–70% of the time.",
  "💬 Tip: Short sentences land harder than long ones in presentations.",
  "🧠 Tip: Concrete examples are 3x more memorable than vague claims.",
  "🎤 Tip: End with a clear takeaway — ambiguity loses your audience.",
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

// ── Evaluation: tier-specific scoring rubrics ────────────────────────────────

export const TIER_RUBRICS: Record<
  string,
  { calibration: string; skillGuidelines: Record<string, string> }
> = {
  Beginner: {
    calibration:
      "70+ = strong communicator for this level. 60-69 = solid effort with room to grow. <50 = fundamental gaps in communication. Allow rough edges — enthusiasm and clarity matter more than polish at this stage.",
    skillGuidelines: {
      Relevancy:
        "Did they address the scenario's core task? Generic or off-topic content = cap at 55. Check all required checkpoints.",
      Clarity:
        "Would the target audience (classmates, professor) actually understand and be engaged? Vague or confusing = max 60.",
      Structure:
        "Penalize rambling, repetition, or responses under 20 words. Reward a clear opening → body → close. No structure = max 55.",
      Vocabulary:
        "Penalize vague phrases ('it's really good', 'stuff like that'). Reward specific language and well-chosen words. All vague = max 55.",
      Fluency:
        "Natural flow with reasonable pauses. Excessive filler words (>5 instances) = max 60. Frequent restarts or losing train of thought = max 50.",
      Grammar:
        "Score based on grammatical accuracy. Minor issues are acceptable for Beginner tier. Persistent errors that hurt clarity = max 60.",
    },
  },
  Intermediate: {
    calibration:
      "70+ = handles pressure well and communicates clearly. 60-69 = needs practice but shows potential. <50 = not ready for high-stakes speaking. Demands specifics, evidence, and composure.",
    skillGuidelines: {
      Relevancy:
        "Must hit scenario checkpoints precisely. Tangential or generic content = cap at 50. Missing the core ask = max 40.",
      Clarity:
        "Persuasion and audience awareness are critical. Would this actually convince the listener? Weak reasoning = max 55.",
      Structure:
        "Expect a clear framework: setup → evidence → resolution. Penalize rambling heavily (max 50). Repetition = max 55. Conciseness is valued.",
      Vocabulary:
        "Demand specificity and precision. Vague claims without evidence = max 50. Reward concrete examples and strong word choice.",
      Fluency:
        "Smooth, confident delivery expected. Filler words (>3) = max 55. Hesitation on key points suggests lack of preparation = max 50.",
      Grammar:
        "Near-perfect expected. Grammatical errors that undermine credibility = max 55. Subject-verb disagreements or tense shifts = max 60.",
    },
  },
  Advanced: {
    calibration:
      "75+ = commands any stage or room. 60-74 = competent but forgettable. <55 = not ready for high-profile speaking. Demands precision, charisma, and zero filler. Every word must earn its place.",
    skillGuidelines: {
      Relevancy:
        "Laser focus on the scenario. Every sentence must serve the objective. Off-topic tangents = max 45. Missing key checkpoints = max 50.",
      Clarity:
        "Must be immediately persuasive to a discerning audience. Weak reasoning or abstract platitudes = max 50. Should sound prepared but natural.",
      Structure:
        "Expect masterful structure: strong opening, tight body, memorable close. Any rambling = max 45. Repetition = max 50. Every second counts.",
      Vocabulary:
        "Precision language only. Clichés, filler phrases, or vague descriptors = max 50. Reward vivid, specific, memorable language.",
      Fluency:
        "Stage-ready delivery expected. Any filler words = max 55. Hesitation or restarts = max 50. Should sound polished and rehearsed.",
      Grammar:
        "Flawless expected. Any noticeable error = max 60. This is a high-stakes setting — grammar must be impeccable.",
    },
  },
};
