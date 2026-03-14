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

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  status: BadgeVariant;
  week: string;
  deadline?: string;
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
}
