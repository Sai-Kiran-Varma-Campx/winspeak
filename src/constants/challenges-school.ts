/**
 * WinSpeak School POC — challenge content.
 * Per the design brief: 8 categories × grades 1–4 × multiple questions.
 *
 * Questions below are placeholder content suitable for end-to-end testing
 * the school flow. Real curriculum should be authored by the content team.
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
  categoryId: SchoolCategoryId;
  grade: 1 | 2 | 3 | 4;
  title: string;
  prompt: string;
  scenario: string;
  durationSecs: number;
}

export const SCHOOL_CATEGORIES: SchoolCategory[] = [
  { id: "circletime",           title: "Circletime",            emoji: "🟢", description: "Friendly sharing in a circle.",             pastel: "mint",   gradeLabel: "Reception",      ageRange: "3–4 years" },
  { id: "building_talks",       title: "Building Talks",        emoji: "🧱", description: "Build an idea, sentence by sentence.",      pastel: "yellow", gradeLabel: "Early Years 1",  ageRange: "4–5 years" },
  { id: "tedlets",              title: "TEDlets",               emoji: "🎤", description: "Tiny talks with a big idea.",               pastel: "pink",   gradeLabel: "Early Years 2",  ageRange: "5–6 years" },
  { id: "interview_discussion", title: "Interview Discussion",  emoji: "🎙️", description: "Q&A practice in pairs.",                    pastel: "sky",    gradeLabel: "Grade 1",        ageRange: "6–7 years" },
  { id: "voice_for_change",     title: "Voice for Change",      emoji: "📣", description: "Speak up about something you care about.",  pastel: "peach",  gradeLabel: "Grade 2",        ageRange: "7–8 years" },
  { id: "podcast_playground",   title: "Podcast Playground",    emoji: "🎧", description: "Tell a story, podcast-style.",              pastel: "lilac",  gradeLabel: "Grade 3",        ageRange: "8–9 years" },
  { id: "student_council",      title: "Student Council Speeches & Policy", emoji: "🏫", description: "Speeches to advocate for changes in school life.", pastel: "sky", gradeLabel: "Grade 4", ageRange: "9–10 years" },
];

// ── Placeholder questions: 2 per (category, grade) = 64 total ───────────────
function q(
  id: string,
  categoryId: SchoolCategoryId,
  grade: 1 | 2 | 3 | 4,
  title: string,
  prompt: string,
  scenario: string
): SchoolQuestion {
  return { id, categoryId, grade, title, prompt, scenario, durationSecs: 60 };
}

export const SCHOOL_QUESTIONS: SchoolQuestion[] = [
  // ─── Circletime ───
  q("circletime_g1_1", "circletime", 1, "My Favourite Toy", "Tell us about your favourite toy. Why do you love it?", "It's circle time. Everyone is sitting on the carpet listening to you."),
  q("circletime_g1_2", "circletime", 1, "My Family", "Who is in your family? Tell us one thing about each person.", "Share with your friends in the circle."),
  q("circletime_g2_1", "circletime", 2, "My Best Friend", "Who is your best friend and what do you like to do together?", "Take turns sharing in the circle."),
  q("circletime_g2_2", "circletime", 2, "Weekend Story", "What was the most fun thing you did this weekend?", "Friends are listening — tell it like a little story."),
  q("circletime_g3_1", "circletime", 3, "My Hero", "Who is someone you look up to and why?", "Share with your circle. Use full sentences."),
  q("circletime_g3_2", "circletime", 3, "Something New", "Tell us about something new you learned this week.", "Your classmates want to learn it from you."),
  q("circletime_g4_1", "circletime", 4, "A Proud Moment", "Tell us about a moment you felt really proud of yourself.", "Share with the circle in 60 seconds."),
  q("circletime_g4_2", "circletime", 4, "If I Could…", "If you could change one thing in the world, what would it be?", "Open the floor with your idea."),

  // ─── Building Talks ───
  q("building_g1_1", "building_talks", 1, "Build a Sandwich", "Tell us step by step how to make a sandwich.", "Pretend your friend has never made one."),
  q("building_g1_2", "building_talks", 1, "Brushing Teeth", "Explain how you brush your teeth, step by step.", "Teach a younger child how to do it."),
  q("building_g2_1", "building_talks", 2, "How to Tie Shoes", "Step by step, how do you tie your shoes?", "Teach the class."),
  q("building_g2_2", "building_talks", 2, "Make a Paper Plane", "Walk us through making a paper aeroplane.", "Your friend wants to copy what you say."),
  q("building_g3_1", "building_talks", 3, "Plan a Birthday", "How would you plan a birthday party for a friend?", "Walk through the steps."),
  q("building_g3_2", "building_talks", 3, "Cook Something Simple", "Pick something simple you can cook. Walk us through it.", "Your audience wants to try it tonight."),
  q("building_g4_1", "building_talks", 4, "Build a Den", "How would you build the best blanket fort? Step by step.", "Teach younger kids the secret."),
  q("building_g4_2", "building_talks", 4, "Plant a Seed", "Walk us through planting a seed and helping it grow.", "Imagine teaching a kindergarten class."),

  // ─── TEDlets ───
  q("tedlets_g1_1", "tedlets", 1, "One Big Idea", "Share one big idea you think everyone should know.", "You're on a tiny TED stage. The class is your audience."),
  q("tedlets_g1_2", "tedlets", 1, "Why Smiling Matters", "Why is smiling important? Convince us.", "60 seconds to make us smile."),
  q("tedlets_g2_1", "tedlets", 2, "Why Reading Is Magic", "Tell us why reading books is amazing.", "TED stage — make us want to grab a book."),
  q("tedlets_g2_2", "tedlets", 2, "Be Kind", "Why is being kind a superpower?", "Inspire the audience."),
  q("tedlets_g3_1", "tedlets", 3, "My Favourite Animal", "Pick an animal and tell us why it's the most amazing.", "Make us love it as much as you do."),
  q("tedlets_g3_2", "tedlets", 3, "Fix Something Small", "Pick one small problem at school and tell us how to fix it.", "Convince the audience."),
  q("tedlets_g4_1", "tedlets", 4, "The Future", "What will the world look like when you're an adult? Share your vision.", "TED talk style — paint the picture."),
  q("tedlets_g4_2", "tedlets", 4, "A Hidden Talent", "Tell us about a talent or hobby most people don't know about.", "Get the audience curious."),

  // ─── Interview Discussion ───
  q("interview_g1_1", "interview_discussion", 1, "What Do You Like?", "Answer: What's your favourite thing to do at school?", "A friend is interviewing you."),
  q("interview_g1_2", "interview_discussion", 1, "Tell Me About You", "Answer: What's your name, age, and one fun fact?", "Imagine you're meeting a new friend."),
  q("interview_g2_1", "interview_discussion", 2, "Favourite Subject", "Which school subject do you love most and why?", "An interviewer wants to know."),
  q("interview_g2_2", "interview_discussion", 2, "A Hard Question", "Answer: What is something you are getting better at?", "Take your time and answer in full sentences."),
  q("interview_g3_1", "interview_discussion", 3, "About a Book", "Tell me about a book you enjoyed and why.", "An interviewer is curious."),
  q("interview_g3_2", "interview_discussion", 3, "Future You", "What do you want to be when you grow up, and why?", "Talk like you're on a podcast."),
  q("interview_g4_1", "interview_discussion", 4, "Tough Choice", "Tell me about a time you had to make a difficult choice.", "An interviewer wants the full story."),
  q("interview_g4_2", "interview_discussion", 4, "Leadership", "Have you ever led a team or group? Tell me about it.", "Share what you learned."),

  // ─── Voice for Change ───
  q("voice_g1_1", "voice_for_change", 1, "Help Animals", "Tell everyone why we should be kind to animals.", "Speak up — your friends are listening."),
  q("voice_g1_2", "voice_for_change", 1, "Less Litter", "Why should we keep our school clean?", "Make a tiny speech."),
  q("voice_g2_1", "voice_for_change", 2, "Save Water", "Why is saving water important? Make your case.", "Speak to your class assembly."),
  q("voice_g2_2", "voice_for_change", 2, "Be a Buddy", "Why should we include classmates who are alone?", "Speak from the heart."),
  q("voice_g3_1", "voice_for_change", 3, "Healthy Lunches", "Argue for healthier food at school.", "Speak to your school council."),
  q("voice_g3_2", "voice_for_change", 3, "More Reading Time", "Convince your class that reading time matters.", "60 seconds to persuade."),
  q("voice_g4_1", "voice_for_change", 4, "Climate Action", "What can students do about climate change? Speak up.", "School assembly — make it count."),
  q("voice_g4_2", "voice_for_change", 4, "End Bullying", "Make a strong speech against bullying.", "Speak to the whole school."),

  // ─── Podcast Playground ───
  q("podcast_g1_1", "podcast_playground", 1, "My Pet Story", "Tell a story about a pet — yours or one you wish you had.", "Pretend you're recording a tiny podcast."),
  q("podcast_g1_2", "podcast_playground", 1, "A Funny Day", "Tell us about a really funny day you had.", "Make us laugh on our podcast."),
  q("podcast_g2_1", "podcast_playground", 2, "Adventure!", "Tell a story about an adventure you went on.", "Podcast voice — make it exciting."),
  q("podcast_g2_2", "podcast_playground", 2, "Spooky Tale", "Tell a not-too-scary spooky story.", "Sound like a podcast host."),
  q("podcast_g3_1", "podcast_playground", 3, "My Hero Episode", "Do an episode about a person who inspires you.", "Open with a hook, share the story, end with a takeaway."),
  q("podcast_g3_2", "podcast_playground", 3, "Mystery", "Tell a short mystery story with a twist at the end.", "Podcast voice."),
  q("podcast_g4_1", "podcast_playground", 4, "Then & Now", "Compare something from your grandparents' time to today.", "Make it sound like a real podcast episode."),
  q("podcast_g4_2", "podcast_playground", 4, "Big Idea Episode", "Pick one big idea and explore it in a podcast episode.", "Open, body, close."),

  // ─── Student Council ───
  q("council_g1_1", "student_council", 1, "Vote For Me", "Tell us why you'd be a great class helper.", "Speak to your classmates."),
  q("council_g1_2", "student_council", 1, "My Promise", "What's one promise you'd make to the class if you were chosen?", "Speak with confidence."),
  q("council_g2_1", "student_council", 2, "Make School Fun", "Pitch one idea to make school more fun.", "Class election speech."),
  q("council_g2_2", "student_council", 2, "Be a Good Leader", "What makes a good class leader? Convince us you are one.", "Speak to your peers."),
  q("council_g3_1", "student_council", 3, "Big Idea", "Pitch a real idea you'd push for as student council.", "Election speech."),
  q("council_g3_2", "student_council", 3, "Listening Leader", "Why should leaders listen as much as they talk?", "Speak with conviction."),
  q("council_g4_1", "student_council", 4, "My Manifesto", "Give a 60-second campaign speech with 3 promises.", "School assembly."),
  q("council_g4_2", "student_council", 4, "Tough Choices", "Tell us how you'd handle a tough decision as a leader.", "Speak honestly."),

  // ─── Policy Proposals ───
  q("policy_g1_1", "student_council", 1, "Longer Playtime", "Propose a small change: more playtime. Why?", "Speak to your teacher."),
  q("policy_g1_2", "student_council", 1, "Library Day", "Propose a special library day each week. Why?", "Convince the class."),
  q("policy_g2_1", "student_council", 2, "Reading Corner", "Propose a cosy reading corner in your classroom.", "Pitch it to the teacher."),
  q("policy_g2_2", "student_council", 2, "No Litter Rule", "Propose a no-litter rule and how it would work.", "Speak to the class."),
  q("policy_g3_1", "student_council", 3, "Buddy System", "Propose a buddy system for new students.", "Pitch to the school council."),
  q("policy_g3_2", "student_council", 3, "Green School", "Propose one change to make your school greener.", "Make your case."),
  q("policy_g4_1", "student_council", 4, "School App", "Propose a school app and what it should do.", "Pitch with reasons and benefits."),
  q("policy_g4_2", "student_council", 4, "Mental Health", "Propose how the school could better support student wellbeing.", "60-second proposal."),
];

export function getSchoolQuestionsByGrade(grade: number): SchoolQuestion[] {
  return SCHOOL_QUESTIONS.filter((q) => q.grade === grade);
}

export function getSchoolQuestionsByCategory(categoryId: SchoolCategoryId): SchoolQuestion[] {
  return SCHOOL_QUESTIONS.filter((q) => q.categoryId === categoryId);
}

export function getSchoolQuestionsByCategoryAndGrade(
  categoryId: SchoolCategoryId,
  grade: number
): SchoolQuestion[] {
  return SCHOOL_QUESTIONS.filter((q) => q.categoryId === categoryId && q.grade === grade);
}

export function getSchoolQuestionById(id: string): SchoolQuestion | undefined {
  return SCHOOL_QUESTIONS.find((q) => q.id === id);
}

export function getSchoolCategory(id: SchoolCategoryId): SchoolCategory | undefined {
  return SCHOOL_CATEGORIES.find((c) => c.id === id);
}

/** Categories visible to a teacher whose grades are `teacherGrades`. */
export function getCategoriesForTeacher(teacherGrades: number[]): SchoolCategory[] {
  if (!teacherGrades || teacherGrades.length === 0) return SCHOOL_CATEGORIES;
  // All 8 categories are available for any grade — visibility is question-level.
  return SCHOOL_CATEGORIES;
}
