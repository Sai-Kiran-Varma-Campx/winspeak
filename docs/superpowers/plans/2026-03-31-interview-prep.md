# Interview Prep Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~62 new challenges (50 HR behavioral + 12 SAP ABAP technical) in a new "Interview Prep" section with category-aware AI evaluation.

**Architecture:** Extend existing Challenge type with `category`, `referenceAnswer`, and `evaluationCriteria` fields. Split challenge data into per-category files. Add a new InterviewPrep screen with HR/ABAP tabs. Reuse the existing Question → Recording → Analysing → Report flow with category-aware back navigation and AI prompt modifications.

**Tech Stack:** React + TypeScript, Tailwind CSS, Vite, Google Gemini AI, Hono (unchanged), Vercel Blob CDN for voice files.

**Spec:** `docs/superpowers/specs/2026-03-31-interview-prep-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/constants/challenges-speaking.ts` | Existing c1-c14 challenges extracted with `category: "speaking"` |
| `src/constants/challenges-hr.ts` | 50 HR behavioral challenges (hr1-hr50) |
| `src/constants/challenges-abap.ts` | 12 SAP ABAP technical challenges (abap1-abap12) |
| `src/constants/checkpoints-hr.ts` | CHALLENGE_CHECKPOINTS for HR challenges |
| `src/constants/checkpoints-abap.ts` | CHALLENGE_CHECKPOINTS for ABAP challenges |
| `src/screens/InterviewPrep.tsx` | Interview Prep page with HR/ABAP tabs |
| `src/lib/challengeUtils.ts` | Helper: `getChallengeBackPath(category)` + `scoreColor()` (deduplicated) |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `ChallengeCategory`, `referenceAnswer?`, `evaluationCriteria?` to Challenge |
| `src/constants/index.ts` | Import and merge challenge arrays; extract speaking checkpoints; re-export |
| `src/services/gemini.ts` | Extend `analyzeAnswer()` prompt for HR evaluation criteria and ABAP reference answers |
| `src/screens/Dashboard.tsx` | Add Interview Prep navigation card; import `scoreColor` from utils |
| `src/screens/Question.tsx` | Category-aware back navigation; import `scoreColor` from utils |
| `src/screens/Recording.tsx` | Category-aware back navigation |
| `src/screens/Analysing.tsx` | Category-aware error navigation |
| `src/screens/Report.tsx` | Category-aware back/retry navigation; show `referenceAnswer` as ideal response for ABAP |
| `src/screens/History.tsx` | Import `scoreColor` from utils |
| `src/App.tsx` | Add `/interview-prep` route |
| `src/components/MobileNav.tsx` | Add Interview Prep to drawer nav items |
| `src/components/AppSidebar.tsx` | Add Interview Prep to sidebar nav |
| `scripts/generate-voices.mjs` | Add HR + ABAP challenge definitions for voice generation |
| `scripts/upload-voices-to-blob.mjs` | Add HR + ABAP challenge IDs |
| `src/constants/voiceUrls.ts` | Add URLs after voice upload (placeholder entries until generated) |

---

## Task 1: Extend Challenge Type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add ChallengeCategory type and new fields**

Open `src/types/index.ts` and add the category type and new optional fields to the Challenge interface:

```typescript
// Add after ChallengeTier type (line 26)
export type ChallengeCategory = "speaking" | "hr" | "abap";
```

Then update the `Challenge` interface to add three fields at the end:

```typescript
export interface Challenge {
  id: string;
  title: string;
  description: string;
  scenario: string;
  prompt: string;
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
```

- [ ] **Step 2: Verify the build still compiles**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -30`

Expected: Type errors in files that define Challenge objects without `category` — that's correct, we'll fix those next.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add ChallengeCategory type and new Challenge fields"
```

---

## Task 2: Create challengeUtils helper (deduplicate scoreColor)

**Files:**
- Create: `src/lib/challengeUtils.ts`

- [ ] **Step 1: Create the shared utility file**

Create `src/lib/challengeUtils.ts`:

```typescript
import type { ChallengeCategory } from "@/types";

/** Color based on score thresholds. Used in Dashboard, Report, History, InterviewPrep. */
export function scoreColor(score: number): string {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

/** Returns the route to navigate back to based on challenge category. */
export function getChallengeBackPath(category: ChallengeCategory): string {
  if (category === "hr" || category === "abap") return "/interview-prep";
  return "/";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/challengeUtils.ts
git commit -m "feat: add challengeUtils with scoreColor and getChallengeBackPath"
```

---

## Task 3: Extract speaking challenges and refactor constants/index.ts

**Files:**
- Create: `src/constants/challenges-speaking.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: Create challenges-speaking.ts**

Create `src/constants/challenges-speaking.ts` with the existing 14 challenges, adding `category: "speaking"` to each. Copy the full challenge array from `src/constants/index.ts` lines 16-227 and add the category field:

```typescript
import type { Challenge } from "@/types";

