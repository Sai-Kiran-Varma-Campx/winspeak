# School Questions from Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the 35 school questions (from the PDF) into the database, serve them via API, and update the frontend to fetch questions from the backend instead of using hardcoded constants. Teacher's grades control which grades appear in the Add Student form and in Step 2 grade selection, but all 5 questions of a category are always shown regardless of grade.

**Architecture:** New `school_questions` DB table seeded with the 35 questions (5 per category, 7 categories). New API endpoint `GET /api/school/questions?categoryId=xxx` returns questions for a category. Frontend Step 2 fetches from this API. Login/me endpoints are fixed to return teacher's `grades` array. The grade selector in Step 2 and Add Student form are filtered by teacher's assigned grades.

**Tech Stack:** Drizzle ORM + Neon Postgres (backend), React + TypeScript (frontend), Hono (API framework)

---

### Task 1: Fix login and /me endpoints to return grades

**Files:**
- Modify: `server/src/routes/users.ts:127` (login response)
- Modify: `server/src/routes/users.ts:176` (/me response)

- [ ] **Step 1: Fix login to return grades**

In `server/src/routes/users.ts`, line 127, change:
```typescript
return c.json({ token, user: { id: user.id, name: user.name } });
```
to:
```typescript
return c.json({ token, user: { id: user.id, name: user.name, grades: user.grades } });
```

- [ ] **Step 2: Verify /me already returns grades**

The `/me` endpoint uses `const { passwordHash: _, ...safeUser } = user;` which includes `grades` in `safeUser` since it's on the user object. Verify by checking `safeUser` includes grades — it does because destructuring only removes `passwordHash`. No change needed here.

- [ ] **Step 3: Restart server and verify**

Run: `cd server && npm run dev`
Test: `curl -X POST localhost:3001/api/users/login -H 'Content-Type: application/json' -d '{"username":"test","password":"test"}'`
Expected: Response includes `user.grades` array.

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/users.ts
git commit -m "fix: return grades in login response"
```

---

### Task 2: Create school_questions table in DB schema

**Files:**
- Modify: `server/src/db/schema.ts` (add new table + types)

- [ ] **Step 1: Add school_questions table to schema**

Add to the end of `server/src/db/schema.ts`, before the type exports:

```typescript
// ── School questions (content from PDF, 5 per category) ───────────────────
export const schoolQuestions = pgTable(
  "school_questions",
  {
    id: text("id").primaryKey(), // e.g. "circletime_1"
    categoryId: text("category_id").notNull(),
    questionNumber: integer("question_number").notNull(), // 1-5
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    scenario: text("scenario").notNull(),
    durationSecs: integer("duration_secs").notNull().default(60),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_school_questions_category").on(t.categoryId),
  ]
);

export type SchoolQuestion = typeof schoolQuestions.$inferSelect;
export type NewSchoolQuestion = typeof schoolQuestions.$inferInsert;
```

- [ ] **Step 2: Commit**

```bash
git add server/src/db/schema.ts
git commit -m "feat: add school_questions table to schema"
```

---

### Task 3: Create seed script for the 35 questions

**Files:**
- Create: `server/src/db/seed-school-questions.ts`

- [ ] **Step 1: Create the seed script**

Create `server/src/db/seed-school-questions.ts`:

```typescript
import { db } from "./index.js";
import { schoolQuestions } from "./schema.js";

