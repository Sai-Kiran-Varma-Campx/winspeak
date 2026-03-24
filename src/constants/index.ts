import type { Challenge, AnalysisStep } from "@/types";

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

export const CHALLENGES: Challenge[] = [
  {
    id: "c1",
    week: "W1",
    tier: "Beginner",
    xp: 600,
    passingScore: 60,
    maxAttempts: 3,
    status: "active",
    title: "The Self-Introduction",
    description: "60 seconds to introduce yourself to a new class. Make it count.",
    scenario:
      "It's the first day of a new semester. Your professor asks everyone to stand up and introduce themselves to the class — who you are, what you're studying, and what you're passionate about. 40 students are watching. You have 60 seconds.",
    prompt:
      "Introduce yourself confidently. In under 60 seconds: who you are, what you study, what drives you, and one interesting thing about yourself. Make people want to know you.",
  },
  {
    id: "c2",
    week: "W2",
    tier: "Beginner",
    xp: 700,
    passingScore: 60,
    maxAttempts: 3,
    status: "locked",
    title: "Explain a Concept",
    description: "Your classmate missed the lecture. Explain the topic clearly.",
    scenario:
      "Your classmate missed an important lecture and asks you to explain the key concept before tomorrow's quiz. They're confused and short on time. You need to break it down simply and clearly.",
    prompt:
      "Pick any topic you know well and explain it as if teaching someone who has never heard of it. Be clear, structured, and engaging. You have 60 seconds.",
  },
  {
    id: "c3",
    week: "W3",
    tier: "Beginner",
    xp: 800,
    passingScore: 60,
    maxAttempts: 3,
    status: "locked",
    title: "Group Project Leader",
    description: "Convince your group to adopt your plan for the final project.",
    scenario:
      "Your group of 5 can't agree on a direction for the final project. Two members want to take an easy route, one doesn't care, and one has a competing idea. You believe your plan is the strongest. The professor gave you 10 minutes to decide.",
    prompt:
      "Make the case for your project idea. Address the concerns, explain why your plan is the best path, and rally the group behind it. Be persuasive but respectful.",
  },
  {
    id: "c4",
    week: "W4",
    tier: "Intermediate",
    xp: 900,
    passingScore: 70,
    maxAttempts: 3,
    status: "locked",
    title: "Debate Defense",
    description: "Your opponent just made a strong point. Counter it live.",
    scenario:
      "You're in a class debate. Your opponent just delivered a compelling argument that got the audience nodding. The moderator turns to you: 'You have 60 seconds to respond.' The room is waiting.",
    prompt:
      "Counter the opposing argument effectively. Acknowledge their point, then present your rebuttal with evidence and logic. Stay composed and persuasive.",
  },
  {
    id: "c5",
    week: "W5",
    tier: "Intermediate",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "locked",
    title: "Presentation Under Pressure",
    description: "Your slides crashed. Present your research from memory.",
    scenario:
      "You're presenting your semester research project to the class. Your laptop just froze — slides are gone. The professor says: 'That's fine, just walk us through it verbally.' 30 students and your professor are watching. Your grade depends on this.",
    prompt:
      "Deliver your research summary without slides. State your topic, key findings, why it matters, and your conclusion. Be clear and confident under pressure.",
  },
  {
    id: "c6",
    week: "W6",
    tier: "Intermediate",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "locked",
    title: "Difficult Conversation",
    description: "A teammate isn't pulling their weight. Address it constructively.",
    scenario:
      "Your group project is due in a week. One teammate has missed every meeting and hasn't done their part. The rest of the group is frustrated. You've been chosen to talk to them. You want to be honest but not burn the relationship.",
    prompt:
      "Have the conversation. Address the problem directly, explain the impact on the team, and propose a way forward. Be firm but fair.",
  },
  {
    id: "c7",
    week: "W7",
    tier: "Intermediate",
    xp: 1100,
    passingScore: 70,
    maxAttempts: 3,
    status: "locked",
    title: "Tough Q&A",
    description: "The professor challenges your argument. Defend your position.",
    scenario:
      "You just finished presenting your thesis argument. The professor leans forward: 'I don't buy it. Your methodology has a clear flaw and your sample size is too small. Convince me why your conclusions still hold.' The class goes silent.",
    prompt:
      "Defend your position under academic scrutiny. Acknowledge the limitation, explain why your findings are still valid, and show the depth of your understanding.",
  },
  {
    id: "c8",
    week: "W8",
    tier: "Advanced",
    xp: 1200,
    passingScore: 75,
    maxAttempts: 3,
    status: "locked",
    title: "Impromptu Speech",
    description: "You're called on with no preparation. Speak for 60 seconds.",
    scenario:
      "At a college event, the host unexpectedly calls you up: 'We'd love to hear from one of our top students. Come share what you've learned this year.' 200 people in the auditorium. No prep. No notes. Just you and the mic.",
    prompt:
      "Deliver a compelling impromptu speech about your college journey, a key lesson you've learned, or something you're passionate about. Make it memorable.",
  },
  {
    id: "c9",
    week: "W9",
    tier: "Advanced",
    xp: 1500,
    passingScore: 75,
    maxAttempts: 3,
    status: "locked",
    title: "The Final Showcase",
    description: "Present your capstone project to a panel of judges.",
    scenario:
      "End-of-year showcase. A panel of 3 professors and 2 industry professionals will evaluate your capstone project. You have 60 seconds for your closing statement. Other students presented strong work. You need to stand out.",
    prompt:
      "Deliver your closing statement. Summarize your project's impact, what makes it unique, what you learned, and end with a line that makes the panel remember you.",
  },
  {
    id: "c10",
    week: "W10",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "locked",
    title: "One App to Delete",
    description: "If you had to delete one app from your phone — which and why?",
    scenario:
      "You're in a casual discussion circle with classmates. The icebreaker question is: 'If you had to permanently delete one app from your phone, which would it be and why?' Everyone's listening — make your answer interesting and honest.",
    prompt:
      "Pick one app you'd delete from your phone and explain why. Be specific — what would you gain by removing it? Make your reasoning engaging and relatable.",
  },
  {
    id: "c11",
    week: "W11",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "locked",
    title: "The Ideal Weekend",
    description: "Describe your perfect weekend — make us want to live it.",
    scenario:
      "Your English class is doing a speaking exercise. The prompt is simple: 'Describe your ideal weekend.' But the catch — you need to make it vivid enough that the class can picture it. No boring lists. Paint a scene.",
    prompt:
      "Describe your ideal weekend in 60 seconds. Be vivid and specific — where are you, what are you doing, who are you with? Make the listener feel like they're there.",
  },
  {
    id: "c12",
    week: "W12",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "locked",
    title: "Change One Rule",
    description: "If you could change one rule in your college, what would it be?",
    scenario:
      "The student council is collecting proposals. Each student gets 60 seconds at the mic to pitch one rule change to the college administration. The dean is in the audience. This is your chance to be heard.",
    prompt:
      "Propose one rule change for your college. State the current rule, why it's a problem, what you'd change, and how it would improve student life. Be persuasive.",
  },
  {
    id: "c13",
    week: "W13",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "locked",
    title: "Recommend a Habit",
    description: "Share a productivity tool or habit you'd genuinely recommend.",
    scenario:
      "A junior student asks you: 'What's one productivity habit or tool that actually works?' They're overwhelmed with college workload and looking for real, practical advice — not generic tips from the internet.",
    prompt:
      "Recommend one productivity tool or habit that you genuinely use. Explain what it is, how you use it, and why it works for you. Be authentic — no generic advice.",
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

// ── Evaluation: per-challenge required checkpoints ───────────────────────────
// Missing checkpoints → Relevancy capped at 60, Structure at 65.
// Missing >half → Relevancy capped at 45.

export const CHALLENGE_CHECKPOINTS: Record<string, string[]> = {
  c1: [
    "State your name and what you study",
    "Mention what you're passionate about or interested in",
    "Share one unique or interesting fact about yourself",
    "Project confidence and friendliness",
    "End with something memorable that invites conversation",
  ],
  c2: [
    "Clearly name the topic being explained",
    "Break it down into simple, digestible parts",
    "Use an analogy or example to make it relatable",
    "Check for understanding (e.g., 'Does that make sense?')",
    "Summarize the key takeaway in one sentence",
  ],
  c3: [
    "Clearly present your project idea and direction",
    "Acknowledge the competing ideas or concerns",
    "Explain why your plan is stronger with reasoning",
    "Address practical concerns (feasibility, timeline, workload)",
    "End with a unifying call to action for the group",
  ],
  c4: [
    "Acknowledge the opponent's argument fairly",
    "Identify a flaw or limitation in their reasoning",
    "Present a counter-argument with evidence or logic",
    "Use a concrete example to strengthen your point",
    "Conclude with a clear, confident summary",
  ],
  c5: [
    "State the research topic and its significance",
    "Describe the methodology or approach briefly",
    "Present 2-3 key findings clearly",
    "Explain why the findings matter",
    "Deliver a confident conclusion",
  ],
  c6: [
    "Address the problem directly without being hostile",
    "Explain the specific impact on the team",
    "Listen/acknowledge their perspective",
    "Propose a concrete plan to get back on track",
    "End on a constructive, forward-looking note",
  ],
  c7: [
    "Acknowledge the professor's critique honestly",
    "Explain why the limitation doesn't invalidate the work",
    "Provide additional evidence or reasoning to support your point",
    "Show awareness of what you'd do differently with more resources",
    "Maintain composure and academic rigor throughout",
  ],
  c8: [
    "Open with a strong hook that grabs attention",
    "Share a personal insight or lesson learned",
    "Use a specific story or example — not generic platitudes",
    "Connect the message to the audience",
    "End with a memorable closing line",
  ],
  c9: [
    "Summarize the project's purpose and impact clearly",
    "Highlight what makes this project unique",
    "Share what you personally learned from the process",
    "Demonstrate passion and ownership",
    "End with a powerful closing line the panel will remember",
  ],
  c10: [
    "Name a specific app — not a vague category",
    "Give a clear reason for deleting it",
    "Describe what you'd gain without it",
    "Make the reasoning personal and relatable",
    "Keep a conversational, engaging tone",
  ],
  c11: [
    "Set the scene vividly — time, place, atmosphere",
    "Include specific activities, not just a generic list",
    "Make it personal — reveal something about your personality",
    "Use descriptive, sensory language",
    "Wrap up with why this weekend matters to you",
  ],
  c12: [
    "Clearly state the current rule and why it exists",
    "Explain why the rule is problematic for students",
    "Propose a specific, actionable change",
    "Explain the benefit to student life",
    "Sound persuasive — this is a pitch to the administration",
  ],
  c13: [
    "Name a specific tool or habit — not vague advice",
    "Explain how you personally use it",
    "Share a concrete result or benefit you've experienced",
    "Make it practical and actionable for the listener",
    "Sound authentic — not like a product ad",
  ],
};

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
