import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import CircularTimer from "@/components/CircularTimer";
import Waveform from "@/components/Waveform";
import { useCountdown } from "@/hooks/useCountdown";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSession } from "@/context/SessionContext";
import { MAX_RETRIES, RECORDING_DURATION_SECS } from "@/constants";

type Phase = "timer" | "review";

const STEPS = [
  { label: "Audio Check", status: "completed" as const },
  { label: "Rules & Question", status: "completed" as const },
  { label: "Record", status: "active" as const },
];

const WAVE_BAR_COUNT = 40;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Animated waveform bars that fill as audio progresses */
function AudioWaveViz({ playing, progress }: { playing: boolean; progress: number }) {
  const bars = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
    const base = Math.sin(i * 0.8) * 0.3 + Math.cos(i * 1.5) * 0.25 + 0.5;
    return Math.max(0.15, Math.min(1, base));
  });

  return (
    <div className="flex items-center gap-[2px] h-10 w-full">
      {bars.map((h, i) => {
        const barPos = i / WAVE_BAR_COUNT;
        const isPast = barPos < progress;
        return (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${h * 100}%`,
              background: isPast
                ? "linear-gradient(180deg, #7C5CFC, #C084FC)"
                : "var(--border)",
              opacity: isPast ? 1 : 0.4,
              animation: playing && isPast
                ? `soundwave 0.6s ${(i % 5) * 0.08}s ease-in-out infinite alternate`
                : "none",
              transition: "background 0.15s, opacity 0.15s",
            }}
          />
        );
      })}
    </div>
  );
}

export default function Recording() {
  const navigate = useNavigate();
  const session = useSession();
  const [phase, setPhase] = useState<Phase>("timer");
  const [retriesLeft, setRetriesLeft] = useState(MAX_RETRIES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const progress = duration > 0 ? currentTime / duration : 0;

  const { seconds, start, reset } = useCountdown(RECORDING_DURATION_SECS);
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Set up audio element when blobUrl changes
  useEffect(() => {
    if (!blobUrl) return;
    const audio = new Audio(blobUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [blobUrl]);

  async function handleStartRecording() {
    reset(RECORDING_DURATION_SECS);
    try {
      await startRecording();
      start();
    } catch {
      // mic denied — user will see frozen timer
    }
  }

  async function handleStop() {
    const blob = await stopRecording();
    const recElapsed = RECORDING_DURATION_SECS - seconds;
    setElapsed(recElapsed > 0 ? recElapsed : RECORDING_DURATION_SECS);

    setSaving(true);
    setSaveError(null);
    try {
      await session.setRecordingBlob(blob);
    } catch {
      setSaveError("Failed to save recording. Please try again.");
      setSaving(false);
      return;
    }
    setSaving(false);

    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    setPhase("review");
  }

  // Auto-stop when countdown hits 0
  useEffect(() => {
    if (isRecording && seconds === 0) {
      handleStop();
    }
  }, [seconds, isRecording]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRetry() {
    if (retriesLeft <= 0) return;
    setRetriesLeft((r) => r - 1);
    setPhase("timer");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    reset(RECORDING_DURATION_SECS);
  }

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  return (
    <div className="p-4 sm:p-5 pb-8 flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/question")}
          className="rounded-[10px] px-3 sm:px-3.5 py-2 text-[18px] cursor-pointer border"
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
          <div className="text-[18px] font-extrabold">
            {phase === "review" ? "Review Recording" : "Record Your Answer"}
          </div>
        </div>
      </div>

      <StepProgress steps={STEPS} />

      {/* Timer Phase */}
      {phase === "timer" && (
        <>
          <div className="flex justify-center items-center py-4 sm:py-5">
            <CircularTimer seconds={seconds} isRecording={isRecording} />
          </div>

          {isRecording && (
            <div
              className="border rounded-[18px] p-3 sm:p-4"
              style={{ background: "var(--card)", borderColor: "#FF4D6A33" }}
            >
              <Waveform barCount={40} active={isRecording} variant="recording" />
            </div>
          )}

          {!isRecording ? (
            <Button onClick={handleStartRecording}>Start Recording</Button>
          ) : (
            <Button variant="danger" onClick={handleStop}>Stop Recording</Button>
          )}
        </>
      )}

      {/* Review Phase */}
      {phase === "review" && (
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Saved confirmation */}
          <div
            className="border rounded-[18px] sm:rounded-[20px] p-3.5 sm:p-4 flex items-center gap-3"
            style={{ background: "#22D37A11", borderColor: "#22D37A44" }}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#22D37A22" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22D37A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[14px] sm:text-[15px]" style={{ color: "#22D37A" }}>
                Recording Saved!
              </div>
              <div className="text-[11px] sm:text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
                Duration: {elapsed}s
              </div>
            </div>
            <div
              className="hidden sm:flex border rounded-[10px] px-2.5 py-1.5 items-center gap-1.5 flex-shrink-0"
              style={{ background: "#7C5CFC11", borderColor: "#7C5CFC33" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
                Stored locally
              </span>
            </div>
          </div>

          {/* Animated audio player */}
          <div
            className="border rounded-[18px] sm:rounded-[20px] p-4 sm:p-5"
            style={{
              background: isPlaying
                ? "linear-gradient(135deg, #1A1D2E, #7C5CFC08)"
                : "var(--card)",
              borderColor: isPlaying ? "#7C5CFC44" : "var(--border)",
              transition: "all 0.3s ease",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div
                className="text-[10px] font-bold tracking-[1.2px]"
                style={{ color: "var(--muted)" }}
              >
                YOUR RESPONSE
              </div>
              {isPlaying && (
                <div className="flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px]">
                    {[3, 5, 4, 6, 3].map((h, i) => (
                      <span
                        key={i}
                        className="w-[2.5px] rounded-full block"
                        style={{
                          height: h * 2.5,
                          background: "#7C5CFC",
                          animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: "#A78BFA" }}>
                    Playing
                  </span>
                </div>
              )}
            </div>

            {/* Play button + info row */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              {/* Play/Pause button */}
              <button
                onClick={togglePlay}
                disabled={!blobUrl}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-none flex items-center justify-center cursor-pointer flex-shrink-0 disabled:opacity-40 transition-all"
                style={{
                  background: isPlaying
                    ? "linear-gradient(135deg,#7C5CFC,#C084FC)"
                    : "var(--surface)",
                  boxShadow: isPlaying ? "0 0 24px #7C5CFC44" : "none",
                  color: isPlaying ? "#fff" : "var(--text)",
                }}
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="text-[13px] sm:text-[14px] font-bold truncate">
                  {isPlaying ? "Playing your response..." : "Tap to review your answer"}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                  {formatTime(currentTime)} / {formatTime(duration || elapsed)}
                </div>
              </div>
            </div>

            {/* Waveform visualization */}
            <div className="mb-3">
              <AudioWaveViz playing={isPlaying} progress={progress} />
            </div>

            {/* Seekable progress bar */}
            <div
              className="h-[6px] rounded-full cursor-pointer relative group"
              style={{ background: "var(--border)" }}
              onClick={seekTo}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: "linear-gradient(90deg, #7C5CFC, #C084FC)",
                  boxShadow: isPlaying ? "0 0 8px #7C5CFC44" : "none",
                }}
              />
              {/* Scrubber dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 sm:w-3.5 sm:h-3.5 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                style={{
                  left: `calc(${progress * 100}% - 10px)`,
                  background: "#fff",
                  boxShadow: "0 0 8px #7C5CFC88",
                }}
              />
            </div>

            {/* Time labels */}
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--muted)" }}>
                {formatTime(currentTime)}
              </span>
              <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--muted)" }}>
                {formatTime(duration || elapsed)}
              </span>
            </div>
          </div>

          {/* Short recording warning */}
          {elapsed > 0 && elapsed < 30 && (
            <div
              className="border rounded-[14px] p-3 flex items-center gap-2.5"
              style={{ background: "#FFB83011", borderColor: "#FFB83044" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB830" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div className="text-[12px]" style={{ color: "#FFB830" }}>
                Recording is under 30 seconds. Longer answers get better scores.
              </div>
            </div>
          )}

          {/* Action buttons */}
          <Button
            variant="danger"
            disabled={retriesLeft === 0}
            onClick={handleRetry}
          >
            {retriesLeft === 0
              ? "No retries remaining"
              : `Retry · ${retriesLeft} attempt${retriesLeft !== 1 ? "s" : ""} left`}
          </Button>

          {saveError && (
            <div
              className="border rounded-[14px] p-3 flex items-center gap-2.5"
              style={{ background: "#FF4D6A11", borderColor: "#FF4D6A44" }}
            >
              <span className="text-[16px]">⚠️</span>
              <div className="text-[12px]" style={{ color: "#FF4D6A" }}>{saveError}</div>
            </div>
          )}

          <div className="pb-4">
            <Button disabled={saving} onClick={() => navigate("/analysing")}>
              {saving ? "Saving..." : "Submit →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
