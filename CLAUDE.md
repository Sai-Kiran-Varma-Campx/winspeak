# WinSpeak — AI Speaking Coach for Students

## What is WinSpeak
AI-powered speaking coach where students complete speaking challenges, record spoken responses, and receive detailed AI feedback. Gamified with XP, levels, streaks, and a leaderboard.

## Tech Stack
- **Frontend**: React + TypeScript + Vite, Tailwind CSS
- **Backend**: Hono (serverless on Vercel via `api/[...route].ts`)
- **DB**: Neon Postgres + Drizzle ORM (`server/src/db/schema.ts`)
- **AI**: Google Gemini (`gemini-2.5-flash` for analysis/transcription, `gemini-2.5-flash-preview-tts` for TTS)
- **Auth**: Username/password + JWT (PBKDF2 hashing, hono/jwt)
- **Hosting**: Vercel (https://winspeak.vercel.app)

## Project Structure
```
winspeak/
├── src/                    # React frontend
│   ├── screens/            # Page components (Dashboard, Question, Recording, Analysing, Report, etc.)
│   ├── components/         # Shared UI components
│   ├── context/            # React contexts (Session, UserStore, Toast)
│   ├── hooks/              # Custom hooks (useUserStore, useAudioRecorder, etc.)
│   ├── services/gemini.ts  # All Gemini AI calls (TTS, transcription, analysis)
│   ├── lib/                # Utilities (api.ts, audioStorage.ts)
│   ├── constants/index.ts  # Challenges, checkpoints, rubrics, scoring config
│   └── types/              # TypeScript types
├── server/                 # Hono backend (has its own package.json + node_modules)
│   └── src/
│       ├── app.ts          # Hono app with routes
│       ├── db/             # Drizzle schema + connection
│       ├── routes/         # API routes (users, attempts, leaderboard)
│       └── middleware/      # Auth middleware
├── public/voices/          # Static coach voice PCM files (c1.pcm - c14.pcm)
├── scripts/                # Voice generation script
├── api/[...route].ts       # Vercel serverless bridge to Hono
└── vercel.json             # Vercel config
```

## Key Architecture Decisions

### Single Repo, No Separate Server
- `server/` code runs as Vercel serverless functions via `api/[...route].ts`
- Locally, use `cd server && npm run dev` for the Hono server on port 3001
- Vite dev server proxies `/api` to `localhost:3001` (see `vite.config.ts`)
- **Do NOT add external services** — keep everything in this single repo

### Vercel Build
- `vercel.json` buildCommand is `vite build` only (no `tsc -b`, causes drizzle type issues)
- `api/tsconfig.json` has `skipLibCheck: true` for clean Vercel builds
- Env vars on Vercel: `DATABASE_URL`, `JWT_SECRET`, `VITE_GEMINI_API_KEY`

### Coach Voice Audio
- Pre-generated as static PCM files in `public/voices/{challengeId}.pcm`
- Generated once via `node scripts/generate-voices.mjs` (Gemini TTS)
- Frontend fetches `/voices/c1.pcm` etc. — zero API calls, instant playback
- If file missing → shows "Issue fetching audio" message, user can still proceed

### iOS Safari Compatibility
- **AudioContext**: Shared singleton at device default sample rate (NOT 24kHz — iOS rejects < 44100Hz)
- **Resample**: PCM 24kHz → device rate via linear interpolation in `playFloat32()`
- **Unlock**: `unlockAudioContext()` called on user taps, document-level touch listeners
- **Recording playback**: Uses data URL (`data:audio/mp4;base64,...`) not blob URL (iOS can't play blob URLs)
- **Coach voice**: Static file fetch, no streaming needed
- **TTS errors**: Promise-based, no timeouts — shows error UI immediately on reject

### TTS Architecture
- **Coach narration**: Static PCM files (shared across all users, zero cost)
- **Ideal response audio**: Client-side Gemini TTS call (unique per user's performance)
- **Model fallback**: `gemini-2.5-flash-preview-tts` only (single model keeps it simple)
- **Minimum audio check**: Reject PCM < 48000 bytes (< 1 second at 24kHz)

### Recording Flow
- Min 30 seconds required to submit
- Stop button disabled for first 30s
- One re-record allowed per attempt
- Audio stops on page navigation (`stopAudioPlayback()`)

### Challenge System
- 14 challenges (c1-c14), Beginner/Intermediate/Advanced tiers
- `UNLOCK_ALL = true` for stakeholder testing (flip to `false` for students)
- Unlimited retries (no maxAttempts enforcement)
- Completed challenges show "Retry" + "Results" buttons
- Session context stores selected `challengeId` for multi-challenge support

### Scoring & Analysis
- Gemini evaluates with tier-specific rubrics and checkpoint enforcement
- Skills: Fluency, Grammar, Vocabulary, Clarity, Structure, Relevancy
- Weighted average: Relevancy 25%, Clarity 20%, Structure 20%, Vocabulary 15%, Fluency 10%, Grammar 10%
- Ideal response is a "gradual enhancement" of user's own words (not generic)
- Ideal response text shown when score >= 40, hidden below
- Pause analysis avgDuration shows "-" for non-numeric values

### Error Handling
- Global 401 interceptor → auto-logout
- AbortController 30s timeout on API requests
- Toast notifications for API failures
- Error boundary wraps entire app
- Offline detection banner

### UI Conventions
- Dark theme with CSS variables
- "Gemini" never shown in UI — always "WinSpeak"
- No star ratings on Report page
- Leaderboard shows total attempts next to XP
- AudioCheck screen is bypassed (removed from flow)
