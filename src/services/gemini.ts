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

function playFloat32(samples: Float32Array, sourceSampleRate = 24000): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getSharedAudioContext();
    _resumeCtx();

    const deviceRate = ctx.sampleRate; // e.g. 44100 or 48000

    // Resample if source rate differs from device rate
    let buffer: AudioBuffer;
    if (sourceSampleRate === deviceRate) {
      buffer = ctx.createBuffer(1, samples.length, deviceRate);
      buffer.getChannelData(0).set(samples);
    } else {
      // Linear interpolation resample: sourceSampleRate → deviceRate
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

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => resolve();
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

/**
 * Synthesize speech for the given text via Gemini TTS (streaming).
 * Throws on failure — caller handles the error.
 */
export async function synthesizeSpeech(
  text: string,
  onStart?: () => void
): Promise<void> {
  const bytes = await streamTtsBytes(text);
  const samples = pcm16BytesToFloat32(bytes);
  onStart?.();
  await playFloat32(samples);
}

/**
 * Like synthesizeSpeech but caches the PCM audio to IndexedDB under `cacheKey`.
 * On subsequent calls with the same key the audio plays instantly (no API call).
 */
export async function synthesizeSpeechCached(
  text: string,
  cacheKey: string,
  onStart?: () => void
): Promise<void> {
  // 1. Try IndexedDB cache first
  try {
    const cached = await loadAudioBlob(cacheKey);
    if (cached) {
      const arrayBuffer = await cached.arrayBuffer();
      const samples = pcm16BytesToFloat32(new Uint8Array(arrayBuffer));
      onStart?.();
      await playFloat32(samples);
      return;
    }
  } catch {
    // Cache read failed — fall through to generate
  }

  // 2. Generate via Gemini TTS using STREAMING to prevent iOS Safari timeout
  const bytes = await streamTtsBytes(text);

  // Persist to IndexedDB (fire-and-forget, don't block playback)
  saveAudioBlob(cacheKey, new Blob([bytes.buffer as ArrayBuffer], { type: "audio/pcm" })).catch(() => {});

  const samples = pcm16BytesToFloat32(bytes);
  onStart?.();
  await playFloat32(samples);
}

/**
 * Stream TTS audio from Gemini and return raw PCM bytes.
 * Uses generateContentStream to prevent iOS Safari from killing long requests.
 */
async function streamTtsBytes(text: string): Promise<Uint8Array> {
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Charon" },
        },
      },
    } as Record<string, unknown>,
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    const parts = chunk.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const data = (part as any).inlineData?.data as string | undefined;
      if (data) {
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        chunks.push(bytes);
      }
    }
  }

  if (chunks.length === 0) throw new Error("TTS stream returned no audio data");

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return merged;
}

/**
 * Prefetch coach voice audio to IndexedDB without playing it.
 */
export async function prefetchCoachVoice(text: string, cacheKey: string): Promise<void> {
  try {
    const cached = await loadAudioBlob(cacheKey);
    if (cached) return;
  } catch { /* proceed */ }

  try {
    const bytes = await streamTtsBytes(text);
    await saveAudioBlob(cacheKey, new Blob([bytes.buffer as ArrayBuffer], { type: "audio/pcm" }));
  } catch {
    // TTS unavailable — Question screen will generate on demand
  }
}

/**
 * Pre-render TTS audio and save as WAV to IndexedDB (no playback).
 * Call during analysis so the audio is ready when Report loads.
 */
export async function preRenderSpeech(text: string, cacheKey: string): Promise<void> {
  try {
    const cached = await loadAudioBlob(cacheKey);
    if (cached) return;
  } catch { /* proceed */ }

  try {
    const bytes = await streamTtsBytes(text);
    const wavBlob = pcm16ToWav(bytes);
    await saveAudioBlob(cacheKey, wavBlob);
  } catch {
    // TTS unavailable — Report will handle gracefully
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
  previousAttempts?: Attempt[]
): Promise<AnalysisResult> {
  const tier = challenge.tier ?? "Beginner";
  const rubric = TIER_RUBRICS[tier] ?? TIER_RUBRICS["Beginner"];
  const checkpoints = CHALLENGE_CHECKPOINTS[challenge.id] ?? [];
  const regressionContext = buildRegressionContext(previousAttempts ?? []);

  const skillRubricBlock = Object.entries(rubric.skillGuidelines)
    .map(([skill, guideline]) => `  - ${skill}: ${guideline}`)
    .join("\n");

  const checkpointBlock = checkpoints.length > 0
    ? checkpoints.map((cp, i) => `  ${i + 1}. ${cp}`).join("\n")
    : "  (No specific checkpoints for this challenge)";

  const prompt = `You are WinSpeak, a ruthlessly honest AI speaking coach for students. You evaluate spoken responses in academic and real-world speaking scenarios. Your job is to score accurately so students ACTUALLY improve — not to be nice.

═══ EVALUATION TIER: ${tier} ═══
${rubric.calibration}

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
${regressionContext}

═══ TRANSCRIPT TO EVALUATE ═══
"${transcript}"

═══ SCORING INSTRUCTIONS ═══
1. Score each skill independently using the rubric above. Apply tier-specific caps strictly.
2. Calculate overallScore as a WEIGHTED AVERAGE (round to nearest integer):
   Relevancy 25% + Clarity 20% + Structure 20% + Vocabulary 15% + Fluency 10% + Grammar 10%
3. Calculate xpEarned: floor(overallScore / 100 * ${challenge.xp})
   - If overallScore < ${challenge.passingScore}: xpEarned = floor(xpEarned * 0.4) (partial XP for failing)
4. In feedback, be SPECIFIC — reference exact phrases from the transcript. Don't say "good job" without citing evidence.
5. The idealResponse should be a GRADUAL ENHANCEMENT of the speaker's original transcript — keep their ideas, structure, and personality but fix grammar, remove filler words, improve vocabulary, and strengthen weak sections. Do NOT write a completely different answer. It should sound like a better version of what THEY said, not a generic model answer. Aim for 130-150 words.

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
  "winSpeakAnalysis": "<3-4 sentence coaching summary — be direct, cite specifics, note checkpoint coverage>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "idealResponse": "<130-150 word model answer for this specific scenario>"
}`;

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
