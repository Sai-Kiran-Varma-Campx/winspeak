import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult, Challenge } from "@/types";
import type { Attempt } from "@/hooks/useUserStore";
import { CHALLENGE_CHECKPOINTS, TIER_RUBRICS } from "@/constants";
import { saveAudioBlob, loadAudioBlob } from "@/lib/audioStorage";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Retry wrapper: retries fn up to maxRetries times with exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // strip "data:...;base64," prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function pcm16BytesToFloat32(bytes: Uint8Array): Float32Array {
  const samples = new Float32Array(bytes.length / 2);
  for (let i = 0; i < samples.length; i++) {
    let s = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
    if (s >= 32768) s -= 65536;
    samples[i] = s / 32768;
  }
  return samples;
}


// ── Shared AudioContext singleton (iOS Safari requires user-gesture unlock) ──
// iOS Safari does NOT support sampleRate < 44100, so we use the device default
// and resample 24kHz PCM → device rate when creating buffers.

let _sharedCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!_sharedCtx || _sharedCtx.state === "closed") {
    _sharedCtx = new AC(); // Use device default sample rate (44100 or 48000)
  }
  return _sharedCtx;
}

/**
 * Unlock AudioContext on iOS Safari. Call early and often.
 * Also installs document-level touch listeners so ANY user tap unlocks audio.
 */
let _listenersInstalled = false;

function _resumeCtx() {
  if (!_sharedCtx) return;
  if (_sharedCtx.state === "suspended" || (_sharedCtx.state as string) === "interrupted") {
    _sharedCtx.resume().catch(() => {});
  }
}

export function unlockAudioContext(): void {
  getSharedAudioContext(); // Ensure it exists
  _resumeCtx();

  // Install global listeners once — any future touch/click will also unlock
  if (!_listenersInstalled) {
    _listenersInstalled = true;
    const events = ["touchstart", "touchend", "mousedown", "keydown"];
    function handler() {
      _resumeCtx();
      // Once running, remove listeners
      if (_sharedCtx?.state === "running") {
        events.forEach((e) => document.removeEventListener(e, handler));
      }
    }
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
  }
}

let _activeSource: AudioBufferSourceNode | null = null;

/**
 * Stop any currently playing audio (coach voice, etc.).
 * Call on page navigation to prevent audio bleeding between screens.
 */
export function stopAudioPlayback(): void {
  if (_activeSource) {
    try { _activeSource.stop(); } catch { /* already stopped */ }
    _activeSource = null;
  }
}

function playFloat32(samples: Float32Array, sourceSampleRate = 24000): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getSharedAudioContext();
    _resumeCtx();

    const deviceRate = ctx.sampleRate;

    let buffer: AudioBuffer;
    if (sourceSampleRate === deviceRate) {
      buffer = ctx.createBuffer(1, samples.length, deviceRate);
      buffer.getChannelData(0).set(samples);
    } else {
      const ratio = sourceSampleRate / deviceRate;
      const newLength = Math.round(samples.length / ratio);
      buffer = ctx.createBuffer(1, newLength, deviceRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < newLength; i++) {
        const srcIdx = i * ratio;
        const lo = Math.floor(srcIdx);
        const hi = Math.min(lo + 1, samples.length - 1);
        const frac = srcIdx - lo;
        output[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
      }
    }

    // Stop any previous playback
    stopAudioPlayback();

    const src = ctx.createBufferSource();
    _activeSource = src;
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => {
      _activeSource = null;
      resolve();
    };
    src.start();
  });
}

/** Wraps raw PCM16 LE bytes in a WAV header so <audio> elements can play it */
function pcm16ToWav(pcmBytes: Uint8Array, sampleRate = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function w(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }
  w(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  w(36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmBytes);

  return new Blob([buffer], { type: "audio/wav" });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Transcribe audio blob using Gemini STT.
 * Returns the spoken text (lowercase-trimmed).
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  const mimeType = blob.type || "audio/webm";

  return withRetry(async () => {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            {
              text: "Transcribe this audio exactly as spoken. Return only the spoken words with no extra commentary, punctuation optional.",
            },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text.trim();
  });
}

// ── TTS with model fallback ─────────────────────────────────────────────────
// 1. gemini-2.5-flash-preview-tts (fast, 100/day)
// 2. gemini-2.5-pro-preview-tts (quality, separate 100/day quota)
// Each model has its own rate limit — gives 200 TTS calls/day total.

const TTS_MODELS = [
  "gemini-2.5-flash-preview-tts",
];

/**
 * Generate TTS audio with model fallback. Returns raw PCM16 bytes.
 */
async function generateTtsBytes(text: string): Promise<Uint8Array> {
  let lastError: unknown;

  for (const model of TTS_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        } as Record<string, unknown>,
      });

      const parts = result.candidates?.[0]?.content?.parts ?? [];
      const audioPart = parts.find(
        (p: { inlineData?: { data?: string } }) => p.inlineData?.data
      );
      const b64 = audioPart?.inlineData?.data as string | undefined;
      if (!b64) throw new Error("TTS returned no audio data");

      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // Reject if audio is too short (< 1 second at 24kHz PCM16 = 48000 bytes)
      if (bytes.length < 48000) throw new Error("TTS returned audio too short");

      return bytes;
    } catch (err) {
      console.error(`[TTS] Model ${model} failed:`, err);
      lastError = err;
      // Continue to next model
    }
  }

  console.error("[TTS] All models failed. Last error:", lastError);
  throw lastError;
}