const QUESTIONS = [
  // ─── Circle Time (Reception, 3-4 years) ───
  { id: "circletime_1", categoryId: "circletime", questionNumber: 1, title: "My Favourite Toy", prompt: "Show or imagine your favourite toy. Say what it is and one thing you like doing with it.", scenario: "It's circle time. Everyone is sitting on the carpet listening to you." },
  { id: "circletime_2", categoryId: "circletime", questionNumber: 2, title: "Breakfast Talk", prompt: "Talk about what you eat in the morning and say one reason you like it.", scenario: "It's circle time. Share with your friends." },
  { id: "circletime_3", categoryId: "circletime", questionNumber: 3, title: "A Sound I Hear", prompt: "Talk about a sound you hear (at home or outside) and show how it sounds using your voice.", scenario: "It's circle time. Everyone is listening." },
  { id: "circletime_4", categoryId: "circletime", questionNumber: 4, title: "On My Way to School", prompt: "Describe one thing you saw on your way to school and say what colour or shape it was.", scenario: "It's circle time. Tell your friends what you noticed." },
  { id: "circletime_5", categoryId: "circletime", questionNumber: 5, title: "My Favourite Place", prompt: "Name your favourite place in your home and say one thing you do there.", scenario: "It's circle time. Share with your friends in the circle." },

  // ─── Building Talks (Early Years 1, 4-5 years) ───
  { id: "building_talks_1", categoryId: "building_talks", questionNumber: 1, title: "Build a House", prompt: "Build a house using blocks. Tell the class what it is, which parts you made first and next, and who can live in it.", scenario: "You just finished building something amazing. Tell the class about it." },
  { id: "building_talks_2", categoryId: "building_talks", questionNumber: 2, title: "Build a Bridge", prompt: "Build a bridge. Explain what it is for, how you made it stay up, and why the animals need it.", scenario: "You just finished building something. Explain it to the class." },
  { id: "building_talks_3", categoryId: "building_talks", questionNumber: 3, title: "Build a Tower", prompt: "Build a tower. Say what blocks or shapes you used, how you built it step by step, and why you wanted it to be tall.", scenario: "Show and tell time. Describe your tower." },
  { id: "building_talks_4", categoryId: "building_talks", questionNumber: 4, title: "Build a Parking Area", prompt: "Build a parking area or garage. Explain what you made, where the cars go, and how you built the different parts.", scenario: "You built something for the toy cars. Tell everyone about it." },
  { id: "building_talks_5", categoryId: "building_talks", questionNumber: 5, title: "Build a Bed for Teddy", prompt: "Build a bed or sleeping place for a teddy. Tell the class what it is, how you made it, and why it is good for resting.", scenario: "Teddy needs a place to sleep. Explain what you built." },

  // ─── TEDlets (Early Years 2, 5-6 years) ───
  { id: "tedlets_1", categoryId: "tedlets", questionNumber: 1, title: "My Favourite Fruit", prompt: "Bring the fruit, a picture, or a drawing. Tell us what it is, what it looks or tastes like, and why you like it.", scenario: "You're giving a 1-minute talk to your class using a prop or picture." },
  { id: "tedlets_2", categoryId: "tedlets", questionNumber: 2, title: "An Amazing Animal", prompt: "Use a toy, mask, or picture. Say what animal it is, where it lives, and one thing it can do well.", scenario: "It's your turn for a TEDlet talk. Use your prop and speak clearly." },
  { id: "tedlets_3", categoryId: "tedlets", questionNumber: 3, title: "A Cool Vehicle", prompt: "Bring a toy or drawing. Explain what it is called, where it goes, and why you find it exciting or useful.", scenario: "Show your prop and give your 1-minute talk." },
  { id: "tedlets_4", categoryId: "tedlets", questionNumber: 4, title: "My Favourite Character", prompt: "Use a book, picture, or drawing. Tell us who the character is, what they do, and why you like them.", scenario: "Present your character to the class in a TEDlet talk." },
  { id: "tedlets_5", categoryId: "tedlets", questionNumber: 5, title: "A Useful Object", prompt: "Bring the object or a picture. Explain what it is, how you use it, and why it helps you in class.", scenario: "It's your 1-minute talk. Show and explain your object." },

  // ─── Interview Discussion (Grade 1, 6-7 years) ───
  { id: "interview_discussion_1", categoryId: "interview_discussion", questionNumber: 1, title: "Keep the Room Clean", prompt: "Imagine starting a class effort to keep the room clean — explain why it matters and how your classmates can help.", scenario: "You're speaking to your peers about a community project you care about." },
  { id: "interview_discussion_2", categoryId: "interview_discussion", questionNumber: 2, title: "Lost-and-Found Box", prompt: "Propose setting up a lost-and-found box in class — explain why it helps and how classmates can use it.", scenario: "You're advocating for a project that helps everyone." },
  { id: "interview_discussion_3", categoryId: "interview_discussion", questionNumber: 3, title: "Sharing Books", prompt: "Suggest sharing books among classmates — explain why it helps and how others can join in.", scenario: "Tell your class about your idea and why they should support it." },
  { id: "interview_discussion_4", categoryId: "interview_discussion", questionNumber: 4, title: "Moving Between Activities", prompt: "Present an idea to improve how students move between activities in class — explain why it matters and how classmates can follow it together.", scenario: "You have an idea to make the classroom work better." },
  { id: "interview_discussion_5", categoryId: "interview_discussion", questionNumber: 5, title: "Welcoming New Students", prompt: "Encourage welcoming new students — explain why it matters and how classmates can help.", scenario: "Speak to your class about making everyone feel included." },

  // ─── Voice for Change (Grade 2, 7-8 years) ───
  { id: "voice_for_change_1", categoryId: "voice_for_change", questionNumber: 1, title: "Protect Trees", prompt: "Design a campaign to protect trees — explain why it matters and how students can join.", scenario: "You're leading a campaign and speaking to your class about a cause you care about." },
  { id: "voice_for_change_2", categoryId: "voice_for_change", questionNumber: 2, title: "Avoid Food Waste", prompt: "Create an idea to avoid food waste — describe what to do and how others can participate.", scenario: "Present your campaign idea to your classmates and parents." },
  { id: "voice_for_change_3", categoryId: "voice_for_change", questionNumber: 3, title: "Keep Parks Clean", prompt: "Plan a campaign to keep parks clean — explain steps and how people can take part.", scenario: "You're speaking at a school assembly about your campaign." },
  { id: "voice_for_change_4", categoryId: "voice_for_change", questionNumber: 4, title: "Reduce Noise", prompt: "Suggest a campaign to reduce noise in shared spaces — describe what actions to take and how to spread awareness.", scenario: "Present your campaign to the school council." },
  { id: "voice_for_change_5", categoryId: "voice_for_change", questionNumber: 5, title: "Encourage Exercise", prompt: "Create a campaign to encourage exercise — explain what actions to promote and how others can join.", scenario: "Speak to your class about why this matters." },

  // ─── Podcast Playground (Grade 3, 8-9 years) ───
  { id: "podcast_playground_1", categoryId: "podcast_playground", questionNumber: 1, title: "A Group Game", prompt: "Record an episode about a group game you enjoy — explain how it is played and why it is fun.", scenario: "You're recording a mini-podcast episode on a topic you love." },
  { id: "podcast_playground_2", categoryId: "podcast_playground", questionNumber: 2, title: "An Interesting Lesson", prompt: "Share a lesson you found interesting — describe what you learned and why it stood out.", scenario: "Script and record your podcast episode." },
  { id: "podcast_playground_3", categoryId: "podcast_playground", questionNumber: 3, title: "A Competition", prompt: "Create a podcast about a competition you experienced — explain what happened and what you learned.", scenario: "You're the host of your own podcast. Tell the story." },
  { id: "podcast_playground_4", categoryId: "podcast_playground", questionNumber: 4, title: "A Creative Activity", prompt: "Record about a creative activity you completed — describe the steps and the result.", scenario: "Your podcast listeners want to hear about what you made." },
  { id: "podcast_playground_5", categoryId: "podcast_playground", questionNumber: 5, title: "Something in Nature", prompt: "Create a podcast about something in nature that amazes you — describe what it is and explain what you find most surprising about it.", scenario: "Record a nature episode for your podcast." },

  // ─── Student Council Speeches & Policy (Grade 4, 9-10 years) ───
  { id: "student_council_1", categoryId: "student_council", questionNumber: 1, title: "Propose a New Club", prompt: "Propose starting a new club — explain its purpose, activities, and benefits.", scenario: "You're giving a speech at a student council meeting." },
  { id: "student_council_2", categoryId: "student_council", questionNumber: 2, title: "Improve Homework", prompt: "Suggest improvements to the homework system — describe the change and expected outcome.", scenario: "Present your proposal to the student council." },
  { id: "student_council_3", categoryId: "student_council", questionNumber: 3, title: "Change Classroom Rules", prompt: "Recommend changes to classroom rules — present two improvements, why they are needed, and how you would respond to a disagreement.", scenario: "Deliver your speech and handle a rebuttal." },
  { id: "student_council_4", categoryId: "student_council", questionNumber: 4, title: "Peer Mentoring", prompt: "Propose a peer mentoring system — explain how it works, roles involved, and benefits.", scenario: "Present your policy to the school council." },
  { id: "student_council_5", categoryId: "student_council", questionNumber: 5, title: "A School Event", prompt: "Present a school event idea — describe the plan, roles, expected outcome, and answer one possible peer question.", scenario: "Pitch your event idea and handle questions." },
];

