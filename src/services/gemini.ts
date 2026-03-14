import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult } from "@/types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const samples = new Float32Array(bytes.length / 2);
  for (let i = 0; i < samples.length; i++) {
    let s = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
    if (s >= 32768) s -= 65536;
    samples[i] = s / 32768;
  }
  return samples;
}

function playFloat32(samples: Float32Array, sampleRate = 24000): Promise<void> {
  return new Promise((resolve) => {
    const ctx = new AudioContext({ sampleRate });
    const buf = ctx.createBuffer(1, samples.length, sampleRate);
    buf.getChannelData(0).set(samples);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => {
      ctx.close();
      resolve();
    };
    src.start();
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Transcribe audio blob using Gemini STT.
 * Returns the spoken text (lowercase-trimmed).
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const base64 = await blobToBase64(blob);
  // Determine mimeType from blob; default to audio/webm
  const mimeType = blob.type || "audio/webm";

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
}

/**
 * Synthesize speech for the given text via Gemini TTS.
 * Falls back to browser speechSynthesis if TTS model is unavailable.
 */
export async function synthesizeSpeech(
  text: string,
  onStart?: () => void
): Promise<void> {
  try {
    const result = await ai.models.generateContent({
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

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const audioPart = parts.find(
      (p: { inlineData?: { mimeType?: string; data?: string } }) =>
        p.inlineData?.data
    );
    const audioData = audioPart?.inlineData?.data as string | undefined;

    if (audioData) {
      const samples = pcm16Base64ToFloat32(audioData);
      onStart?.();
      await playFloat32(samples);
      return;
    }
  } catch {
    // TTS model unavailable or error — fall through to browser fallback
  }

  // Browser speechSynthesis fallback
  onStart?.();
  await new Promise<void>((resolve) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}

/**
 * Analyze a spoken answer using Gemini and return structured feedback.
 */
export async function analyzeAnswer(
  transcript: string,
  question: string
): Promise<AnalysisResult> {
  const prompt = `You are WinSpeak, an AI speaking coach. Analyze the following spoken answer to a challenge question and return a JSON object matching the schema below exactly.

QUESTION: "${question}"

TRANSCRIPT: "${transcript}"

Return ONLY valid JSON with this exact structure:
{
  "overallScore": <0-100 integer>,
  "xpEarned": <integer, 0-1000 based on score>,
  "transcript": "<cleaned transcript>",
  "skills": {
    "Fluency": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
    "Grammar": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
    "Vocabulary": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
    "Clarity": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
    "Structure": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" },
    "Relevancy": { "score": <0-100>, "feedback": "<1-2 sentence feedback>" }
  },
  "pauseAnalysis": {
    "status": "<Good|Fair|Needs Work>",
    "count": <integer>,
    "avgDuration": "<e.g. 1.2s>",
    "suggestion": "<one tip>"
  },
  "grammarIssues": [
    { "wrong": "<incorrect phrase>", "correct": "<corrected phrase>" }
  ],
  "fillerWords": [
    { "word": "<filler>", "count": <integer> }
  ],
  "winSpeakAnalysis": "<3-4 sentence AI coaching summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "idealResponse": "<100-120 word model answer to the question>"
}`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return JSON.parse(raw) as AnalysisResult;
}