/**
 * Synthesize speech. Throws on failure.
 */
export async function synthesizeSpeech(
  text: string,
  onStart?: () => void
): Promise<void> {
  const bytes = await generateTtsBytes(text);
  const samples = pcm16BytesToFloat32(bytes);
  onStart?.();
  await playFloat32(samples);
}

/**
 * Synthesize speech with IndexedDB cache. Throws on generation failure.
 */
export async function synthesizeSpeechCached(
  text: string,
  cacheKey: string,
  onStart?: () => void
): Promise<void> {
  // 1. Try IndexedDB cache
  try {
    const cached = await loadAudioBlob(cacheKey);
    if (cached) {
      const arrayBuffer = await cached.arrayBuffer();
      const samples = pcm16BytesToFloat32(new Uint8Array(arrayBuffer));
      onStart?.();
      await playFloat32(samples);
      return;
    }
  } catch { /* fall through */ }

  // 2. Generate via Gemini with model fallback
  const bytes = await generateTtsBytes(text);

  // Cache for next time
  saveAudioBlob(cacheKey, new Blob([bytes.buffer as ArrayBuffer], { type: "audio/pcm" })).catch(() => {});

  const samples = pcm16BytesToFloat32(bytes);
  onStart?.();
  await playFloat32(samples);
}

// ── Coach voice playback from Vercel Blob CDN ───────────────────────────────

import { SCHOOL_VOICE_URLS } from "@/constants/voiceUrls";

/**
 * Play coach voice from Vercel Blob CDN. Throws if not available.
 * Voice files are pre-generated PCM16 24kHz mono, hosted on Vercel Blob.
 */
export async function playCoachVoice(
  challengeId: string,
  _coachScript: string,
  onStart?: () => void
): Promise<void> {
  const blobUrl = SCHOOL_VOICE_URLS[challengeId];
  if (!blobUrl) {
    throw new Error("Coach voice not available for this challenge");
  }

  const res = await fetch(blobUrl);
  if (!res.ok) {
    throw new Error("Failed to fetch coach voice");
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength < 48000) {
    throw new Error("Coach voice file too short");
  }

  const samples = pcm16BytesToFloat32(new Uint8Array(buf));
  onStart?.();
  await playFloat32(samples);
}

/**
 * Pre-render TTS as WAV to IndexedDB (no playback). For ideal response audio.
 */
export async function preRenderSpeech(text: string, cacheKey: string): Promise<void> {
  try {
    const cached = await loadAudioBlob(cacheKey);
    if (cached) return;
  } catch { /* proceed */ }

  try {
    const bytes = await generateTtsBytes(text);
    const wavBlob = pcm16ToWav(bytes);
    await saveAudioBlob(cacheKey, wavBlob);
    console.log("[TTS] Ideal response audio saved successfully");
  } catch (err) {
    console.error("[TTS] preRenderSpeech failed:", err);
  }
}

// ── Regression context builder ───────────────────────────────────────────────