export const SPEAKING_CHALLENGES: Challenge[] = [
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
    scenario: "It's the first day of a new semester. Your professor asks everyone to stand up and introduce themselves to the class — who you are, what you're studying, and what you're passionate about. 40 students are watching. You have 60 seconds.",
    prompt: "Introduce yourself confidently. In under 60 seconds: who you are, what you study, what drives you, and one interesting thing about yourself. Make people want to know you.",
    category: "speaking",
  },
  // ... all 14 challenges with category: "speaking" added to each
  // Copy ALL c1-c14 from current index.ts, add `category: "speaking"` to each object
];
```

Copy every challenge (c1 through c14) exactly as-is from the current `src/constants/index.ts`, adding `category: "speaking"` to each.

- [ ] **Step 2: Extract speaking checkpoints**

In the same file, also export the speaking checkpoints. Or create a separate file — but since they're tightly coupled to the challenges, keep them together:

At the bottom of `challenges-speaking.ts`, add:

```typescript
export const SPEAKING_CHECKPOINTS: Record<string, string[]> = {
  c1: [
    "State your name and what you study",
    "Mention what you're passionate about or interested in",
    "Share one unique or interesting fact about yourself",
    "Project confidence and friendliness",
    "End with something memorable that invites conversation",
  ],
  // ... copy ALL c1-c14 checkpoints from current index.ts (lines 247-346)
};
```

Copy all checkpoint entries (c1 through c14) exactly from the current `src/constants/index.ts` lines 247-346.

- [ ] **Step 3: Refactor index.ts to import from challenge files**

Replace the `CHALLENGES` array and `CHALLENGE_CHECKPOINTS` in `src/constants/index.ts` with imports. The file should become:

```typescript
import type { Challenge, AnalysisStep } from "@/types";
import { SPEAKING_CHALLENGES, SPEAKING_CHECKPOINTS } from "./challenges-speaking";

export const TIPS: string[] = [
  // ... keep existing TIPS unchanged (lines 3-14)
];

