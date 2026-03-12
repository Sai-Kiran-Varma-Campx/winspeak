import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import CircularTimer from "@/components/CircularTimer";
import Waveform from "@/components/Waveform";
import { useCountdown } from "@/hooks/useCountdown";
import { MAX_RETRIES, RECORDING_DURATION_SECS } from "@/constants";

type Phase = "timer" | "review";

const STEPS = [
  { label: "Audio Check", status: "completed" as const },
  { label: "Rules & Question", status: "completed" as const },
  { label: "Record", status: "active" as const },
];

export default function Recording() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("timer");
  const [isRecording, setIsRecording] = useState(false);
  const [retriesLeft, setRetriesLeft] = useState(MAX_RETRIES);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const { seconds, start, reset } = useCountdown(RECORDING_DURATION_SECS);

  function handleStartRecording() {
    setIsRecording(true);
    reset(RECORDING_DURATION_SECS);
    start();
  }

  function finishRecording(secs: number) {
    setIsRecording(false);
    setElapsed(RECORDING_DURATION_SECS - secs);
    setPhase("review");
  }

  function handleStop() {
    finishRecording(seconds);
  }

  // Auto-stop when timer hits 0
  if (isRecording && seconds === 0 && phase === "timer") {
    finishRecording(0);
  }

  function handleRetry() {
    if (retriesLeft <= 0) return;
    setRetriesLeft((r) => r - 1);
    setPhase("timer");
    setIsRecording(false);
    setPlayProgress(0);
    setIsPlaying(false);
    reset(RECORDING_DURATION_SECS);
  }

  function handlePlay() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    let p = playProgress;
    const iv = setInterval(() => {
      p += 3;
      setPlayProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        setIsPlaying(false);
      }
    }, 500);
  }

  const playTimeSecs = Math.floor((playProgress / 100) * elapsed);

  return (
    <div className="p-5 pb-8 flex flex-col gap-5">
      {/* Back + title — only in timer phase */}
      {phase === "timer" && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/question")}
            className="rounded-[10px] px-3.5 py-2 text-[18px] cursor-pointer border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            ←
          </button>
          <div>
            <div className="text-[11px] font-semibold tracking-[1px]" style={{ color: "var(--muted)" }}>
              STEP 3 OF 3
            </div>
            <div className="text-[18px] font-extrabold">Record Your Answer</div>
          </div>
        </div>
      )}

      <StepProgress steps={STEPS} />

      {/* Timer Phase */}
      {phase === "timer" && (
        <>
          <div className="flex justify-center items-center py-5">
            <CircularTimer seconds={seconds} isRecording={isRecording} />
          </div>

          {isRecording && (
            <div
              className="border rounded-[18px] p-4"
              style={{ background: "var(--card)", borderColor: "#FF4D6A33" }}
            >
              <Waveform barCount={40} active={isRecording} variant="recording" />
            </div>
          )}

          {!isRecording ? (
            <Button onClick={handleStartRecording}>🔴 Start Recording</Button>
          ) : (
            <Button variant="danger" onClick={handleStop}>■ Stop Recording</Button>
          )}
        </>
      )}

      {/* Review Phase */}
      {phase === "review" && (
        <div className="flex flex-col gap-4">
          {/* Saved confirmation */}
          <div
            className="border rounded-[20px] p-4 flex items-center gap-3.5"
            style={{ background: "#22D37A11", borderColor: "#22D37A44" }}
          >
            <div className="text-[32px]">🎙️</div>
            <div>
              <div className="font-extrabold text-[15px]" style={{ color: "#22D37A" }}>
                Recording Saved!
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
                Duration: {elapsed}s · Ready to review
              </div>
            </div>
          </div>

          {/* Player */}
          <div
            className="border rounded-[18px] p-4.5"
            style={{ background: "var(--card)", borderColor: "var(--border)", padding: "18px" }}
          >
            <div
              className="text-[10px] font-bold tracking-[1px] mb-3"
              style={{ color: "var(--muted)" }}
            >
              YOUR RESPONSE
            </div>
            <div className="flex items-center gap-3.5">
              <button
                onClick={handlePlay}
                className="w-12 h-12 rounded-full border-none flex items-center justify-center text-[18px] cursor-pointer flex-shrink-0 text-white"
                style={{
                  background: "linear-gradient(135deg,var(--accent),#9B7BFF)",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                }}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <div className="flex-1">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${playProgress}%`,
                      background: "linear-gradient(90deg,var(--accent),var(--accent)cc)",
                      boxShadow: "0 0 8px var(--accent-glow)",
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                    0:{String(playTimeSecs).padStart(2, "0")}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                    0:{String(elapsed).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="danger"
            disabled={retriesLeft === 0}
            onClick={handleRetry}
          >
            {retriesLeft === 0
              ? "No retries remaining"
              : `🔄 Retry · ${retriesLeft} attempt${retriesLeft !== 1 ? "s" : ""} left`}
          </Button>

          <Button onClick={() => navigate("/analysing")}>Submit →</Button>
        </div>
      )}
    </div>
  );
}