export async function seedSchoolQuestions() {
  console.log("Seeding school questions...");

  // Upsert — insert or skip if already exists
  for (const q of QUESTIONS) {
    try {
      await db.insert(schoolQuestions).values(q).onConflictDoNothing();
    } catch (err) {
      console.error(`Failed to seed ${q.id}:`, err);
    }
  }

  console.log(`Seeded ${QUESTIONS.length} school questions.`);
}

// Allow running directly: npx tsx server/src/db/seed-school-questions.ts
const isDirectRun = process.argv[1]?.includes("seed-school-questions");
if (isDirectRun) {
  seedSchoolQuestions().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 2: Run the migration to create the table**

Since this project uses Drizzle with Neon, push the schema:
```bash
cd server && npx drizzle-kit push
```

- [ ] **Step 3: Run the seed script**

```bash
cd server && npx tsx src/db/seed-school-questions.ts
```
Expected: "Seeded 35 school questions."

- [ ] **Step 4: Commit**

```bash
git add server/src/db/schema.ts server/src/db/seed-school-questions.ts
git commit -m "feat: add school_questions table and seed 35 questions from PDF"
```

---

### Task 4: Add API endpoint to fetch questions by category

**Files:**
- Modify: `server/src/routes/school.ts` (add GET /questions route)

- [ ] **Step 1: Add the questions endpoint**

At the top of `server/src/routes/school.ts`, add import:
```typescript
import { students, studentAttempts, schoolQuestions, type User } from "../db/schema.js";
```

Then add this route after the students CRUD section (before the attempts section):

```typescript
// ── School questions ──────────────────────────────────────────────────────
// GET /api/school/questions?categoryId=circletime
app.get("/questions", async (c) => {
  const categoryId = c.req.query("categoryId");

  if (!categoryId) {
    // Return all questions grouped — or just all
    const rows = await db
      .select()
      .from(schoolQuestions)
      .orderBy(schoolQuestions.categoryId, schoolQuestions.questionNumber);
    return c.json(rows);
  }

  const rows = await db
    .select()
    .from(schoolQuestions)
    .where(eq(schoolQuestions.categoryId, categoryId))
    .orderBy(schoolQuestions.questionNumber);

  return c.json(rows);
});
```

- [ ] **Step 2: Restart server and verify**

```bash
curl localhost:3001/api/school/questions?categoryId=circletime
```
Expected: JSON array of 5 Circle Time questions.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/school.ts
git commit -m "feat: add GET /api/school/questions endpoint"
```

---

### Task 5: Add frontend API method for fetching questions

**Files:**
- Modify: `winspeak/src/lib/api.ts` (add listSchoolQuestions method)

- [ ] **Step 1: Add the API method**

In `src/lib/api.ts`, in the `api` object (in the School POC section), add:

```typescript
  listSchoolQuestions(categoryId?: string) {
    const qs = categoryId ? `?categoryId=${categoryId}` : "";
    return request<any[]>(`/school/questions${qs}`);
  },
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: add listSchoolQuestions API method"
```

---

### Task 6: Update frontend categories and remove hardcoded questions

**Files:**
- Modify: `winspeak/src/constants/challenges-school.ts` (remove hardcoded questions, keep categories + types + helper functions that now call API)

- [ ] **Step 1: Rewrite challenges-school.ts**

Replace the entire file content with:

```typescript
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
  questionNumber: number;
  title: string;
  prompt: string;
  scenario: string;
  durationSecs: number;
}

