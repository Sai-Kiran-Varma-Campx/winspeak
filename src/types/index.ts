export type Screen =
  | "dashboard"
  | "audiocheck"
  | "question"
  | "recording"
  | "analysing"
  | "report";

export type BadgeVariant = "active" | "completed" | "locked";

export type SkillName =
  | "Fluency"
  | "Grammar"
  | "Vocabulary"
  | "Clarity"
  | "Structure"
  | "Relevancy";

export interface SkillData {
  score: number;
  feedback: string;
}

export type SkillMap = Record<SkillName, SkillData>;

export type ChallengeTier = "Beginner" | "Intermediate" | "Advanced";

export type ChallengeCategory = "speaking" | "hr" | "abap";

export interface Challenge {
  id: string;
  title: string;
  description: string;  // Short dashboard card copy
  scenario: string;     // Real-world situation briefing shown in Question screen
  prompt: string;       // The exact task/question the student responds to
  xp: number;
  status: BadgeVariant;
  week: string;
  deadline?: string;
  tier?: ChallengeTier;
  passingScore: number;
  maxAttempts: number;
  category: ChallengeCategory;
  referenceAnswer?: string;
  evaluationCriteria?: string;
}

export interface GrammarIssue {
  wrong: string;
  correct: string;
}

export interface FillerWord {
  word: string;
  count: number;
}

export interface AnalysisStep {
  label: string;
}

export interface AnalysisResult {
  overallScore: number;
  xpEarned: number;
  transcript: string;
  skills: SkillMap;
  pauseAnalysis: {
    status: string;
    count: number;
    avgDuration: string;
    suggestion: string;
  };
  grammarIssues: GrammarIssue[];
  fillerWords: FillerWord[];
  winSpeakAnalysis: string;
  strengths: string[];
  improvements: string[];
  idealResponse: string;
  /** School POC: 0-100 confidence/bravery score for "How Brave You Sounded!" meter. */
  confidenceScore?: number;
  /** School POC: 1-2 specific things the student got right grammatically. */
  whatYouGotRight?: string[];
}