function buildRegressionContext(previousAttempts: Attempt[]): string {
  if (previousAttempts.length === 0) return "";

  const recent = previousAttempts.slice(0, 3);

  const attemptSummaries = recent.map((a, i) => {
    const skillScores = a.skills
      ? Object.entries(a.skills)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "N/A";
    const weakest = a.skills
      ? Object.entries(a.skills).sort(([, a], [, b]) => a - b)[0]
      : null;
    return `  Attempt ${i + 1}: Score ${a.score}, Skills: [${skillScores}]${weakest ? `, Weakest: ${weakest[0]} (${weakest[1]})` : ""}`;
  }).join("\n");

  // Collect recurring issues from analysisResult if available
  const allGrammarIssues: string[] = [];
  const allFillerWords: string[] = [];
  const allImprovements: string[] = [];

  for (const a of recent) {
    if (a.analysisResult) {
      for (const g of a.analysisResult.grammarIssues) {
        allGrammarIssues.push(`"${g.wrong}" → "${g.correct}"`);
      }
      for (const f of a.analysisResult.fillerWords) {
        allFillerWords.push(`"${f.word}" (${f.count}x)`);
      }
      for (const imp of a.analysisResult.improvements) {
        allImprovements.push(imp);
      }
    }
  }

  let context = `\n--- PREVIOUS ATTEMPT HISTORY (${recent.length} attempt${recent.length > 1 ? "s" : ""}) ---\n${attemptSummaries}`;

  if (allGrammarIssues.length > 0) {
    const unique = [...new Set(allGrammarIssues)].slice(0, 5);
    context += `\nRecurring grammar issues: ${unique.join("; ")}`;
  }
  if (allFillerWords.length > 0) {
    const unique = [...new Set(allFillerWords)].slice(0, 5);
    context += `\nRecurring filler words: ${unique.join(", ")}`;
  }
  if (allImprovements.length > 0) {
    const unique = [...new Set(allImprovements)].slice(0, 5);
    context += `\nPreviously suggested improvements: ${unique.join("; ")}`;
  }

  context += `\n\nREGRESSION RULES:
- If the speaker repeats the SAME mistakes from previous attempts, penalize HARDER (subtract 5-10 points from the relevant skill vs. what you'd otherwise give).
- If the speaker has clearly improved on a previously weak area, acknowledge it positively in feedback.
- If this is attempt 2+, the bar is HIGHER — they've had feedback and should show growth.`;

  return context;
}

// ── Analyze answer ───────────────────────────────────────────────────────────

/**
 * Analyze a spoken answer using Gemini with tier-calibrated, checkpoint-aware,
 * regression-tracking evaluation. Returns structured feedback.
 */