export const SCHOOL_CATEGORIES: SchoolCategory[] = [
  { id: "circletime",           title: "Circle Time",            emoji: "🟢", description: "Children share full sentences during Circle Time.",             pastel: "mint",   gradeLabel: "Reception",      ageRange: "3–4 years" },
  { id: "building_talks",       title: "Building Talks",        emoji: "🧱", description: "Describe structures — what, how, and why.",      pastel: "yellow", gradeLabel: "Early Years 1",  ageRange: "4–5 years" },
  { id: "tedlets",              title: "TEDlets",               emoji: "🎤", description: "1-minute talks with props and visuals.",               pastel: "pink",   gradeLabel: "Early Years 2",  ageRange: "5–6 years" },
  { id: "interview_discussion", title: "Interview Discussion",  emoji: "🎙️", description: "Advocate for a community project.",                    pastel: "sky",    gradeLabel: "Grade 1",        ageRange: "6–7 years" },
  { id: "voice_for_change",     title: "Voice for Change",      emoji: "📣", description: "Lead a campaign for a social cause.",  pastel: "peach",  gradeLabel: "Grade 2",        ageRange: "7–8 years" },
  { id: "podcast_playground",   title: "Podcast Playground",    emoji: "🎧", description: "Script and record a mini-podcast episode.",              pastel: "lilac",  gradeLabel: "Grade 3",        ageRange: "8–9 years" },
  { id: "student_council",      title: "Student Council Speeches & Policy", emoji: "🏫", description: "Write and deliver speeches for school changes.", pastel: "sky", gradeLabel: "Grade 4", ageRange: "9–10 years" },
];