export const CHALLENGES: Challenge[] = [
  ...SPEAKING_CHALLENGES,
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
export const CIRCULAR_TIMER_CIRCUMFERENCE = 2 * Math.PI * CIRCULAR_TIMER_RADIUS;

export const CHALLENGE_CHECKPOINTS: Record<string, string[]> = {
  ...SPEAKING_CHECKPOINTS,
};

export const TIER_RUBRICS: Record<
  string,
  { calibration: string; skillGuidelines: Record<string, string> }
> = {
  // ... keep ALL existing tier rubrics exactly as-is (Beginner, Intermediate, Advanced)
};
```

Remove the old inline `CHALLENGES` array and `CHALLENGE_CHECKPOINTS` object — they're now imported from `challenges-speaking.ts`.

- [ ] **Step 4: Verify build compiles**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors (the challenge objects now have `category: "speaking"`).

- [ ] **Step 5: Commit**

```bash
git add src/constants/challenges-speaking.ts src/constants/index.ts
git commit -m "refactor: extract speaking challenges to separate file"
```

---

## Task 4: Create HR challenges data (hr1-hr50)

**Files:**
- Create: `src/constants/challenges-hr.ts`
- Create: `src/constants/checkpoints-hr.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: Create challenges-hr.ts**

Create `src/constants/challenges-hr.ts` with all 50 HR challenges. Each challenge follows this pattern:

```typescript
import type { Challenge } from "@/types";

export const HR_CHALLENGES: Challenge[] = [
  {
    id: "hr1",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Adapting to Change",
    description: "Describe how you handled a significant change.",
    scenario: "You're in an HR interview for a campus placement. The interviewer leans forward and asks you a behavioral question to assess your adaptability and growth mindset.",
    prompt: "Tell me about the biggest change you've had to deal with. How did you adapt to that change?",
    category: "hr",
    evaluationCriteria: "Listen for excitement about tackling new challenges and a willingness to leave their comfort zone, knowing they'll learn something valuable from the experience.",
  },
  {
    id: "hr2",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Adjusting to Others",
    description: "How you adapted to a colleague's working style.",
    scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your flexibility and ability to collaborate with different personality types.",
    prompt: "Tell me about a time when you had to adjust to a colleague's working style in order to complete a project or achieve your outcomes.",
    category: "hr",
    evaluationCriteria: "Listen for a willingness to be flexible when required, and the ability to reflect on what they learned from the experience, both good and bad.",
  },
  // ... continue for all 50 HR questions
  // Tier assignment:
  //   Beginner (xp: 500, passingScore: 55): icebreaker/simple questions like
  //     "What are the three things most important to you in a job?"
  //     "What's the most interesting thing about you not on your resume?"
  //     "How would you describe yourself in 5 words?"
  //     "What is your biggest strength? Weakness?"
  //     "How do you feel about working in a team environment?"
  //     "How do you feel about working overtime?"
  //   Intermediate (xp: 800, passingScore: 65): behavioral/situational like
  //     "Tell me about adapting to change"
  //     "Working with difficult people"
  //     "Communicating when not understood"
  //     "Delegating tasks"
  //     "Balancing competing deadlines"
  //   Advanced (xp: 1000, passingScore: 70): leadership/complex scenarios like
  //     "Leading by example"
  //     "Toughest decision in last 6 months"
  //     "Selling an idea to coworkers"
  //     "Persuading someone resistant to change"
  //     "Handling a situation without your manager"
  //
  // For questions WITHOUT explicit "Listen for..." criteria, set evaluationCriteria
  // to a brief description of what a good answer demonstrates. Examples:
  //   "How do you minimize distractions?" →
  //   evaluationCriteria: "Listen for specific, actionable strategies and self-awareness about personal productivity patterns."
];
```

Create ALL 50 challenges from the user's content. Map each question to the challenge structure. Every question gets:
- A unique `id` (hr1-hr50)
- A descriptive `title` (2-4 words)
- A short `description` for the card
- A `scenario` set in an interview context
- The `prompt` being the exact question text
- `evaluationCriteria` from the "Listen for..." text (or derived if none provided)
- Appropriate `tier`, `xp`, `passingScore`

- [ ] **Step 2: Create checkpoints-hr.ts**

Create `src/constants/checkpoints-hr.ts` with checkpoints derived from the evaluation criteria:

```typescript
export const HR_CHECKPOINTS: Record<string, string[]> = {
  hr1: [
    "Describe a specific change they experienced",
    "Explain the concrete steps they took to adapt",
    "Reflect on what they learned from the experience",
    "Show willingness to embrace new challenges",
    "Demonstrate growth mindset or positive outcome",
  ],
  hr2: [
    "Identify the colleague's different working style",
    "Describe specific adjustments they made",
    "Explain the outcome of the collaboration",
    "Reflect on what they learned from the experience",
    "Show flexibility and self-awareness",
  ],
  // ... checkpoints for all 50 HR challenges
  // Each question gets 3-5 checkpoints derived from:
  //   1. The "Listen for..." criteria (if present)
  //   2. The question's implicit expectations
  // Example for "How would you describe yourself in 5 words?":
  //   hr_n: [
  //     "Provide exactly five descriptive words",
  //     "Explain why each word applies to them",
  //     "Show self-awareness and authenticity",
  //     "Connect at least one word to professional context",
  //   ],
};
```

- [ ] **Step 3: Add HR imports to index.ts**

In `src/constants/index.ts`, add imports and merge:

```typescript
import { SPEAKING_CHALLENGES, SPEAKING_CHECKPOINTS } from "./challenges-speaking";
import { HR_CHALLENGES } from "./challenges-hr";
import { HR_CHECKPOINTS } from "./checkpoints-hr";

export const CHALLENGES: Challenge[] = [
  ...SPEAKING_CHALLENGES,
  ...HR_CHALLENGES,
];

export const CHALLENGE_CHECKPOINTS: Record<string, string[]> = {
  ...SPEAKING_CHECKPOINTS,
  ...HR_CHECKPOINTS,
};
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/constants/challenges-hr.ts src/constants/checkpoints-hr.ts src/constants/index.ts
git commit -m "feat: add 50 HR behavioral challenges with checkpoints"
```

---

## Task 5: Create ABAP challenges data (abap1-abap12)

**Files:**
- Create: `src/constants/challenges-abap.ts`
- Create: `src/constants/checkpoints-abap.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: Create challenges-abap.ts**

Create `src/constants/challenges-abap.ts` with all 12 ABAP challenges:

```typescript
import type { Challenge } from "@/types";

export const ABAP_CHALLENGES: Challenge[] = [
  {
    id: "abap1",
    week: "ABAP",
    tier: "Beginner",
    xp: 600,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Tell Me About Yourself",
    description: "Structure your self-introduction for an SAP ABAP interview.",
    scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role at a major enterprise. The interviewer opens with a standard but critical question to assess your communication and relevance.",
    prompt: "Tell me about yourself. Structure: Current status (10 sec) → Relevant training/experience (30 sec) → Key achievement (20 sec) → Why this role (10 sec).",
    category: "abap",
    referenceAnswer: `Fresher template: "I am a Computer Science graduate who recently completed a 45-day SAP ABAP certification programme covering ABAP fundamentals through CDS views and the RAP framework. I built a miniproject including a RAP-based OData V4 service, and received distinction for my capstone. I am targeting ABAP Cloud development roles because I want to work on enterprise systems that directly impact business operations."`,
  },
  {
    id: "abap2",
    week: "ABAP",
    tier: "Beginner",
    xp: 600,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Why SAP ABAP?",
    description: "Explain your motivation for choosing SAP ABAP as a specialisation.",
    scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer wants to understand your passion and knowledge of the SAP ecosystem.",
    prompt: "Why SAP ABAP as your specialisation?",
    category: "abap",
    referenceAnswer: `SAP processes over 87% of global commerce — ABAP gives direct access to that ecosystem. ABAP Cloud (CDS, RAP, Clean Core) is a modern, evolving skillset — not a commodity. S/4HANA migration is the largest SAP wave in history — demand exceeds supply of skilled developers.`,
  },
  {
    id: "abap3",
    week: "ABAP",
    tier: "Beginner",
    xp: 600,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "ABAP Cloud Developer Role",
    description: "Explain the ABAP Cloud Developer role and how it differs from classic ABAP.",
    scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer wants to test your understanding of the modern ABAP development paradigm.",
    prompt: "What is the ABAP Cloud Developer role? How does it differ from classic ABAP?",
    category: "abap",
    referenceAnswer: `An ABAP Cloud Developer builds extensions using only SAP-released APIs, enforced by ATC. Restricted items: WRITE, FORM/PERFORM, INCLUDE programs, custom Function Modules, SELECT on unreleased SAP tables, dynpros. Allowed: Global Classes, CDS View Entities, BDEFs, Service Definitions, ABAP SQL with @ host variables, ABAP Unit Tests, EML (MODIFY/READ ENTITY), released SAP APIs (C1 contract). Tools: Eclipse ADT exclusively — no SE38, SE80, or SE11 GUI.`,
  },
  // ... continue for abap4-abap12
  // Tier assignment:
  //   Beginner: abap1-abap3 (xp: 600, passingScore: 55)
  //   Intermediate: abap4-abap8 (xp: 900, passingScore: 65)
  //   Advanced: abap9-abap12 (xp: 1200, passingScore: 70)
  //
  // Each has `referenceAnswer` with the full model answer from the user's content.
  // Code samples in referenceAnswer are stored as plain text within template literals.
  // Example for abap4 (STANDARD vs SORTED vs HASHED):
  //   referenceAnswer: `STANDARD TABLE — O(n) linear lookup, supports index access...
  //     DATA lt_std TYPE STANDARD TABLE OF ty_flight WITH EMPTY KEY.
  //     ... (full answer from user's content)`
];
```

Create ALL 12 challenges from the user's SAP ABAP content (Q1-Q12). Each gets the full `referenceAnswer` including code samples as template literal strings.

- [ ] **Step 2: Create checkpoints-abap.ts**

Create `src/constants/checkpoints-abap.ts`:

```typescript
export const ABAP_CHECKPOINTS: Record<string, string[]> = {
  abap1: [
    "State current status briefly (education, recent certification)",
    "Mention relevant training or experience (SAP ABAP specific)",
    "Highlight a key achievement (project, distinction, etc.)",
    "Connect to why this specific role interests them",
  ],
  abap2: [
    "Mention SAP's market dominance (87% of global commerce or similar stat)",
    "Reference ABAP Cloud as modern and evolving (CDS, RAP, Clean Core)",
    "Mention S/4HANA migration driving demand",
  ],
  abap3: [
    "Explain that ABAP Cloud uses only SAP-released APIs",
    "List key restricted items (WRITE, FORM/PERFORM, custom FMs, etc.)",
    "List key allowed items (CDS Views, BDEFs, EML, ABAP Unit Tests)",
    "Mention Eclipse ADT as the exclusive tool",
  ],
  abap4: [
    "Describe STANDARD TABLE with O(n) lookup and index access",
    "Describe SORTED TABLE with O(log n) binary search",
    "Describe HASHED TABLE with O(1) hash lookup and no index access",
    "Provide appropriate use cases for each type",
  ],
  abap5: [
    "Demonstrate correct three-table JOIN syntax with aliases",
    "Mention use of tilde (~) for field qualification",
    "Mention @ prefix for ABAP host variables",
    "Explain JOINs as HANA code pushdown vs nested SELECTs",
  ],
  abap6: [
    "Name all four pillars: Encapsulation, Inheritance, Polymorphism, Abstraction",
    "Explain REDEFINITION for method overriding",
    "Explain SUPER for calling parent method",
    "Mention single inheritance limitation in ABAP",
  ],
  abap7: [
    "Define VDM as CDS view library with C1 release contract",
    "Describe Basic Interface View (one DB table, absorbs structure changes)",
    "Describe Composite View (joins multiple basic views)",
    "Describe Consumption View (tailored for one Fiori app, uses PROJECTION ON)",
  ],
  abap8: [
    "Explain the empty driver table risk (selects ALL rows)",
    "Show the IS NOT INITIAL check as mandatory",
    "Mention restrictions: no ORDER BY, no aggregates, no subqueries",
    "Recommend JOIN as preferred alternative",
  ],
  abap9: [
    "Describe CX_STATIC_CHECK (caller must catch, compile-time enforced)",
    "Describe CX_DYNAMIC_CHECK (no compile check, programming errors)",
    "Describe CX_NO_CHECK (fatal/system errors)",
    "Provide an example use case for each",
  ],
  abap10: [
    "Define Validation (checks data, cannot change it, triggered on save)",
    "Define Determination (sets field values, triggered on modify)",
    "Explain EML goes through full RAP pipeline",
    "Contrast with direct SQL which bypasses RAP",
  ],
  abap11: [
    "Explain AUTHORITY-CHECK as runtime program flow control",
    "Explain CDS Access Control (DCL) as database-level row filtering",
    "Contrast: DCL filters automatically for all consumers, AUTHORITY-CHECK is explicit",
    "Mention ACTVT values (03=Display, 01=Create, etc.)",
  ],
  abap12: [
    "Define optimistic locking (assumes conflicts are rare)",
    "Explain ETag as timestamp comparison mechanism",
    "Describe the conflict detection flow (read timestamp vs DB timestamp)",
    "Mention 'total etag' in behavior definition syntax",
  ],
};
```

- [ ] **Step 3: Add ABAP imports to index.ts**

In `src/constants/index.ts`, add ABAP imports alongside HR:

```typescript
import { SPEAKING_CHALLENGES, SPEAKING_CHECKPOINTS } from "./challenges-speaking";
import { HR_CHALLENGES } from "./challenges-hr";
import { HR_CHECKPOINTS } from "./checkpoints-hr";
import { ABAP_CHALLENGES } from "./challenges-abap";
import { ABAP_CHECKPOINTS } from "./checkpoints-abap";

export const CHALLENGES: Challenge[] = [
  ...SPEAKING_CHALLENGES,
  ...HR_CHALLENGES,
  ...ABAP_CHALLENGES,
];

export const CHALLENGE_CHECKPOINTS: Record<string, string[]> = {
  ...SPEAKING_CHECKPOINTS,
  ...HR_CHECKPOINTS,
  ...ABAP_CHECKPOINTS,
};
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/constants/challenges-abap.ts src/constants/checkpoints-abap.ts src/constants/index.ts
git commit -m "feat: add 12 SAP ABAP technical challenges with checkpoints"
```

---

## Task 6: Create InterviewPrep screen

**Files:**
- Create: `src/screens/InterviewPrep.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create InterviewPrep.tsx**

Create `src/screens/InterviewPrep.tsx`:

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHALLENGES } from "@/constants";
import { useStore } from "@/context/UserStoreContext";
import { useSession } from "@/context/SessionContext";
import { unlockAudioContext } from "@/services/gemini";
import { scoreColor } from "@/lib/challengeUtils";
import type { ChallengeCategory, ChallengeTier } from "@/types";