export async function analyzeAnswer(
  transcript: string,
  question: string,
  challenge: Challenge,
  previousAttempts?: Attempt[],
  /** Optional school-mode context: grade level for grade-aware calibration */
  schoolContext?: { grade: number; ageHint?: string }
): Promise<AnalysisResult> {
  const tier = challenge.tier ?? "Beginner";
  const rubric = TIER_RUBRICS[tier] ?? TIER_RUBRICS["Beginner"];
  const checkpoints = CHALLENGE_CHECKPOINTS[challenge.id] ?? [];
  const regressionContext = buildRegressionContext(previousAttempts ?? []);

  // ── School POC: grade-aware calibration ────────────────────────────────
  // Per the WinSpeak School POC brief: "AI must assess the student against
  // the expected baseline for their specific grade."
  const gradeBaselines: Record<number, string> = {
    1: "Grade 1 (~6 years old): Expect short sentences, simple vocabulary, lots of imagination, frequent restarts. Reward courage and effort. A confident, on-topic 4-sentence answer is excellent for this grade. Do NOT penalise grammar gaps that are normal for emerging readers.",
    2: "Grade 2 (~7 years old): Expect 4-6 sentence answers, some descriptive words, clear topic. Reward storytelling. Some grammar slips are normal.",
    3: "Grade 3 (~8 years old): Expect linked sentences, clear opening and ending, basic structure. Reward specific examples and varied vocabulary.",
    4: "Grade 4 (~9 years old): Expect a coherent mini-speech with clear structure, specific vocabulary, and confident delivery. Hold to a higher bar but stay age-appropriate.",
    5: "Grade 5 (~10 years old): Expect organized paragraphs of connected ideas with reasoning (because/therefore). Should use topic-specific vocabulary and basic persuasion. Expect 1-2 minute responses with clear intro and conclusion.",
    6: "Grade 6 (~11 years old): Expect clear arguments with supporting examples, audience awareness, and varied sentence structures. Should demonstrate some formal register and ability to explain complex ideas simply.",
    7: "Grade 7 (~12 years old): Expect well-reasoned arguments with specific evidence, logical transitions, and rhetorical awareness. Should demonstrate academic vocabulary and ability to address counterpoints.",
    8: "Grade 8 (~13 years old): Expect structured arguments with evidence, counterpoint awareness, and confident delivery. Should sound prepared and polished. Demand precision in word choice and logical flow.",
    9: "Grade 9 (~14 years old): Expect sophisticated arguments with rhetorical techniques, nuanced reasoning, and commanding delivery. Should demonstrate deep understanding and the ability to persuade or analyze critically.",
    10: "Grade 10 (~15 years old): Expect well-crafted, rhetorically sophisticated speeches. Must demonstrate command of topic, advanced vocabulary, flawless grammar, and engaging delivery. Hold to a high standard appropriate for a mature teen speaker.",
  };
  const minimalSpeechRule = schoolContext
    ? `\n═══ CRITICAL: MINIMAL SPEECH DETECTION ═══\nIf the transcript has fewer than 10 words or is mostly silence/noise/gibberish:\n- ALL skill scores MUST be 10 or below\n- overallScore MUST be 10 or below\n- confidenceScore MUST be 10 or below\n- Do NOT give encouraging feedback about content — there was no real content\n- strengths should acknowledge courage for trying, nothing else\n- improvements should encourage speaking more next time\nIf the transcript has 10-20 words: ALL scores MUST be capped at 30 maximum. The student barely spoke.\nDo NOT inflate scores for minimal effort. A student who spoke 3 words cannot get 3 or 4 stars.\n`
    : "";

  const gradeBlock = schoolContext
    ? `\n═══ GRADE-AWARE CALIBRATION ═══\nThis student is in ${gradeBaselines[schoolContext.grade] ?? gradeBaselines[1]}\nScore against the expected baseline FOR THIS GRADE — not against an adult standard.\nFeedback must use age-appropriate, encouraging language a young child can understand.\n${minimalSpeechRule}`
    : "";

  const skillRubricBlock = Object.entries(rubric.skillGuidelines)
    .map(([skill, guideline]) => `  - ${skill}: ${guideline}`)
    .join("\n");

  const checkpointBlock = checkpoints.length > 0
    ? checkpoints.map((cp, i) => `  ${i + 1}. ${cp}`).join("\n")
    : "  (No specific checkpoints for this challenge)";

  const evaluationCriteriaBlock = challenge.evaluationCriteria
    ? `\n═══ EVALUATION CRITERIA ═══\nListen for: ${challenge.evaluationCriteria}\n\nThe response should demonstrate these qualities. Score Relevancy based on whether the candidate shows the qualities described above, not just whether they answer the question.\n`
    : "";

  const referenceAnswerBlock = challenge.referenceAnswer
    ? `\n═══ REFERENCE ANSWER ═══\n${challenge.referenceAnswer}\n\n═══ TECHNICAL ACCURACY INSTRUCTIONS ═══\n- Compare the student's spoken response against the reference answer above\n- Check if key technical concepts, distinctions, and facts are mentioned correctly\n- Score Relevancy primarily on technical accuracy and completeness\n- The student is speaking, not writing code — evaluate their verbal explanation\n- Missing critical technical distinctions = cap Relevancy at 50\n- Factual errors (wrong complexity, wrong syntax description) = cap Relevancy at 40\n- Mentioning concepts not in the reference but still correct = bonus, do not penalize\n`
    : "";

  const idealResponseInstruction = challenge.referenceAnswer
    ? `5. For idealResponse, use this reference answer cleaned up for spoken delivery (remove code syntax, keep explanation): "${challenge.referenceAnswer.replace(/\`\`\`[\s\S]*?\`\`\`/g, '[code example]').slice(0, 500)}"`
    : `5. The idealResponse should be a GRADUAL ENHANCEMENT of the speaker's original transcript — keep their ideas, structure, and personality but fix grammar, remove filler words, improve vocabulary, and strengthen weak sections. Do NOT write a completely different answer. It should sound like a better version of what THEY said, not a generic model answer. Aim for 130-150 words.`;

  const coachPersona = schoolContext
    ? `You are WinSpeak, a kind, encouraging AI speaking coach for school children. You evaluate young students fairly and supportively. Be honest about what to work on, but always celebrate effort and use simple, warm, age-appropriate words a child can understand.`
    : `You are WinSpeak, a ruthlessly honest AI speaking coach for students. You evaluate spoken responses in academic and real-world speaking scenarios. Your job is to score accurately so students ACTUALLY improve — not to be nice.`;

  const clarityExpansion = `\n═══ EXPANDED CLARITY ASSESSMENT ═══\nThe Clarity skill must consider FOUR dimensions and produce a single combined score:\n  1. Pronunciation — how clearly individual words are spoken.\n  2. Word clarity — whether the listener can understand what is being said.\n  3. Voice modulation — variation in pitch and tone to convey meaning and maintain engagement (inferred from transcript phrasing/punctuation cues if you cannot hear audio).\n  4. Voice throw — projection and volume appropriate to the speaking context.\nAll four dimensions feed into the SINGLE Clarity score. Note in the Clarity feedback which dimension(s) drove the score.\n`;

  const prompt = `${coachPersona}

═══ EVALUATION TIER: ${tier} ═══
${rubric.calibration}
${gradeBlock}${clarityExpansion}
═══ SCORING RUBRIC (per-skill guidelines) ═══
${skillRubricBlock}

═══ SCENARIO CONTEXT ═══
Challenge: "${challenge.title}"
Scenario: "${challenge.scenario}"
Task/Prompt: "${question}"

═══ REQUIRED CHECKPOINTS ═══
The response MUST address these points to score well on Relevancy and Structure:
${checkpointBlock}

CHECKPOINT ENFORCEMENT:
- Count how many checkpoints the response addresses (even partially).
- Missing checkpoints → cap Relevancy at 60, Structure at 65.
- Missing MORE THAN HALF → cap Relevancy at 45, Structure at 50.
- All checkpoints addressed (even briefly) → no cap applied.
${evaluationCriteriaBlock}${referenceAnswerBlock}${regressionContext}

═══ TRANSCRIPT TO EVALUATE ═══
"${transcript}"

═══ SCORING INSTRUCTIONS ═══
1. Score each skill independently using the rubric above. Apply tier-specific caps strictly.
2. Calculate overallScore as a WEIGHTED AVERAGE (round to nearest integer):
   Relevancy 25% + Clarity 20% + Structure 20% + Vocabulary 15% + Fluency 10% + Grammar 10%
3. Calculate xpEarned: floor(overallScore / 100 * ${challenge.xp})
   - If overallScore < ${challenge.passingScore}: xpEarned = floor(xpEarned * 0.4) (partial XP for failing)
4. In feedback, be SPECIFIC — reference exact phrases from the transcript. Don't say "good job" without citing evidence.
${idealResponseInstruction}

Return ONLY valid JSON with this exact structure:
{
  "overallScore": <0-100 integer>,
  "xpEarned": <integer>,
  "transcript": "<cleaned transcript>",
  "skills": {
    "Fluency": { "score": <0-100>, "feedback": "<1-2 sentences citing transcript>" },
    "Grammar": { "score": <0-100>, "feedback": "<1-2 sentences citing transcript>" },
    "Vocabulary": { "score": <0-100>, "feedback": "<1-2 sentences citing transcript>" },
    "Clarity": { "score": <0-100>, "feedback": "<1-2 sentences citing transcript>" },
    "Structure": { "score": <0-100>, "feedback": "<1-2 sentences citing transcript>" },
    "Relevancy": { "score": <0-100>, "feedback": "<1-2 sentences citing transcript>" }
  },
  "pauseAnalysis": {
    "status": "<Good|Fair|Needs Work>",
    "count": <integer>,
    "avgDuration": "<e.g. 1.2s>",
    "suggestion": "<one specific tip>"
  },
  "grammarIssues": [
    { "wrong": "<exact incorrect phrase from transcript>", "correct": "<corrected phrase>" }
  ],
  "fillerWords": [
    { "word": "<filler>", "count": <integer> }
  ],
  "winSpeakAnalysis": "${schoolContext ? "<2-3 VERY short sentences, simple age-appropriate words for a young child>" : "<3-4 sentence coaching summary — be direct, cite specifics, note checkpoint coverage>"}",
  "strengths": [${schoolContext ? `"<celebratory simple sentence — max 2 items only>"` : `"<strength 1>", "<strength 2>", "<strength 3>"`}],
  "improvements": [${schoolContext ? `"<ONE simple, encouraging next-step instruction — max 1 item only, e.g. 'Next time, try to use more describing words.'>"` : `"<improvement 1>", "<improvement 2>", "<improvement 3>"`}],
  "idealResponse": "<${schoolContext ? "60-90 word model answer in simple language for this specific scenario" : "130-150 word model answer for this specific scenario"}>"${schoolContext ? `,
  "confidenceScore": <0-100 estimate of how brave/confident the student sounded — based on hesitation, restarts, sentence completeness, and overall flow>,
  "whatYouGotRight": ["<one specific grammar/structure thing they did correctly>", "<another, optional>"]` : ""}
}${schoolContext ? `\n\nSCHOOL OUTPUT RULES (STRICT):\n- strengths: MAX 2 items, written like a parent praising the child. e.g. "You spoke in full sentences! 👏"\n- improvements: MAX 1 item, an actionable instruction, NEVER a criticism. e.g. "Next time, try to use more describing words."\n- winSpeakAnalysis: MAX 3 short sentences, simple words a 7-year-old understands.\n- All grammar/filler tips must be encouraging, not corrective.\n- Estimate a confidence value 0-100 (called confidenceScore in the response below).\n` : ""}`;

  return withRetry(async () => {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return JSON.parse(raw) as AnalysisResult;
  });
}
