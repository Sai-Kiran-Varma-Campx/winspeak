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

  // ── School Grade-Specific Tiers (age 6-9) ────────────────────────────────
  Grade1: {
    calibration:
      "For a 6-year-old (Grade 1). 70+ = exceptionally brave and clear for their age. 50-69 = good effort, on-topic, spoke in sentences. 30-49 = tried but struggled. <30 = barely spoke or completely off-topic. Reward courage, effort, and imagination above all. Do NOT expect grammar correctness or complex structure.",
    skillGuidelines: {
      Relevancy: "Did they try to talk about the topic at all? Any on-topic content = at least 40. Completely off-topic or silent = max 15.",
      Clarity: "Can you understand what they're saying? Clear words = reward. Mumbling or inaudible = max 25. Don't penalize pronunciation quirks normal for age 6.",
      Structure: "Any attempt at multiple sentences = reward. Just one sentence = max 40. No structure expected — even a list of ideas is fine for Grade 1.",
      Vocabulary: "Simple words are completely fine. Reward any descriptive words ('big', 'happy', 'scary'). Don't penalize limited vocabulary — it's normal at this age.",
      Fluency: "Restarts, pauses, and 'um' are completely normal for Grade 1. Only penalize if they stopped speaking entirely. Frequent restarts = still at least 30.",
      Grammar: "Grammar errors are expected and normal for Grade 1. Only note errors gently. Subject-verb mistakes, tense confusion = still score 40+. Perfect grammar is NOT expected.",
    },
  },
  Grade2: {
    calibration:
      "For a 7-year-old (Grade 2). 70+ = speaks clearly with some detail. 50-69 = on-topic with effort. 30-49 = minimal speech or mostly off-topic. <30 = didn't really try. Expect 3-6 sentences. Reward storytelling and descriptive words. Grammar can still be rough.",
    skillGuidelines: {
      Relevancy: "Did they answer the question asked? On-topic with at least 2 points = good. Completely off-topic = max 20. Partially related = 35-50.",
      Clarity: "Should be mostly understandable. Mumbling = max 35. Clear speech even if simple = reward. Age-appropriate pronunciation is fine.",
      Structure: "Expect a beginning and some middle. Ending optional. 3+ connected sentences = good. Random unrelated sentences = max 40.",
      Vocabulary: "Reward any descriptive words or feelings words. 'Because' and 'then' show reasoning = bonus. All single-word answers = max 30.",
      Fluency: "Some pauses and restarts are normal. Long silences (>5 sec) = penalize. Speaks with some flow = reward. Heavy hesitation = max 40.",
      Grammar: "Simple grammar expected. Consistent tense errors = max 50. Some mistakes are fine. Full sentences (subject + verb) = reward.",
    },
  },
  Grade3: {
    calibration:
      "For an 8-year-old (Grade 3). 70+ = well-structured, clear, and detailed for their age. 50-69 = solid effort with room to improve. 30-49 = below expected level. <30 = barely tried. Expect linked sentences, some structure, and basic reasoning ('because...', 'so that...'). Grammar should be mostly correct.",
    skillGuidelines: {
      Relevancy: "Must answer the question with at least 2-3 relevant points. Generic or vague = max 50. Off-topic = max 25.",
      Clarity: "Should be clear and easy to follow. Good projection and pace = reward. Mumbling or rushing = max 45.",
      Structure: "Expect a clear start and at least some organization. Opening + body = minimum. Random thoughts = max 45. Clear opening + body + ending = 70+.",
      Vocabulary: "Expect some variety beyond basic words. Descriptive language and specific examples = reward. All generic ('good', 'nice', 'fun') = max 45.",
      Fluency: "Should speak with reasonable flow. Frequent pauses OK but long gaps = max 45. Fillers ('um', 'like') >5 times = max 50.",
      Grammar: "Mostly correct grammar expected. Occasional errors fine. Persistent errors (wrong tense throughout) = max 50. Complete sentences required.",
    },
  },
  Grade4: {
    calibration:
      "For a 9-year-old (Grade 4). 70+ = confident mini-speech with clear reasoning. 50-69 = adequate but needs more depth or structure. 30-49 = significant gaps. <30 = barely attempted. Expect a coherent response with opening, body, conclusion. Should use specific examples and varied vocabulary. Hold to a higher but still age-appropriate bar.",
    skillGuidelines: {
      Relevancy: "Must directly address the prompt with specific points. Vague or partially relevant = max 50. Off-topic = max 20.",
      Clarity: "Clear, confident delivery expected. Should sound prepared. Mumbling or unclear speech = max 40. Good projection = reward.",
      Structure: "Expect clear opening, organized body, and a conclusion. Missing conclusion = max 55. No structure = max 35. Well-structured = 70+.",
      Vocabulary: "Expect age-appropriate but specific vocabulary. Should use some descriptive or topic-specific words. All basic/generic = max 45.",
      Fluency: "Smooth delivery with natural pauses. Fillers >3 = max 55. Frequent restarts = max 45. Confident flow = reward.",
      Grammar: "Mostly correct grammar required. Persistent tense errors = max 45. Subject-verb agreement expected. Occasional slips = fine.",
    },
  },
  Grade5: {
    calibration:
      "For a 10-year-old (Grade 5). 70+ = well-organized speech with supporting details. 50-69 = decent effort with gaps. 30-49 = below expectations. <30 = barely attempted. Expect paragraphs of connected ideas, reasoning with 'because/therefore', and basic persuasion skills.",
    skillGuidelines: {
      Relevancy: "Must directly address the prompt with 3+ supporting points. Vague responses = max 45. Off-topic = max 20.",
      Clarity: "Clear, audible delivery. Good pacing expected. Mumbling or rushing = max 40. Confident projection = reward.",
      Structure: "Expect intro, body with 2+ points, conclusion. Missing conclusion = max 50. No structure = max 30.",
      Vocabulary: "Should use topic-specific and descriptive vocabulary. All basic words = max 40. Varied word choice = reward.",
      Fluency: "Mostly smooth delivery expected. Fillers >4 = max 50. Long pauses = max 45.",
      Grammar: "Correct grammar expected. Tense consistency required. Persistent errors = max 40.",
    },
  },
  Grade6: {
    calibration:
      "For an 11-year-old (Grade 6). 70+ = persuasive and well-structured. 50-69 = shows understanding but lacks polish. 30-49 = significant gaps. <30 = minimal effort. Expect clear arguments, examples to support points, and awareness of audience.",
    skillGuidelines: {
      Relevancy: "Must build a clear argument addressing the prompt. Surface-level responses = max 45. Off-topic = max 15.",
      Clarity: "Articulate and engaging delivery. Should vary tone for emphasis. Monotone or unclear = max 40.",
      Structure: "Clear framework: hook/intro, organized body, strong close. Rambling = max 40. Well-structured = 70+.",
      Vocabulary: "Expect precise vocabulary with some formal register. Colloquial-only = max 45. Academic/formal words = reward.",
      Fluency: "Confident and natural flow. Fillers >3 = max 50. Hesitation on key points = max 45.",
      Grammar: "Near-correct grammar expected. Complex sentences should be attempted. Errors in complex structures = still reward the attempt.",
    },
  },
  Grade7: {
    calibration:
      "For a 12-year-old (Grade 7). 70+ = compelling and articulate. 50-69 = competent but room for depth. 30-49 = underdeveloped. <30 = insufficient. Expect well-reasoned arguments, specific evidence, and some rhetorical awareness.",
    skillGuidelines: {
      Relevancy: "Must present a clear thesis with supporting evidence. Generic claims without evidence = max 40. Off-topic = max 15.",
      Clarity: "Should be immediately understandable and engaging. Weak delivery = max 40. Strong projection and modulation = reward.",
      Structure: "Expect logical flow with transitions between ideas. Disjointed ideas = max 40. Smooth transitions = reward.",
      Vocabulary: "Expect academic vocabulary appropriate to the topic. Repetitive/basic = max 40. Precise, varied = reward.",
      Fluency: "Smooth, prepared-sounding delivery. Fillers >3 = max 45. Should sound confident.",
      Grammar: "Correct grammar required including complex sentences. Frequent basic errors = max 40.",
    },
  },
  Grade8: {
    calibration:
      "For a 13-year-old (Grade 8). 70+ = polished and persuasive. 50-69 = adequate but forgettable. 30-49 = weak. <30 = did not engage. Expect structured arguments with evidence, counterpoint awareness, and confident delivery.",
    skillGuidelines: {
      Relevancy: "Strong thesis with specific evidence required. Vague or unsupported claims = max 40. Off-topic = max 10.",
      Clarity: "Clear, confident, audience-aware delivery. Should sound prepared. Unclear = max 35.",
      Structure: "Demand strong opening, evidence-backed body, memorable conclusion. Poor structure = max 35.",
      Vocabulary: "Precise, topic-appropriate vocabulary. Should demonstrate range. Basic/repetitive = max 40.",
      Fluency: "Polished delivery expected. Any significant hesitation = max 45. Fillers >2 = max 50.",
      Grammar: "Correct and varied sentence structures required. Basic errors = max 40.",
    },
  },
  Grade9: {
    calibration:
      "For a 14-year-old (Grade 9). 70+ = commanding and well-argued. 50-69 = shows competence but lacks impact. 30-49 = underprepared. <30 = did not attempt meaningfully. Expect sophisticated arguments, rhetorical techniques, and polished delivery.",
    skillGuidelines: {
      Relevancy: "Laser-focused argument with strong evidence. Must address nuance. Surface-level = max 40.",
      Clarity: "Articulate, engaging, audience-aware. Should use tone and emphasis effectively. Weak delivery = max 35.",
      Structure: "Expect sophisticated structure: compelling intro, well-organized body, powerful conclusion. Rambling = max 35.",
      Vocabulary: "Sophisticated, precise vocabulary expected. Should demonstrate command of language. Basic = max 35.",
      Fluency: "Near-polished delivery. Minimal filler. Should sound natural yet prepared. Hesitation = max 40.",
      Grammar: "Flawless basic grammar. Complex structures expected and should be mostly correct.",
    },
  },
  Grade10: {
    calibration:
      "For a 15-year-old (Grade 10). 75+ = exceptional speaker for their age. 55-74 = competent. 35-54 = needs significant improvement. <35 = minimal effort. Expect well-crafted arguments, rhetorical sophistication, confident delivery, and command of the topic.",
    skillGuidelines: {
      Relevancy: "Must demonstrate deep understanding of the topic. Thesis must be clear and well-supported. Shallow = max 35.",
      Clarity: "Commanding delivery expected. Should engage and persuade. Weak projection or clarity = max 35.",
      Structure: "Masterful organization: hook, thesis, evidence, counterpoint, conclusion. Any rambling = max 35.",
      Vocabulary: "Advanced, precise vocabulary. Should demonstrate rhetorical awareness. Basic language = max 35.",
      Fluency: "Stage-ready delivery. Minimal to no fillers. Natural, confident pace. Any significant hesitation = max 40.",
      Grammar: "Impeccable grammar expected. Complex and varied sentence structures required.",
    },
  },
};