export function getSchoolCategory(id: SchoolCategoryId): SchoolCategory | undefined {
  return SCHOOL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesForTeacher(_teacherGrades: number[]): SchoolCategory[] {
  // All categories are accessible to all teachers
  return SCHOOL_CATEGORIES;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/challenges-school.ts
git commit -m "refactor: remove hardcoded questions, keep categories only"
```

---

### Task 7: Update Step 2 (ChallengeStep2GradeQuestion) to fetch questions from API

**Files:**
- Modify: `winspeak/src/screens/school/ChallengeStep2GradeQuestion.tsx`

- [ ] **Step 1: Replace hardcoded question lookup with API call**

Key changes:
1. Remove imports of `getSchoolQuestionsByCategoryAndGrade`
2. Add `import { api } from "@/lib/api"`
3. Add state: `const [questions, setQuestions] = useState<any[]>([])` and `const [loadingQ, setLoadingQ] = useState(false)`
4. When a grade is selected, fetch questions from API by categoryId (NOT filtered by grade)
5. The grade selection only shows teacher's grades from `store.grades`

Replace the `questions` computation and the `useEffect` that resets `picked` with:

```typescript
const [questions, setQuestions] = useState<any[]>([]);
const [loadingQ, setLoadingQ] = useState(false);

// Fetch questions when grade is selected (all questions for the category)
useEffect(() => {
  if (!grade || !session.selectedCategory) return;
  setLoadingQ(true);
  setPicked(null);
  api.listSchoolQuestions(session.selectedCategory).then((rows) => {
    setQuestions(rows);
    setLoadingQ(false);
  }).catch(() => setLoadingQ(false));
}, [grade, session.selectedCategory]);
```

Also remove all old imports: `getSchoolQuestionsByCategoryAndGrade`, `type SchoolQuestion` from challenges-school.

- [ ] **Step 2: Commit**

```bash
git add src/screens/school/ChallengeStep2GradeQuestion.tsx
git commit -m "feat: fetch school questions from API instead of hardcoded constants"
```

---

### Task 8: Update SchoolRecording to use question data from session

**Files:**
- Modify: `winspeak/src/context/SchoolSessionContext.tsx` (ensure question shape matches new DB shape)

- [ ] **Step 1: Update SchoolQuestion type in session context**

The session context stores `selectedQuestion`. Update the type to match the new DB shape (which has `questionNumber` instead of `grade`, and no `categoryId` needed separately since the category is already selected).

Check `SchoolSessionContext.tsx` — the `selectedQuestion` should accept the shape returned by the API: `{ id, categoryId, questionNumber, title, prompt, scenario, durationSecs }`.

Update the `SchoolQuestion` type reference in the context to use the one from `challenges-school.ts` (which now matches the DB shape).

- [ ] **Step 2: Commit**

```bash
git add src/context/SchoolSessionContext.tsx
git commit -m "refactor: align session question type with DB schema"
```

---

### Task 9: Update Add Student form grade dropdown to use teacher's grades

**Files:**
- Modify: `winspeak/src/screens/school/AddStudentModal.tsx` (already uses `teacherGrades` prop — verify it's correctly filtered)

- [ ] **Step 1: Verify Add Student form**

The `AddStudentModal` already receives `teacherGrades` prop from `store.grades` and filters the grade buttons. Verify the grade buttons only show grades from `teacherGrades`. The current code at line 88 already does:
```typescript
{[1, 2, 3, 4].map((g) => {
  const allowed = allowedGrades.includes(g);
```
This is correct — grades not in `allowedGrades` are disabled. No change needed.

- [ ] **Step 2: No commit needed — already working**

---

### Task 10: Verify end-to-end flow

- [ ] **Step 1: Start both servers**

```bash
cd winspeak && npm run dev
```

- [ ] **Step 2: Test the flow**

1. Login as a teacher with grades [1, 4]
2. Go to Add Student — verify only Grade 1 and 4 buttons are enabled
3. Go to Administer Challenge — all 7 categories visible
4. Click "Circle Time" → Step 2 shows only Grade 1 and 4 in grade selector
5. Select Grade 1 → all 5 Circle Time questions appear (from API)
6. Select Grade 4 → same 5 Circle Time questions appear
7. Click any other category (e.g. Student Council) → Step 2 shows Grade 1 and 4
8. Select either grade → all 5 Student Council questions appear

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: school questions from backend — complete implementation"
```
