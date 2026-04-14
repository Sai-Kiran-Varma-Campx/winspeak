import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import { synthesizeSpeech, stopAudioPlayback, transcribeAudio, analyzeAnswer, preRenderSpeech, playCoachVoice } from "@/services/gemini";
import { SCHOOL_VOICE_URLS } from "@/constants/voiceUrls";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";
import FriendlyTeacher from "@/components/FriendlyTeacher";
import type { Challenge } from "@/types";

type Phase = "intro" | "recording" | "analysing" | "error";

const SCHOOL_ANALYSIS_STEPS = [
  { emoji: "🎧", label: "Listening to the recording..." },
  { emoji: "📝", label: "Checking fluency & grammar..." },
  { emoji: "⭐", label: "Scoring vocabulary & clarity..." },
  { emoji: "🔊", label: "Generating ideal audio..." },
  { emoji: "✨", label: "Creating your report card..." },
];
const STEP_THRESHOLDS = [12, 30, 55, 75, 90];

/* Pulsing ring animation for recording state */
const pulseKeyframes = `
@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}
@keyframes pulse-ring-2 {
  0% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.55); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}
`;

export default function SchoolRecording() {
  const navigate = useNavigate();
  const session = useSchoolSession();
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();

  const [phase, setPhase] = useState<Phase>("intro");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [readingInstructions, setReadingInstructions] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<number | null>(null);

  const q = session.selectedQuestion;
  const grade = session.selectedGrade;
  const studentId = session.currentStudentId;

  // Bounce out only on initial mount if missing context
  useEffect(() => {
    if (!q || grade == null || !studentId) {
      navigate("/school/administer/run", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop all audio on unmount (navigation away)
  useEffect(() => {
    return () => { stopAudioPlayback(); };
  }, []);

  // Tick elapsed seconds + auto-stop at 60s
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (phase !== "recording") return;
    tickRef.current = window.setInterval(() => {
      setElapsed((s) => {
        if (s + 1 >= 60) {
          // Auto-stop at 60 seconds
          setTimeout(() => finishRef.current(), 0);
        }
        return s + 1;
      });
    }, 1000) as unknown as number;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase]);

  const readInstructions = useCallback(async () => {
    if (!q || readingInstructions || loadingVoice || paused) return;
    setLoadingVoice(true);
    try {
      // Try pre-generated voice from CDN first (instant)
      const hasPreGenerated = !!SCHOOL_VOICE_URLS[q.id];
      if (hasPreGenerated) {
        await playCoachVoice(
          q.id,
          "",
          () => {
            setLoadingVoice(false);
            setReadingInstructions(true);
          }
        );
      } else {
        // Fallback to live TTS for custom challenges
        await synthesizeSpeech(
          `${q.scenario}. ${q.prompt}`,
          () => {
            setLoadingVoice(false);
            setReadingInstructions(true);
          }
        );
      }
    } catch {
      // best effort
    } finally {
      setLoadingVoice(false);
      setReadingInstructions(false);
    }
  }, [q, readingInstructions, loadingVoice, paused]);

  const pauseInstructions = useCallback(() => {
    stopAudioPlayback();
    setReadingInstructions(false);
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  async function begin() {
    setError("");
    try {
      await startRecording();
      setPhase("recording");
      setElapsed(0);
    } catch (e: any) {
      setError(e?.message || "Could not start microphone.");
      setPhase("error");
    }
  }

  async function finish() {
    if (!q || grade == null || !studentId) return;
    setPhase("analysing");
    setProgress(0);
    try {
      const blob = await stopRecording();

      // Step 1: Listening to the recording (transcribe)
      setProgress(5);
      const transcript = await transcribeAudio(blob);
      setProgress(20);

      // Check for minimal/no speech — if less than 5 words, skip AI analysis
      const wordCount = (transcript || "").trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 5) {
        // Too little speech — save with near-zero scores
        const saved = await api.createSchoolAttempt({
          studentId,
          categoryId: q.categoryId,
          questionId: q.id,
          questionTitle: q.title,
          grade,
          score: 0,
          skills: { Fluency: 0, Grammar: 0, Vocabulary: 0, Clarity: 0, Structure: 0, Relevancy: 0 },
          confidenceScore: 0,
          analysisResult: {
            overallScore: 0,
            transcript: transcript || "(no speech detected)",
            skills: {
              Fluency: { score: 0, feedback: "We couldn't hear enough words. Try speaking more next time!" },
              Grammar: { score: 0, feedback: "Speak in full sentences so we can check your grammar." },
              Vocabulary: { score: 0, feedback: "Use more words to show your vocabulary." },
              Clarity: { score: 0, feedback: "Try speaking clearly and loudly into the mic." },
              Structure: { score: 0, feedback: "Tell us a full answer with a beginning, middle, and end." },
              Relevancy: { score: 0, feedback: "Make sure to answer the question that was asked." },
            },
            winSpeakAnalysis: "It looks like you didn't speak enough this time. That's okay! Next time, try to talk about the topic for the full time.",
            strengths: ["You showed up and tried — that takes courage!"],
            improvements: ["Next time, try to speak for the full 30 seconds about the topic."],
            confidenceScore: 0,
            whatYouGotRight: [],
          },
        });
        session.markStudentDone(studentId);
        setProgress(100);
        setTimeout(() => navigate(`/school/report/${saved.id}`, { replace: true }), 800);
        return;
      }

      // Step 2-3: Checking fluency, grammar, vocabulary, clarity (analysis)
      let stepProgress = 20;
      const ticker = setInterval(() => {
        stepProgress = Math.min(stepProgress + 2, 70);
        setProgress(stepProgress);
      }, 400);

      const challengeStub: Challenge = {
        id: `school:${q.id}`,
        title: q.title,
        description: q.scenario,
        scenario: q.scenario,
        prompt: q.prompt,
        xp: 0,
        status: "active",
        week: "",
        passingScore: 50,
        maxAttempts: 99,
        category: "speaking",
        tier: `Grade${grade}` as any,
      };

      const result = await analyzeAnswer(transcript, q.prompt, challengeStub, [], {
        grade,
      });
      clearInterval(ticker);
      setProgress(72);

      // Step 4: Generate ideal audio (so it's instant on the report)
      const skills: Record<string, number> = {};
      if (result.skills) {
        Object.entries(result.skills).forEach(([k, v]) => {
          if (v && typeof v.score === "number") skills[k] = v.score;
        });
      }

      // Save attempt first to get the ID for caching
      const saved = await api.createSchoolAttempt({
        studentId,
        categoryId: q.categoryId,
        questionId: q.id,
        questionTitle: q.title,
        grade,
        score: result.overallScore ?? 0,
        skills,
        confidenceScore: result.confidenceScore,
        analysisResult: result,
      });
      setProgress(78);

      // Generate ideal response audio now (not in background)
      if (result.idealResponse) {
        try {
          await preRenderSpeech(result.idealResponse, `school_ideal_${saved.id}`);
        } catch {
          // best effort — report still works without audio
        }
      }
      setProgress(92);

      // Step 5: Creating report card
      session.markStudentDone(studentId);
      setProgress(100);

      // Show 100% briefly, then navigate to report
      setTimeout(() => {
        navigate(`/school/report/${saved.id}`, { replace: true });
      }, 800);
    } catch (e: any) {
      setError(e?.message || "Something went wrong while analysing the recording.");
      setPhase("error");
    }
  }

  if (!q || grade == null) return null;

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-32">
      {/* Inject pulse animation keyframes */}
      <style>{pulseKeyframes}</style>

      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button
          onClick={() => {
            stopAudioPlayback();
            navigate("/school/administer/run");
          }}
          className="school-btn-back"
          style={{ marginBottom: 20, width: 48, height: 48, borderRadius: 16 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid rgba(124,58,237,0.18)", borderRadius: 20,
          padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
          }}>🎤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              Grade {grade} Challenge
            </div>
            <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", color: "#4C1D95", fontSize: 24, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
              {q.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {/* Teacher avatar — only shows speaking animation when audio is actually playing */}
        <div style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          padding: 24, textAlign: "center", marginBottom: 24, borderRadius: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FriendlyTeacher speaking={readingInstructions} size={100} />
          </div>
          <div style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 20, marginTop: 8, fontWeight: 800, color: "#4C1D95",
          }}>
            {loadingVoice ? "Preparing voice..." : readingInstructions ? "Listen carefully..." : "Your Speaking Coach"}
          </div>
          <div style={{ fontSize: 14, marginTop: 4, fontWeight: 600, color: "#6E5E8A" }}>
            {loadingVoice
              ? "Generating audio, one moment..."
              : readingInstructions
              ? "The question is being read out to you."
              : "Tap 'Read it to me' to hear the question, then record your answer."}
          </div>
        </div>

        {/* Question + audio controls */}
        <div style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          padding: 24, marginBottom: 32, borderRadius: 24,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase" as const, marginBottom: 16, color: "#6E5E8A",
          }}>QUESTION</div>
          <div style={{ fontSize: 16, marginBottom: 12, lineHeight: 1.6, color: "#4C1D95" }}>
            <strong style={{ fontWeight: 800 }}>Scene:</strong> {q.scenario}
          </div>
          <div style={{ fontSize: 16, marginBottom: 24, lineHeight: 1.6, color: "#4C1D95" }}>
            <strong style={{ fontWeight: 800 }}>Your task:</strong> {q.prompt}
          </div>
          <div className="flex gap-3">
            {!readingInstructions && !loadingVoice && !paused && (
              <button
                onClick={readInstructions}
                style={{
                  borderRadius: 999, padding: "10px 20px",
                  fontSize: 13, textTransform: "uppercase" as const, letterSpacing: "0.1em",
                  fontWeight: 800, cursor: "pointer",
                  background: "#EDE9FE", border: "1.5px solid #C4B5FD", color: "#7C3AED",
                  boxShadow: "0 2px 0 rgba(124,58,237,0.15)",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                Read it to me 🔊
              </button>
            )}
            {loadingVoice && (
              <div style={{
                borderRadius: 999, padding: "10px 20px",
                fontSize: 13, textTransform: "uppercase" as const, letterSpacing: "0.1em",
                fontWeight: 800,
                background: "#F3E8FF", border: "1.5px solid #D8B4FE", color: "#9333EA",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Spinner size={14} /> Generating voice...
              </div>
            )}
            {readingInstructions && (
              <button
                onClick={pauseInstructions}
                style={{
                  borderRadius: 999, padding: "10px 20px",
                  fontSize: 13, textTransform: "uppercase" as const, letterSpacing: "0.1em",
                  fontWeight: 800, cursor: "pointer",
                  background: "#F3E8FF", border: "1.5px solid #D8B4FE", color: "#9333EA",
                  boxShadow: "0 2px 0 rgba(147,51,234,0.15)",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                ⏸ Pause
              </button>
            )}
            {paused && (
              <button
                onClick={resume}
                style={{
                  borderRadius: 999, padding: "10px 20px",
                  fontSize: 13, textTransform: "uppercase" as const, letterSpacing: "0.1em",
                  fontWeight: 800, cursor: "pointer",
                  background: "#CCFBF1", border: "1.5px solid #5EEAD4", color: "#0D9488",
                  boxShadow: "0 2px 0 rgba(13,148,136,0.15)",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                ▶ Continue
              </button>
            )}
          </div>
        </div>

        {/* Phase: intro */}
        {phase === "intro" && (
          <button
            onClick={begin}
            style={{
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              width: "100%", borderRadius: 20, padding: "16px 0",
              fontSize: 16, fontWeight: 800, border: "none", color: "#fff",
              boxShadow: "0 4px 0 #5B21B6",
              cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.1em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            🎙 Start Recording
          </button>
        )}

        {/* Phase: recording */}
        {phase === "recording" && (
          <div style={{
            background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
            padding: 40, textAlign: "center", borderRadius: 26,
          }}>
            {/* Pulsing mic area */}
            <div className="flex justify-center mb-4">
              <div style={{ position: "relative", width: 110, height: 110 }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "2.5px solid rgba(124,58,237,0.3)",
                  animation: "pulse-ring 2s ease-out infinite",
                }} />
                <div style={{
                  position: "absolute", inset: 10, borderRadius: "50%",
                  border: "2.5px solid rgba(167,139,250,0.3)",
                  animation: "pulse-ring-2 2s ease-out infinite 0.4s",
                }} />
                <div style={{
                  position: "absolute", inset: 22, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                  display: "grid", placeItems: "center", fontSize: 34,
                  boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
                }}>
                  🎙
                </div>
              </div>
            </div>

            <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 14, fontWeight: 500, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Recording</div>
            <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 40, fontWeight: 500, color: "#4C1D95", letterSpacing: "0.05em", marginBottom: 28 }}>
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
            </div>
            <button
              onClick={() => { if (phase === "recording" && elapsed >= 30) finish(); }}
              disabled={elapsed < 30}
              style={{
                maxWidth: 280, width: "100%", margin: "0 auto", padding: "16px 0",
                borderRadius: 30, border: "none",
                cursor: elapsed < 30 ? "not-allowed" : "pointer",
                background: elapsed < 30
                  ? "rgba(124,58,237,0.25)"
                  : "linear-gradient(135deg, #7C3AED, #A78BFA)",
                color: "#fff", fontSize: 16, fontWeight: 800,
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                boxShadow: elapsed < 30 ? "none" : "0 4px 15px rgba(124,58,237,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              {elapsed < 30 ? `Wait ${30 - elapsed}s` : elapsed >= 55 ? `Auto-stop in ${60 - elapsed}s` : "Stop Recording"}
            </button>
          </div>
        )}

        {/* Phase: analysing */}
        {phase === "analysing" && (
          <div style={{
            background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
            borderRadius: 26, padding: "32px 24px",
          }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
                background: progress < 100 ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "linear-gradient(135deg, #7C3AED, #C4B5FD)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
                boxShadow: "0 4px 15px rgba(124,58,237,0.25)",
              }}>
                {progress < 100 ? "🧠" : "🎉"}
              </div>
              <div style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                fontSize: 22, color: "#4C1D95", marginBottom: 4,
              }}>
                {progress < 100 ? "Creating your report..." : "Report ready!"}
              </div>
              <div style={{ fontSize: 13, color: "#6E5E8A", fontWeight: 500 }}>
                {progress < 100 ? "This takes about 30 seconds" : "Let's see how you did!"}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 8, borderRadius: 999, background: "rgba(124,58,237,0.08)",
              overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                width: `${progress}%`,
                transition: "width 0.5s ease",
                boxShadow: "0 0 8px rgba(124,58,237,0.3)",
              }} />
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SCHOOL_ANALYSIS_STEPS.map((step, i) => {
                const isComplete = progress > STEP_THRESHOLDS[i];
                const isActive = !isComplete && (i === 0 || progress > STEP_THRESHOLDS[i - 1]);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 14,
                    background: isComplete ? "rgba(124,58,237,0.08)" : isActive ? "rgba(124,58,237,0.05)" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${isComplete ? "rgba(124,58,237,0.2)" : isActive ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.06)"}`,
                    transition: "all 0.4s ease",
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: isComplete ? "#7C3AED" : isActive ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "rgba(124,58,237,0.06)",
                      display: "grid", placeItems: "center",
                      fontSize: isComplete ? 14 : 16, color: isComplete || isActive ? "#fff" : "#6E5E8A",
                      flexShrink: 0,
                      transition: "all 0.4s ease",
                    }}>
                      {isComplete ? "✓" : step.emoji}
                    </div>
                    <span style={{
                      fontFamily: "'Fredoka', 'Sora', sans-serif",
                      fontSize: 14,
                      fontWeight: isComplete ? 700 : isActive ? 700 : 500,
                      color: isComplete ? "#4C1D95" : isActive ? "#4C1D95" : "#6E5E8A",
                      transition: "all 0.4s ease",
                    }}>
                      {isComplete ? step.label.replace("...", " ✓") : step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase: error */}
        {phase === "error" && (
          <div style={{
            background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
            padding: 32, textAlign: "center", borderRadius: 24,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😞</div>
            <div style={{
              fontFamily: "'Fredoka', 'Sora', sans-serif",
              fontSize: 22, fontWeight: 800, color: "#4C1D95", marginBottom: 4,
            }}>Oops, something went wrong</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#6E5E8A", marginBottom: 20 }}>{error}</div>
            <button
              onClick={() => setPhase("intro")}
              style={{
                background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                borderRadius: 30, padding: "14px 36px",
                fontSize: 15, fontWeight: 700,
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                border: "none", color: "white",
                boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
