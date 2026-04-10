# Interview Prep Feature — Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Scope:** Add ~62 new challenges for HR Round and SAP ABAP interview preparation

---

## Overview

Add a new **Interview Prep** section to WinSpeak with two categories:
- **HR Round** (~50 challenges): Behavioral, soft skills, time management, teamwork, leadership questions
- **SAP ABAP** (~12 challenges): Technical interview questions with model answers

Students record spoken answers and receive AI feedback on speaking quality. ABAP questions additionally evaluate technical accuracy against provided reference answers.

---

## Data Model

### Challenge Type Extension

Add three fields to the existing `Challenge` interface in `src/types/index.ts`:

```typescript
export type ChallengeCategory = "speaking" | "hr" | "abap";

export interface Challenge {
  // ... existing fields unchanged ...
  category: ChallengeCategory;        // Where this challenge appears
  referenceAnswer?: string;             // Model answer for ABAP technical questions
  evaluationCriteria?: string;          // "Listen for..." guidance for HR questions
}
```

- `category: "speaking"` — existing c1-c14 (Dashboard)
- `category: "hr"` — HR behavioral questions (Interview Prep > HR Round)
- `category: "abap"` — SAP ABAP questions (Interview Prep > SAP ABAP)
- `referenceAnswer` — full model answer text (ABAP only). Included in Gemini prompt for technical accuracy evaluation. Code samples stored as plain text within the string.
- `evaluationCriteria` — the "Listen for..." text (HR only). Converted to checkpoints and included in Gemini evaluation prompt.

### Challenge IDs

- Existing speaking: `c1` through `c14`
- HR behavioral: `hr1` through `hr50`
- ABAP technical: `abap1` through `abap12`

### No DB Migration Required

The `attempts` table already stores `challengeId` as a generic text field and `challengeTitle` as text. New challenge IDs (`hr1`, `abap1`, etc.) work without schema changes.

---

## File Organization

### New Files

```
src/constants/
├── challenges-speaking.ts      # Extract existing c1-c14 (category: "speaking")
├── challenges-hr.ts            # ~50 HR challenges (hr1-hr50)
├── challenges-abap.ts          # 12 ABAP challenges (abap1-abap12)
├── checkpoints-hr.ts           # CHALLENGE_CHECKPOINTS for HR challenges
├── checkpoints-abap.ts         # CHALLENGE_CHECKPOINTS for ABAP challenges

src/screens/
├── InterviewPrep.tsx           # New page — challenge browser with HR/ABAP tabs
```

### Modified Files

```
src/types/index.ts              # Add ChallengeCategory, referenceAnswer, evaluationCriteria
src/constants/index.ts          # Merge all challenge arrays, re-export
src/constants/voiceUrls.ts      # Add URLs for hr1-hr50, abap1-abap12
src/services/gemini.ts          # Update analyzeAnswer() prompt for HR/ABAP evaluation
src/screens/Dashboard.tsx       # Add "Interview Prep" navigation card
src/App.tsx (or router)         # Add /interview-prep route
src/screens/Question.tsx        # Back navigation: go to InterviewPrep if category != "speaking"
src/screens/Report.tsx          # Back navigation: same category-aware routing
```

### Constants Merge Strategy

```typescript
// src/constants/index.ts
import { SPEAKING_CHALLENGES } from './challenges-speaking';
import { HR_CHALLENGES } from './challenges-hr';
import { ABAP_CHALLENGES } from './challenges-abap';
import { HR_CHECKPOINTS } from './checkpoints-hr';
import { ABAP_CHECKPOINTS } from './checkpoints-abap';

export const CHALLENGES: Challenge[] = [
  ...SPEAKING_CHALLENGES,
  ...HR_CHALLENGES,
  ...ABAP_CHALLENGES,
];

export const CHALLENGE_CHECKPOINTS: Record<string, string[]> = {
  ...SPEAKING_CHECKPOINTS,   // existing c1-c14 checkpoints
  ...HR_CHECKPOINTS,
  ...ABAP_CHECKPOINTS,
};
```

---

## Interview Prep Page

### Route

`/interview-prep` — accessible from Dashboard

### Layout

- **Header**: "Interview Prep" title + back arrow to Dashboard
- **Tab bar**: Two tabs — "HR Round" and "SAP ABAP"
- **Challenge list**: Same card style as Dashboard's challenge list
  - Each card: title, tier badge (Beginner/Intermediate/Advanced), XP value, status (active/completed)
  - Completed challenges: show best score, Retry + Results buttons
  - Active challenges: show Start button
- **All challenges unlocked** — no sequential progression required for interview prep

### Navigation from Dashboard

Add a prominent card on the Dashboard page (below the active challenge area):

```
[Interview Prep card]
  "Interview Prep"
  "Practice HR & Technical Questions"
  [Start Practicing ->]
```

### Back Navigation

When a challenge has `category: "hr"` or `category: "abap"`, the "Back" buttons on Question, Recording, and Report screens navigate to `/interview-prep` instead of `/dashboard`.

---

## Challenge Content

### HR Round Challenges (hr1-hr50)

Each HR challenge follows this structure:
- `id`: `hr1` through `hr50`
- `category`: `"hr"`
- `tier`: `"Beginner"` for soft skills/icebreaker questions, `"Intermediate"` for behavioral/situational, `"Advanced"` for leadership/complex scenarios
- `xp`: 500 (Beginner), 700-800 (Intermediate), 1000-1200 (Advanced)
- `passingScore`: 55 (Beginner), 65 (Intermediate), 70 (Advanced)
- `scenario`: Framed as an interview setting (e.g., "You're in an HR interview for a placement role...")
- `prompt`: The interview question itself
- `evaluationCriteria`: The "Listen for..." text from the source material
- `week`: `"HR"` (not weekly progression)

