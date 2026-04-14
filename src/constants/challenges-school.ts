/**
 * WinSpeak School — category definitions and types.
 * Questions are now stored in the database and fetched via API.
 */

export type SchoolCategoryId =
  | "circletime"
  | "building_talks"
  | "tedlets"
  | "interview_discussion"
  | "voice_for_change"
  | "podcast_playground"
  | "student_council";

export interface SchoolCategory {
  id: SchoolCategoryId;
  title: string;
  emoji: string;
  description: string;
  pastel: "sky" | "mint" | "yellow" | "pink" | "lilac" | "peach";
  gradeLabel: string;
  ageRange: string;
}

export interface SchoolQuestion {
  id: string;
  categoryId: string;
  questionNumber?: number;
  title: string;
  prompt: string;
  scenario: string;
  durationSecs: number;
}

export const SCHOOL_CATEGORIES: SchoolCategory[] = [
  { id: "circletime",           title: "Circle Time",           emoji: "🟢", description: "Children share full sentences during Circle Time.",   pastel: "mint",   gradeLabel: "Reception",     ageRange: "3–4 years" },
  { id: "building_talks",       title: "Building Talks",        emoji: "🧱", description: "Describe structures — what, how, and why.",           pastel: "yellow", gradeLabel: "Early Years 1", ageRange: "4–5 years" },
  { id: "tedlets",              title: "TEDlets",               emoji: "🎤", description: "1-minute talks with props and visuals.",              pastel: "pink",   gradeLabel: "Early Years 2", ageRange: "5–6 years" },
  { id: "interview_discussion", title: "Interview Discussion",  emoji: "🎙️", description: "Advocate for a community project.",                   pastel: "sky",    gradeLabel: "Grade 1",       ageRange: "6–7 years" },
  { id: "voice_for_change",     title: "Voice for Change",      emoji: "📣", description: "Lead a campaign for a social cause.",                 pastel: "peach",  gradeLabel: "Grade 2",       ageRange: "7–8 years" },
  { id: "podcast_playground",   title: "Podcast Playground",    emoji: "🎧", description: "Script and record a mini-podcast episode.",           pastel: "lilac",  gradeLabel: "Grade 3",       ageRange: "8–9 years" },
  { id: "student_council",      title: "Student Council Speeches & Policy", emoji: "🏫", description: "Write and deliver speeches for school changes.", pastel: "sky", gradeLabel: "Grade 4", ageRange: "9–10 years" },
];

export function getSchoolCategory(id: SchoolCategoryId): SchoolCategory | undefined {
  return SCHOOL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesForTeacher(_teacherGrades: number[]): SchoolCategory[] {
  return SCHOOL_CATEGORIES;
}
