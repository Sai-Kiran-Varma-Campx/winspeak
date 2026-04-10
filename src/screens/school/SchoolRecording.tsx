import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import { synthesizeSpeech, stopAudioPlayback, transcribeAudio, analyzeAnswer, preRenderSpeech } from "@/services/gemini";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";
import FriendlyTeacher from "@/components/FriendlyTeacher";
import type { Challenge } from "@/types";

type Phase = "intro" | "recording" | "analysing" | "error";

const SCHOOL_ANALYSIS_STEPS = [
  { emoji: "🎧", label: "Listening to the recording..." },
  { emoji: "📝", label: "Checking fluency & grammar..." },
  { emoji: "⭐", label: "Scoring vocabulary & clarity..." },
  { emoji: "✨", label: "Creating your report card..." },
];
const STEP_THRESHOLDS = [15, 40, 65, 88];

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

  // Tick elapsed seconds
  useEffect(() => {
    if (phase !== "recording") return;
    tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000) as unknown as number;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [phase]);

  const readInstructions = useCallback(async () => {
    if (!q || readingInstructions || paused) return;
    setReadingInstructions(true);
    try {
      await synthesizeSpeech(`${q.scenario}. ${q.prompt}`);
    } catch {
      // best effort
    } finally {
      setReadingInstructions(false);
    }
  }, [q, readingInstructions, paused]);

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

      // Step 1: Transcribe
      setProgress(5);
      const transcript = await transcribeAudio(blob);
      setProgress(25);

      // Progress ticker while analysis runs
      let stepProgress = 25;
      const ticker = setInterval(() => {
        stepProgress = Math.min(stepProgress + 2, 88);
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
        tier: grade <= 2 ? "Beginner" : grade === 3 ? "Intermediate" : "Advanced",
      };

      const result = await analyzeAnswer(transcript, q.prompt, challengeStub, [], {
        grade: grade as 1 | 2 | 3 | 4,
      });
      clearInterval(ticker);
      setProgress(92);

      const skills: Record<string, number> = {};
      if (result.skills) {
        Object.entries(result.skills).forEach(([k, v]) => {
          if (v && typeof v.score === "number") skills[k] = v.score;
        });
      }

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

      setProgress(100);
      session.markStudentDone(studentId);

      // Pre-render ideal response audio in background so it's instant on the report
      if (result.idealResponse) {
        preRenderSpeech(result.idealResponse, `school_ideal_${saved.id}`).catch(() => {});
      }

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
        <div className="inline-block px-3 py-1 mb-3 rounded-full bg-[#FEF2E8] border-[1.5px] border-[rgba(124,45,18,0.12)] text-[11px] font-black tracking-widest text-[#A8603C] uppercase">
          GRADE {grade}
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif" }} className="font-black text-[36px] tracking-[-0.02em] text-[#7C2D12] leading-tight">{q.title}</h1>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {/* Friendly teacher avatar */}
        <div className="bg-[#FED7AA] border-[1.5px] border-[#FDBA74] p-6 text-center mb-6 shadow-[0_2px_0_rgba(42,31,26,0.06)] rounded-[24px]">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FriendlyTeacher speaking={readingInstructions} size={100} />
          </div>
          <div style={{ fontFamily: "'Sora', sans-serif" }} className="text-[20px] mt-2 font-black text-[#7C2D12]">Hi! I'm your speaking coach.</div>
          <div className="text-[14px] mt-1 font-semibold text-[#A8603C]">
            Listen to the question, then tap Record when you're ready.
          </div>
        </div>

        {/* Question + audio with pause */}
        <div className="bg-white border-[1.5px] border-[rgba(124,45,18,0.12)] p-6 mb-8 rounded-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)]">
          <div className="text-[12px] font-black tracking-[0.08em] uppercase mb-4 text-[#A8603C]">QUESTION</div>
          <div className="text-[16px] mb-3 leading-relaxed text-[#7C2D12]"><strong className="font-black">Scene:</strong> {q.scenario}</div>
          <div className="text-[16px] mb-6 leading-relaxed text-[#7C2D12]"><strong className="font-black">Your task:</strong> {q.prompt}</div>
          <div className="flex gap-3">
            {!readingInstructions && !paused && (
              <button
                onClick={readInstructions}
                className="rounded-full px-5 py-2.5 text-[13px] uppercase tracking-widest font-black border-[1.5px] border-[#F9A8D4] bg-[#FCE7F3] text-[#DB2777] shadow-[0_2px_0_rgba(219,39,119,0.2)] cursor-pointer hover:-translate-y-0.5 transition-all w-fit flex items-center justify-center gap-2"
              >
                Read it to me 🔊
              </button>
            )}
            {readingInstructions && (
              <button
                onClick={pauseInstructions}
                className="rounded-full px-5 py-2.5 text-[13px] uppercase tracking-widest font-black border-[1.5px] border-[#FCD34D] bg-[#FEF3C7] text-[#D97706] shadow-[0_2px_0_rgba(163,123,0,0.2)] cursor-pointer hover:-translate-y-0.5 transition-all w-fit flex items-center justify-center gap-2"
              >
                ⏸ Pause
              </button>
            )}
            {paused && (
              <button
                onClick={resume}
                className="rounded-full px-5 py-2.5 text-[13px] uppercase tracking-widest font-black border-[1.5px] border-[#5EEAD4] bg-[#CCFBF1] text-[#0D9488] shadow-[0_2px_0_rgba(13,148,136,0.2)] cursor-pointer hover:-translate-y-0.5 transition-all w-fit flex items-center justify-center gap-2"
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
            style={{ background: "linear-gradient(135deg, #EA580C, #DB2777)" }}
            className="w-full rounded-[20px] py-4 text-[16px] font-black border-none text-[#fff] shadow-[0_4px_0_#B7350F] cursor-pointer hover:translate-y-[1px] hover:shadow-[0_3px_0_#B7350F] transition-all active:translate-y-[3px] active:shadow-[0_1px_0_#B7350F] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            🎙 Start Recording
          </button>
        )}

        {/* Phase: recording — kid-friendly big mic with pulsing rings */}
        {phase === "recording" && (
          <div className="bg-white border-[2px] border-[#F43F5E] p-10 text-center rounded-[26px] shadow-[0_4px_16px_rgba(244,63,94,0.18)] animate-in zoom-in-95 duration-300">
            {/* Pulsing mic area */}
            <div className="flex justify-center mb-4">
              <div style={{ position: "relative", width: 120, height: 120 }}>
                {/* Outer pulse ring */}
                <div style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  border: "3px solid #F43F5E",
                  animation: "pulse-ring 2s ease-out infinite",
                }} />
                {/* Inner pulse ring */}
                <div style={{
                  position: "absolute", inset: 10,
                  borderRadius: "50%",
                  border: "3px solid #EA580C",
                  animation: "pulse-ring-2 2s ease-out infinite 0.4s",
                }} />
                {/* Center mic */}
                <div style={{
                  position: "absolute", inset: 20,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #EA580C, #DB2777)",
                  display: "grid", placeItems: "center",
                  fontSize: 40,
                  boxShadow: "0 4px 20px rgba(234,88,12,0.3)",
                }}>
                  🎙
                </div>
              </div>
            </div>

            <div style={{ fontFamily: "'Sora', sans-serif" }} className="text-[26px] font-black text-[#F43F5E] mb-2">Recording...</div>
            <div style={{ fontFamily: "'Sora', sans-serif" }} className="text-[36px] font-black text-[#7C2D12] font-mono tracking-wider mb-6">
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
            </div>
            <button
              onClick={finish}
              disabled={!isRecording}
              className="school-btn-next"
              style={{ maxWidth: 260, margin: "0 auto", height: 54, borderRadius: 18 }}
            >
              ⏹ Done <span className="btn-icon">✓</span>
            </button>
          </div>
        )}

        {/* Phase: analysing — kid-friendly progress */}
        {phase === "analysing" && (
          <div className="animate-in zoom-in-95 duration-300" style={{
            background: "#fff", border: "1.5px solid rgba(124,45,18,0.12)",
            borderRadius: 26, padding: "32px 24px",
            boxShadow: "0 2px 0 rgba(124,45,18,0.06)",
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>
                {progress < 100 ? "🧠" : "🎉"}
              </div>
              <div style={{
                fontFamily: "'Sora', sans-serif", fontWeight: 800,
                fontSize: 22, color: "#7C2D12", marginBottom: 4,
              }}>
                {progress < 100 ? "Creating your report..." : "Report ready!"}
              </div>
              <div style={{ fontSize: 13, color: "#A8603C", fontWeight: 500 }}>
                {progress < 100 ? "This takes about 30 seconds" : "Let's see how you did!"}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 12, borderRadius: 999, background: "rgba(124,45,18,0.06)",
              overflow: "hidden", marginBottom: 24,
            }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: progress < 100
                  ? "linear-gradient(90deg, #EA580C, #DB2777)"
                  : "#0D9488",
                width: `${progress}%`,
                transition: "width 0.5s ease, background 0.3s",
                boxShadow: "0 0 10px rgba(234,88,12,0.3)",
              }} />
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SCHOOL_ANALYSIS_STEPS.map((step, i) => {
                const isComplete = progress > STEP_THRESHOLDS[i];
                const isActive = !isComplete && (i === 0 || progress > STEP_THRESHOLDS[i - 1]);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 16,
                    background: isComplete ? "#CCFBF1" : isActive ? "#FEF3C7" : "#FFF8F3",
                    border: `1.5px solid ${isComplete ? "#5EEAD4" : isActive ? "#FCD34D" : "rgba(124,45,18,0.08)"}`,
                    transition: "all 0.4s ease",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: isComplete ? "#0D9488" : isActive ? "#F59E0B" : "rgba(124,45,18,0.06)",
                      display: "grid", placeItems: "center",
                      fontSize: isComplete ? 16 : 18, color: "#fff",
                      flexShrink: 0,
                      transition: "all 0.4s ease",
                    }}>
                      {isComplete ? "✓" : step.emoji}
                    </div>
                    <span style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: 14,
                      fontWeight: isComplete ? 700 : isActive ? 700 : 500,
                      color: isComplete ? "#0D9488" : isActive ? "#92400E" : "#A8603C",
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
          <div className="bg-white border-[2px] border-[#F43F5E] p-8 text-center rounded-[24px] shadow-[0_4px_12px_rgba(244,63,94,0.15)]">
            <div className="text-[40px] mb-3">😞</div>
            <div style={{ fontFamily: "'Sora', sans-serif" }} className="text-[22px] font-black text-[#7C2D12] mb-1">Oops, something went wrong</div>
            <div className="text-[14px] font-semibold text-[#A8603C] mb-5">{error}</div>
            <button
              onClick={() => setPhase("intro")}
              style={{ background: "linear-gradient(135deg, #EA580C, #DB2777)" }}
              className="rounded-[18px] px-8 py-3 text-[14px] uppercase tracking-widest font-black border-none text-white shadow-[0_4px_0_#B7350F] cursor-pointer hover:translate-y-[1px] hover:shadow-[0_3px_0_#B7350F] transition-all active:translate-y-[3px] active:shadow-[0_1px_0_#B7350F]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