**Checkpoint derivation**: Each question's "Listen for..." criteria gets converted to 3-5 checkpoints. For questions without explicit criteria, derive checkpoints from the question's intent (e.g., "Tell me about yourself" → checkpoints: current status, relevant experience, key achievement, why this role).

### SAP ABAP Challenges (abap1-abap12)

Each ABAP challenge follows this structure:
- `id`: `abap1` through `abap12`
- `category`: `"abap"`
- `tier`: `"Beginner"` for Q1-Q3, `"Intermediate"` for Q4-Q8, `"Advanced"` for Q9-Q12
- `xp`: 600 (Beginner), 900 (Intermediate), 1200 (Advanced)
- `passingScore`: 55 (Beginner), 65 (Intermediate), 70 (Advanced)
- `scenario`: "You're in a technical interview for an SAP ABAP Cloud Developer role..."
- `prompt`: The technical question
- `referenceAnswer`: The full model answer including code samples (stored as a string)
- `week`: `"ABAP"` (not weekly progression)

---

## AI Evaluation Changes

### HR Question Evaluation

The existing `analyzeAnswer()` function is extended. When `challenge.category === "hr"`:

1. Include `evaluationCriteria` in the prompt:
```
=== EVALUATION CRITERIA ===
Listen for: [evaluationCriteria text]

The response should demonstrate these qualities. Score Relevancy based on
whether the candidate shows the qualities described above, not just whether
they answer the question.
```

2. Use HR-specific checkpoints from `CHALLENGE_CHECKPOINTS`
3. Same 6 skills, same weighted average, same scoring tiers

### ABAP Question Evaluation

When `challenge.category === "abap"`:

1. Include `referenceAnswer` in the prompt:
```
=== REFERENCE ANSWER ===
[referenceAnswer content]

=== TECHNICAL ACCURACY INSTRUCTIONS ===
- Compare the student's spoken response against the reference answer above
- Check if key technical concepts, distinctions, and facts are mentioned correctly
- Score Relevancy primarily on technical accuracy and completeness
- The student is speaking, not writing code — evaluate their verbal explanation
- Missing critical technical distinctions = cap Relevancy at 50
- Factual errors (wrong complexity, wrong syntax description) = cap Relevancy at 40
- Mentioning concepts not in the reference but still correct = bonus, do not penalize
```

2. ABAP challenges use the existing Beginner/Intermediate/Advanced tiers. The reference answer + technical accuracy instructions are injected as additional prompt context alongside the existing tier rubric. No new tier needed — this keeps the scoring system consistent.

### Ideal Response for Interview Prep

- **HR questions**: AI generates an ideal response as usual (gradual enhancement of student's answer). TTS generates audio for it as normal.
- **ABAP questions**: The `referenceAnswer` IS the ideal response text. Show it directly in the Report page instead of asking the AI to generate one. For the "Listen to Ideal Answer" audio, TTS generates audio from a simplified version of the reference answer (excluding code blocks, which can't be spoken). If the reference answer is too long for TTS, show text only with no audio player.

---

## Coach Voice Generation

### Process

1. Update `scripts/generate-voices.mjs` to include hr1-hr50 and abap1-abap12
2. Each voice file narrates the **scenario + prompt** (not the reference answer or code)
3. For ABAP questions, the coach voice says something like: "You're in a technical interview. The interviewer asks: [question]"
4. Generate as PCM16 24kHz mono files
5. Upload to Vercel Blob CDN via `scripts/upload-voices-to-blob.mjs`
6. Add URLs to `src/constants/voiceUrls.ts`

### File naming

- HR: `hr1.pcm` through `hr50.pcm`
- ABAP: `abap1.pcm` through `abap12.pcm`

---

## Navigation Flow

```
Dashboard
  ├── [Active Speaking Challenge] → Question → Recording → Analysing → Report → Dashboard
  ├── [Other Speaking Challenges] → Question → Recording → Analysing → Report → Dashboard
  └── [Interview Prep Card] → InterviewPrep
                                  ├── HR Round tab
                                  │   └── [HR Challenge] → Question → Recording → Analysing → Report → InterviewPrep
                                  └── SAP ABAP tab
                                      └── [ABAP Challenge] → Question → Recording → Analysing → Report → InterviewPrep
```

Back navigation is category-aware: challenges with `category: "hr"` or `"abap"` return to `/interview-prep`.

---

## XP, Levels, Streaks, Leaderboard

All systems work unchanged:
- Interview Prep challenges earn XP like any other challenge
- XP contributes to level progression
- Completing a challenge maintains streak
- Leaderboard includes all XP (speaking + interview prep)
- `completedChallengeIds` includes hr/abap challenge IDs

---

## Scope & Non-Goals

### In Scope
- ~62 new challenges (50 HR + 12 ABAP) as constants
- New InterviewPrep screen with category tabs
- AI evaluation with technical accuracy for ABAP
- AI evaluation with behavioral criteria for HR
- Coach voice generation for all new challenges
- Category-aware navigation

### Not In Scope
- Server-side challenge storage / admin panel
- New skill dimensions (only the existing 6 skills)
- Separate leaderboard for interview prep
- Timer changes (still 60 seconds per challenge)
- New onboarding flow for interview prep
- Mock interview mode (multi-question sessions)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Constants files become very large | Split into per-category files, lazy import if needed |
| ABAP reference answers with code are verbose strings | Store as template literals, keep readable |
| 62 new voice files = storage cost | Vercel Blob CDN is pay-per-use, ~62 files at ~100KB each = ~6MB total |
| Gemini prompt gets long for ABAP with reference answers | Reference answers are 100-300 words each, well within token limits |
| HR questions without "Listen for..." lack checkpoints | Manually derive 3-5 checkpoints from question intent |