const TIER_STYLES: Record<ChallengeTier, { bg: string; color: string; border: string }> = {
  Beginner: { bg: "#22D37A11", color: "#22D37A", border: "#22D37A44" },
  Intermediate: { bg: "#7C5CFC11", color: "#7C5CFC", border: "#7C5CFC44" },
  Advanced: { bg: "#FFB83011", color: "#FFB830", border: "#FFB83044" },
};

type Tab = "hr" | "abap";

export default function InterviewPrep() {
  const navigate = useNavigate();
  const store = useStore();
  const session = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("hr");

  const hrChallenges = CHALLENGES.filter((c) => c.category === "hr");
  const abapChallenges = CHALLENGES.filter((c) => c.category === "abap");
  const challenges = activeTab === "hr" ? hrChallenges : abapChallenges;

  const completedHr = hrChallenges.filter((c) => store.completedChallengeIds.includes(c.id)).length;
  const completedAbap = abapChallenges.filter((c) => store.completedChallengeIds.includes(c.id)).length;

  function startChallenge(id: string) {
    unlockAudioContext();
    session.setChallengeId(id);
    navigate("/question");
  }

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 pb-5">
        <button
          onClick={() => navigate("/")}
          className="rounded-[10px] px-3.5 py-2 text-[18px] cursor-pointer border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          ←
        </button>
        <div>
          <div className="text-[11px] font-semibold tracking-[1.5px]" style={{ color: "var(--muted)" }}>
            INTERVIEW PREP
          </div>
          <div className="text-[22px] font-extrabold">Practice Questions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: "hr" as Tab, label: "HR Round", count: hrChallenges.length, completed: completedHr },
          { key: "abap" as Tab, label: "SAP ABAP", count: abapChallenges.length, completed: completedAbap },
        ]).map(({ key, label, count, completed }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 border rounded-[14px] p-3 text-center cursor-pointer transition-all"
            style={{
              background: activeTab === key ? "#7C5CFC18" : "var(--card)",
              borderColor: activeTab === key ? "#7C5CFC66" : "var(--border)",
              color: activeTab === key ? "#A78BFA" : "var(--text)",
            }}
          >
            <div className="text-[14px] font-bold">{label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
              {completed}/{count} completed
            </div>
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div className="flex flex-col gap-2.5">
        {challenges.map((ch) => {
          const isCompleted = store.completedChallengeIds.includes(ch.id);
          const attempts = store.getAttemptsForChallenge(ch.id);
          const best = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
          const tierStyle = ch.tier ? TIER_STYLES[ch.tier] : null;

          return (
            <div
              key={ch.id}
              className="border rounded-[18px] p-4 flex items-center gap-3.5"
              style={{
                background: "var(--card)",
                borderColor: isCompleted ? "#22D37A33" : "var(--border)",
              }}
            >
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
                style={{
                  background: isCompleted ? "#22D37A22" : "var(--surface)",
                  color: isCompleted ? "#22D37A" : "var(--muted)",
                }}
              >
                {isCompleted ? "✓" : ch.id.replace(/[a-z]/g, "").slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="text-[14px] font-bold truncate">{ch.title}</div>
                  {tierStyle && (
                    <span
                      className="border rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold flex-shrink-0"
                      style={{ background: tierStyle.bg, color: tierStyle.color, borderColor: tierStyle.border }}
                    >
                      {ch.tier}
                    </span>
                  )}
                </div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {ch.xp} XP
                  {best !== null && (
                    <span style={{ color: scoreColor(best) }}> · Best: {best}/100</span>
                  )}
                </div>
              </div>
              {isCompleted ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => startChallenge(ch.id)}
                    className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer"
                    style={{ background: "#7C5CFC22", color: "#A78BFA" }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      const attempt = store.attempts.find((a) => a.challengeId === ch.id);
                      if (attempt) navigate(`/report/${attempt.id}`);
                      else navigate("/history");
                    }}
                    className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer"
                    style={{ background: "#22D37A22", color: "#22D37A" }}
                  >
                    Results
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startChallenge(ch.id)}
                  className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer flex-shrink-0"
                  style={{ background: "#7C5CFC22", color: "#A78BFA" }}
                >
                  Start →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route to App.tsx**

In `src/App.tsx`, add the import and route:

Add import at the top (after line 20):
```typescript
import InterviewPrep from "@/screens/InterviewPrep";
```

Add route inside `<Routes>` (after the Dashboard route, around line 28):
```typescript
<Route path="/interview-prep" element={<InterviewPrep />} />
```

- [ ] **Step 3: Verify the page renders**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/InterviewPrep.tsx src/App.tsx
git commit -m "feat: add InterviewPrep screen with HR/ABAP tabs"
```

---

## Task 7: Add Interview Prep navigation to Dashboard

**Files:**
- Modify: `src/screens/Dashboard.tsx`

- [ ] **Step 1: Add Interview Prep card to Dashboard**

In `src/screens/Dashboard.tsx`, add a navigation card below the active challenge section. Add this import at the top:

```typescript
import { scoreColor } from "@/lib/challengeUtils";
```

Remove the local `scoreColor` function (lines 14-18).

Then add the Interview Prep card. Insert it after the `<ActiveChallengeCard>` component (after line 375), before the "Past Attempts" section:

```typescript
{/* Interview Prep Card */}
<div
  className="border rounded-[22px] p-5 mb-4 cursor-pointer transition-all"
  style={{
    background: "linear-gradient(135deg,#1A1D2E,#13151C)",
    borderColor: "#7C5CFC33",
  }}
  onClick={() => navigate("/interview-prep")}
  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7C5CFC66"; }}
  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#7C5CFC33"; }}
>
  <div className="flex items-center gap-3">
    <div
      className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] flex-shrink-0"
      style={{ background: "#7C5CFC22" }}
    >
      🎯
    </div>
    <div className="flex-1">
      <div className="text-[16px] font-extrabold">Interview Prep</div>
      <div className="text-[12px] mt-0.5" style={{ color: "var(--muted-soft)" }}>
        Practice HR & Technical Questions
      </div>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Dashboard.tsx
git commit -m "feat: add Interview Prep navigation card to Dashboard"
```

---

## Task 8: Add Interview Prep to navigation (MobileNav + AppSidebar)

**Files:**
- Modify: `src/components/MobileNav.tsx`
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Add to MobileNav drawer**

In `src/components/MobileNav.tsx`, add Interview Prep to the `DRAWER_NAV_ITEMS` array (line 103). Add a new icon function before it:

```typescript
function DrawerIconInterview() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
    </svg>
  );
}
```

Then add it to `DRAWER_NAV_ITEMS`:

```typescript
const DRAWER_NAV_ITEMS: { path: string; label: string; icon: ReactNode }[] = [
  { path: "/", label: "Home", icon: <DrawerIconHome /> },
  { path: "/interview-prep", label: "Interview Prep", icon: <DrawerIconInterview /> },
  { path: "/question", label: "Practice", icon: <DrawerIconMic /> },
  { path: "/history", label: "History", icon: <DrawerIconClock /> },
  { path: "/leaderboard", label: "Leaderboard", icon: <DrawerIconLeaderboard /> },
];
```

- [ ] **Step 2: Add to AppSidebar**

In `src/components/AppSidebar.tsx`, add Interview Prep to the `NAV_ITEMS` array (after line 6):

```typescript
const NAV_ITEMS = [
  {
    path: "/",
    label: "Home",
    icon: (/* existing home icon */),
  },
  {
    path: "/interview-prep",
    label: "Interview Prep",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
      </svg>
    ),
  },
  // ... existing History, Leaderboard items
];
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MobileNav.tsx src/components/AppSidebar.tsx
git commit -m "feat: add Interview Prep to mobile and sidebar navigation"
```

---

## Task 9: Category-aware back navigation

**Files:**
- Modify: `src/screens/Question.tsx`
- Modify: `src/screens/Recording.tsx`
- Modify: `src/screens/Analysing.tsx`
- Modify: `src/screens/Report.tsx`

- [ ] **Step 1: Update Question.tsx back button**

In `src/screens/Question.tsx`, add import:

```typescript
import { getChallengeBackPath } from "@/lib/challengeUtils";
```

Change the back button `onClick` (line 99) from:
```typescript
onClick={() => navigate("/")}
```
to:
```typescript
onClick={() => navigate(getChallengeBackPath(challenge.category))}
```

- [ ] **Step 2: Update Recording.tsx back button**

In `src/screens/Recording.tsx`, the back button navigates to `/question` (which is correct — it goes back to the question, not the dashboard). No change needed here.

- [ ] **Step 3: Update Analysing.tsx error navigation**

In `src/screens/Analysing.tsx`, add import:

```typescript
import { getChallengeBackPath } from "@/lib/challengeUtils";
```

Change the "Back to Dashboard" error button (around line 122-125) from:
```typescript
<Button onClick={() => {
  session.reset();
  navigate("/");
}}>
  Back to Dashboard
</Button>
```
to:
```typescript
<Button onClick={() => {
  session.reset();
  navigate(getChallengeBackPath(activeChallenge.category));
}}>
  Back to Challenges
</Button>
```

- [ ] **Step 4: Update Report.tsx navigation**

In `src/screens/Report.tsx`, add import:

```typescript
import { getChallengeBackPath } from "@/lib/challengeUtils";
```

Find all `navigate("/")` calls in the bottom navigation section (lines 1226, 1243, 1259, 1270) and replace with `navigate(getChallengeBackPath(activeChallenge.category))`.

Specifically, update these patterns:
- "Continue to Next Challenge" button: `navigate("/")` → `navigate(getChallengeBackPath(activeChallenge.category))`
- "Back to Home" button: `navigate("/")` → `navigate(getChallengeBackPath(activeChallenge.category))`
- "Reset & Try Again" button: `navigate("/")` → `navigate(getChallengeBackPath(activeChallenge.category))`

Also change button text from "Back to Home" to "Back to Challenges" for these buttons.

- [ ] **Step 5: Verify build**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Question.tsx src/screens/Analysing.tsx src/screens/Report.tsx
git commit -m "feat: category-aware back navigation for interview prep flow"
```

---

## Task 10: Extend AI evaluation for HR and ABAP

**Files:**
- Modify: `src/services/gemini.ts`

- [ ] **Step 1: Update analyzeAnswer() to handle HR evaluation criteria**

In `src/services/gemini.ts`, modify the `analyzeAnswer()` function. After the checkpoint block construction (around line 461), add HR-specific evaluation criteria to the prompt:

Find the line that builds `checkpointBlock` (line 442-444) and after it, add:

```typescript
const evaluationCriteriaBlock = challenge.evaluationCriteria
  ? `\n═══ EVALUATION CRITERIA ═══\nListen for: ${challenge.evaluationCriteria}\n\nThe response should demonstrate these qualities. Score Relevancy based on whether the candidate shows the qualities described above, not just whether they answer the question.\n`
  : "";
```

Then insert `${evaluationCriteriaBlock}` into the prompt string, after the checkpoint enforcement section (before the regression context).

- [ ] **Step 2: Update analyzeAnswer() to handle ABAP reference answers**

After the evaluationCriteriaBlock, add:

```typescript
const referenceAnswerBlock = challenge.referenceAnswer
  ? `\n═══ REFERENCE ANSWER ═══\n${challenge.referenceAnswer}\n\n═══ TECHNICAL ACCURACY INSTRUCTIONS ═══\n- Compare the student's spoken response against the reference answer above\n- Check if key technical concepts, distinctions, and facts are mentioned correctly\n- Score Relevancy primarily on technical accuracy and completeness\n- The student is speaking, not writing code — evaluate their verbal explanation\n- Missing critical technical distinctions = cap Relevancy at 50\n- Factual errors (wrong complexity, wrong syntax description) = cap Relevancy at 40\n- Mentioning concepts not in the reference but still correct = bonus, do not penalize\n`
  : "";
```

Insert `${referenceAnswerBlock}` into the prompt string, after `${evaluationCriteriaBlock}`.

- [ ] **Step 3: Update ideal response instruction for ABAP**

In the prompt's scoring instructions section (around line 480), modify instruction 5 about idealResponse:

Change from the static instruction to:
```typescript
const idealResponseInstruction = challenge.referenceAnswer
  ? `5. For idealResponse, use exactly this reference answer (cleaned up for spoken delivery — remove code blocks, keep the explanation): "${challenge.referenceAnswer.replace(/```[\s\S]*?```/g, '[code example]').slice(0, 500)}"`
  : `5. The idealResponse should be a GRADUAL ENHANCEMENT of the speaker's original transcript — keep their ideas, structure, and personality but fix grammar, remove filler words, improve vocabulary, and strengthen weak sections. Do NOT write a completely different answer. It should sound like a better version of what THEY said, not a generic model answer. Aim for 130-150 words.`;
```

- [ ] **Step 4: Verify build**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/gemini.ts
git commit -m "feat: extend AI evaluation for HR criteria and ABAP reference answers"
```

---

## Task 11: Update Report screen for ABAP reference answers

**Files:**
- Modify: `src/screens/Report.tsx`

- [ ] **Step 1: Show reference answer as ideal response for ABAP**

In `src/screens/Report.tsx`, find where `idealResponse` is displayed (around line 914-922). The current code shows `{idealResponse}` from the analysis result.

For ABAP challenges, we want to show the `referenceAnswer` from the challenge instead (it's more accurate). Modify the ideal response text section:

Find the ideal response text block and update it:

```typescript
{/* Ideal response text — ALWAYS shown */}
<div className="rounded-[14px] p-3.5 my-4" style={{ background: "var(--surface)", borderLeft: "3px solid #FFB830" }}>
  <div className="text-[10px] font-bold tracking-[1px] mb-2.5" style={{ color: "var(--muted)" }}>
    {activeChallenge.category === "abap" ? "REFERENCE ANSWER" : "IMPROVED VERSION OF YOUR RESPONSE"}
  </div>
  <p className="text-[12px] leading-[1.8] whitespace-pre-line" style={{ color: "var(--text)" }}>
    {activeChallenge.category === "abap" && activeChallenge.referenceAnswer
      ? activeChallenge.referenceAnswer
      : idealResponse}
  </p>
</div>
```

Also update the "AI Generated" badge to show "Reference Answer" for ABAP:

```typescript
<div className="border rounded-[8px] px-2.5 py-1 text-[10px] font-bold" style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}>
  {activeChallenge.category === "abap" ? "Reference Answer" : "AI Generated"}
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Report.tsx
git commit -m "feat: show reference answer for ABAP challenges in Report"
```

---

## Task 12: Deduplicate scoreColor across screens

**Files:**
- Modify: `src/screens/Dashboard.tsx`
- Modify: `src/screens/Report.tsx`
- Modify: `src/screens/History.tsx`

- [ ] **Step 1: Replace local scoreColor in Dashboard.tsx**

Already done in Task 7 — import from `@/lib/challengeUtils` and remove local function.

- [ ] **Step 2: Replace local scoreColor in History.tsx**

In `src/screens/History.tsx`, add:
```typescript
import { scoreColor } from "@/lib/challengeUtils";
```
Remove the local `scoreColor` function.

- [ ] **Step 3: Replace local scoreColor in Report.tsx**

In `src/screens/Report.tsx`, add:
```typescript
import { scoreColor } from "@/lib/challengeUtils";
```
Remove the local `scoreColor` function.

- [ ] **Step 4: Verify build**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Dashboard.tsx src/screens/History.tsx src/screens/Report.tsx
git commit -m "refactor: deduplicate scoreColor into challengeUtils"
```

---

## Task 13: Update voice generation and upload scripts

**Files:**
- Modify: `scripts/generate-voices.mjs`
- Modify: `scripts/upload-voices-to-blob.mjs`

- [ ] **Step 1: Update generate-voices.mjs**

In `scripts/generate-voices.mjs`, the `CHALLENGES` array (lines 28-43) currently has hardcoded c1-c14 challenges. Add the HR and ABAP challenges to this array.

The coach script for HR/ABAP challenges should follow this pattern:
- HR: `"HR Interview: ${title}. ${scenario} Your task: ${prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!"`
- ABAP: `"Technical Interview: ${title}. ${scenario} Your task: ${prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!"`

Update the `buildCoachScript` function to handle the different `week` values:

```javascript
function buildCoachScript(c) {
  const prefix = c.week === "HR" ? "HR Interview" : c.week === "ABAP" ? "Technical Interview" : c.week;
  return `${prefix}: ${c.title}. ${c.scenario} Your task: ${c.prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!`;
}
```

Add all 50 HR challenges and 12 ABAP challenges to the `CHALLENGES` array in the script. Each entry needs: `id`, `week`, `title`, `scenario`, `prompt`. Copy these from the challenge constant files.

**Note:** This will be a very large array. The script runs locally and generates files — the array size doesn't affect the app bundle.

- [ ] **Step 2: Update upload-voices-to-blob.mjs**

In `scripts/upload-voices-to-blob.mjs`, update `CHALLENGE_IDS` (line 16-19) to include all IDs:

```javascript
const CHALLENGE_IDS = [
  "c1", "c2", "c3", "c4", "c5", "c6", "c7",
  "c8", "c9", "c10", "c11", "c12", "c13", "c14",
  "hr1", "hr2", "hr3", /* ... */ "hr50",
  "abap1", "abap2", /* ... */ "abap12",
];
```

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-voices.mjs scripts/upload-voices-to-blob.mjs
git commit -m "feat: add HR and ABAP challenges to voice generation scripts"
```

---

## Task 14: Generate and upload voice files

**Files:**
- `src/constants/voiceUrls.ts`

- [ ] **Step 1: Generate voice files**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && node scripts/generate-voices.mjs`

This will take ~8 minutes (62 files × 8 second delay between API calls). It skips files that already exist (c1-c14).

Expected output: 62 new PCM files in `public/voices/` (hr1.pcm through hr50.pcm, abap1.pcm through abap12.pcm).

- [ ] **Step 2: Upload to Vercel Blob**

Run: `BLOB_READ_WRITE_TOKEN=<token> node scripts/upload-voices-to-blob.mjs`

Expected: Uploads all files and prints the URL map.

- [ ] **Step 3: Update voiceUrls.ts**

Copy the output URL map from the upload script and merge it into `src/constants/voiceUrls.ts`:

```typescript
export const VOICE_URLS: Record<string, string> = {
  "c1": "https://iq1grzgo2lwh6nqd.public.blob.vercel-storage.com/voices/c1.pcm",
  // ... existing c2-c14 ...
  "hr1": "https://...",
  "hr2": "https://...",
  // ... all hr and abap URLs from upload output ...
};
```

- [ ] **Step 4: Commit**

```bash
git add src/constants/voiceUrls.ts
git commit -m "feat: add voice URLs for HR and ABAP challenges"
```

**Note:** Do NOT commit the `public/voices/*.pcm` files — they're served from Vercel Blob CDN, not from the repo. If they're already in `.gitignore`, great. If not, add `public/voices/*.pcm` to `.gitignore`.

---

## Task 15: Update MobileNav and AppSidebar speaking journey count

**Files:**
- Modify: `src/components/MobileNav.tsx`
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Filter speaking challenges in MobileNav progress bar**

In `src/components/MobileNav.tsx`, the "SPEAKING JOURNEY" progress bar (line 332) iterates over `CHALLENGES` which now includes HR and ABAP. It should only show speaking challenges:

Change line 140:
```typescript
const totalChallenges = CHALLENGES.length;
```
to:
```typescript
const speakingChallenges = CHALLENGES.filter((c) => c.category === "speaking");
const totalChallenges = speakingChallenges.length;
```

Update the segmented progress bar (line 332) to use `speakingChallenges` instead of `CHALLENGES`:
```typescript
{speakingChallenges.map((c) => {
```

Update the completion count (line 139):
```typescript
const completedCount = speakingChallenges.filter((c) => store.completedChallengeIds.includes(c.id)).length;
```

- [ ] **Step 2: Same fix in AppSidebar**

Apply the same filter in `src/components/AppSidebar.tsx` (line 47-48):

```typescript
const speakingChallenges = CHALLENGES.filter((c) => c.category === "speaking");
const completedCount = speakingChallenges.filter((c) => store.completedChallengeIds.includes(c.id)).length;
const totalChallenges = speakingChallenges.length;
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MobileNav.tsx src/components/AppSidebar.tsx
git commit -m "fix: speaking journey progress shows only speaking challenges"
```

---

## Task 16: Final verification and build test

**Files:** None (verification only)

- [ ] **Step 1: TypeScript type check**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx tsc --noEmit`

Expected: No errors.

- [ ] **Step 2: Vite build**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx vite build`

Expected: Build succeeds.

- [ ] **Step 3: Local dev server test**

Run: `cd /Users/saikiranvarma/Projects/web/campx/migration/winspeak && npx vite --open`

Manual checks:
1. Dashboard loads, shows the Interview Prep card
2. Click Interview Prep card → navigates to `/interview-prep`
3. HR Round tab shows ~50 challenges
4. SAP ABAP tab shows 12 challenges
5. Click a challenge → Question screen loads with correct scenario/prompt
6. Back button on Question → returns to `/interview-prep`
7. Existing speaking challenges still work (navigate from Dashboard)
8. MobileNav drawer shows Interview Prep link
9. Speaking Journey progress bar only counts c1-c14

- [ ] **Step 4: Commit any final fixes**

If any issues found during testing, fix and commit.
