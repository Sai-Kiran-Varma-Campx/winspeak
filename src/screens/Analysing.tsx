import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OrbCanvas from "@/components/OrbCanvas";
import { useSession } from "@/context/SessionContext";
import { useStore } from "@/context/UserStoreContext";
import { transcribeAudio, analyzeAnswer, preRenderSpeech } from "@/services/gemini";
import { TIPS, ANALYSIS_STEPS, ANALYSIS_STEP_THRESHOLDS, CHALLENGES } from "@/constants";
import { getChallengeBackPath } from "@/lib/challengeUtils";
import { loadAudioBlob, deleteAudioBlob, RECORDING_KEY, IDEAL_RESPONSE_KEY } from "@/lib/audioStorage";



export default function Analysing() {
  const navigate = useNavigate();
  const session = useSession();
  const store = useStore();
  // Use session-selected challenge, fall back to first uncompleted
  const activeChallenge = (session.challengeId
    ? CHALLENGES.find((c) => c.id === session.challengeId)
    : null) ?? CHALLENGES.find((c) => !store.completedChallengeIds.includes(c.id)) ?? CHALLENGES[0];
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [error, setError] = useState<"recording_not_found" | "analysis_failed" | null>(null);
  const hasStarted = useRef(false);

  // Tip rotator
  useEffect(() => {
    const iv = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        setTipVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  // Main analysis flow
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function run() {
      // Try in-memory first, then IndexedDB fallback
      let blob = session.recordingBlob;
      if (!blob) {
        blob = await loadAudioBlob(RECORDING_KEY).catch(() => null);
        if (blob) session.setRecordingBlob(blob); // restore into context
      }

      if (!blob) {
        setError("recording_not_found");
        return;
      }

      try {
        // Step 1: Transcribe
        setProgress(5);
        const transcript = await transcribeAudio(blob);
        session.setTranscript(transcript);
        setProgress(28);

        // Steps 2–4 advance gradually while analysis runs
        let stepProgress = 28;
        const ticker = setInterval(() => {
          stepProgress = Math.min(stepProgress + 3, 85);
          setProgress(stepProgress);
        }, 500);

        const previousAttempts = store.getAttemptsForChallenge(activeChallenge.id);
        const result = await analyzeAnswer(transcript, activeChallenge.prompt, activeChallenge, previousAttempts);
        clearInterval(ticker);

        session.setAnalysisResult(result);
        setProgress(100);
        // Clear stale ideal response audio, then pre-render new one
        deleteAudioBlob(IDEAL_RESPONSE_KEY).catch(() => {});
        preRenderSpeech(result.idealResponse, IDEAL_RESPONSE_KEY).catch(() => {});
        // Clean up stored blob — it's been consumed
        deleteAudioBlob(RECORDING_KEY).catch(() => {});
        setTimeout(() => navigate("/report"), 800);
      } catch (err) {
        console.error("Analysis failed:", err);
        setError("analysis_failed");
      }
    }

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="px-5 pt-10 pb-8 flex flex-col items-center gap-8 max-w-2xl mx-auto">
        <div
          className="border rounded-[22px] p-6 w-full text-center"
          style={{
            background: "linear-gradient(135deg, #FF4D6A08, #1A1D2E)",
            borderColor: "#FF4D6A44",
          }}
        >
          <div className="text-[40px] mb-4">
            {error === "recording_not_found" ? "🎙️" : "⚠️"}
          </div>
          <div className="text-[20px] font-extrabold mb-2">
            {error === "recording_not_found"
              ? "No Recording Found"
              : "Analysis Failed"}
          </div>
          <div className="text-[13px] mb-6" style={{ color: "var(--muted)" }}>
            {error === "recording_not_found"
              ? "Your recording couldn't be loaded. Please go back and record again."
              : "Something went wrong while analysing your response. Please try again."}
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => {
              session.reset();
              navigate("/question");
            }}>
              Try Again
            </Button>
            <Button onClick={() => {
              session.reset();
              navigate(getChallengeBackPath(activeChallenge.category));
            }}>
              Back to Challenges
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-8 flex flex-col items-center gap-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div
          className="text-[11px] font-semibold tracking-[2px] mb-2"
          style={{ color: "var(--muted)" }}
        >
          PROCESSING
        </div>
        <div className="text-[24px] font-extrabold">Analysing your answer...</div>
        <div className="text-[13px] mt-1.5" style={{ color: "var(--muted)" }}>
          {session.recordingBlob ? "WinSpeak AI is evaluating your response" : "This will take ~30 seconds"}
        </div>
      </div>

      {/* Orb */}
      <div
        className="relative flex items-center justify-center flex-shrink-0 scale-[0.78] sm:scale-100 origin-center"
        style={{ width: 180, height: 180 }}
      >
        <OrbCanvas progress={progress} />
        <div
          className="relative z-10 rounded-full flex flex-col items-center justify-center"
          style={{ width: 168, height: 168, background: "var(--bg)" }}
        >
          <div className="text-[40px]">🤖</div>
          <div className="font-black text-[20px]" style={{ color: "var(--accent)" }}>
            {progress}%
          </div>
        </div>
      </div>

      {/* Analysis Steps — 2×2 grid on desktop */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {ANALYSIS_STEPS.map((step, i) => {
          const isComplete = progress > ANALYSIS_STEP_THRESHOLDS[i];
          return (
            <div
              key={i}
              className="border rounded-[14px] p-3 flex items-center gap-3 transition-colors duration-500"
              style={{
                background: "var(--card)",
                borderColor: isComplete ? "#7C5CFC44" : "var(--border)",
              }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] flex-shrink-0 border-2 transition-all duration-500"
                style={{
                  background: isComplete ? "#22D37A22" : "var(--surface)",
                  borderColor: isComplete ? "#22D37A" : "var(--border)",
                  color: isComplete ? "#22D37A" : "var(--muted)",
                }}
              >
                {isComplete ? "✓" : "○"}
              </div>
              <span
                className="text-[13px] transition-all duration-500"
                style={{
                  color: isComplete ? "var(--text)" : "var(--muted)",
                  fontWeight: isComplete ? 700 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tip box */}
      <div
        className="border rounded-[16px] p-4 w-full flex items-center"
        style={{ background: "var(--card)", borderColor: "var(--border)", minHeight: 70 }}
      >
        <p
          className="text-[13px] leading-relaxed transition-opacity duration-300"
          style={{ opacity: tipVisible ? 1 : 0 }}
        >
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
