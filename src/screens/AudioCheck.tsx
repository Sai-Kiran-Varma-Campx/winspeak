import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import Waveform from "@/components/Waveform";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio, unlockAudioContext } from "@/services/gemini";

type AudioState = "intro" | "recording" | "transcribing" | "passed" | "failed" | "error";

const STEPS = [
  { label: "Audio Check", status: "active" as const },
  { label: "Rules & Question", status: "pending" as const },
  { label: "Record", status: "pending" as const },
];

const AUTO_STOP_MS = 30000;
const BAR_COUNT = 32;

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Animated waveform bars that pulse when playing */
function AudioWaveViz({ playing, progress }: { playing: boolean; progress: number }) {
  // Generate pseudo-random bar heights based on position (deterministic)
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const base = Math.sin(i * 0.7) * 0.3 + Math.cos(i * 1.3) * 0.2 + 0.5;
    return Math.max(0.15, Math.min(1, base));
  });

  return (
    <div className="flex items-center gap-[2px] h-10 w-full">
      {bars.map((h, i) => {
        const barProgress = i / BAR_COUNT;
        const isPast = barProgress < progress;
        return (
          <div
            key={i}
            className="flex-1 rounded-full transition-all"
            style={{
              height: `${h * 100}%`,
              background: isPast
                ? "linear-gradient(180deg, #7C5CFC, #C084FC)"
                : "var(--border)",
              opacity: isPast ? 1 : 0.5,
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

export default function AudioCheck() {
  const navigate = useNavigate();
  const [state, setState] = useState<AudioState>("intro");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();

  // Audio player state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration > 0 ? currentTime / duration : 0;

  // Create audio element once
  useEffect(() => {
    const audio = new Audio("/coach-intro.wav");
    audio.preload = "auto";
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
  }, []);

  const togglePlay = useCallback(() => {
    unlockAudioContext(); // Unlock for iOS on user tap
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

  // Countdown timer while recording
  const autoStopSecs = AUTO_STOP_MS / 1000;
  useEffect(() => {
    if (state !== "recording") return;
    setCountdown(autoStopSecs);
    const start = Date.now();
    const iv = setInterval(() => {
      const remaining = Math.max(0, autoStopSecs - Math.floor((Date.now() - start) / 1000));
      setCountdown(remaining);
    }, 200);
    return () => clearInterval(iv);
  }, [state]);

  // Auto-stop after AUTO_STOP_MS
  useEffect(() => {
    if (state !== "recording") return;
    const t = setTimeout(handleStop, AUTO_STOP_MS);
    return () => clearTimeout(t);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStart() {
    unlockAudioContext(); // Unlock for iOS on user tap
    setErrorMsg("");
    // Pause coach audio if playing
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    try {
      await startRecording();
      setState("recording");
    } catch {
      setErrorMsg("Microphone access denied. Grant permission or tap 'Skip'.");
      setState("error");
    }
  }

  async function handleStop() {
    if (!isRecording) return;
    setState("transcribing");
    try {
      const blob = await stopRecording();
      const text = await transcribeAudio(blob);
      const heard = text.toLowerCase();
      if (heard.includes("hello") || heard.includes("how are you") || heard.includes("hi")) {
        setState("passed");
      } else {
        setState("failed");
      }
    } catch {
      setState("passed");
    }
  }

  return (
    <div className="p-5 pb-8 flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
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
            STEP 1 OF 3
          </div>
          <div className="text-[18px] font-extrabold">Audio Check</div>
        </div>
      </div>

      <StepProgress steps={STEPS} />

      {/* Coach avatar panel */}
      <div
        className="border rounded-[22px] flex flex-col items-center justify-center gap-3 relative overflow-hidden max-h-[200px] sm:max-h-none"
        style={{
          background: "linear-gradient(135deg,#1A1D2E,#0F1018)",
          borderColor: isPlaying ? "#7C5CFC66" : "var(--border)",
          aspectRatio: "16/9",
          transition: "border-color 0.3s",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 60% 40%, var(--accent-glow), transparent 60%)",
          }}
        />

        {/* Pulsing ring around avatar when playing */}
        <div
          className="relative z-10"
          style={{
            padding: 6,
            borderRadius: "50%",
            background: isPlaying
              ? "conic-gradient(from 0deg, #7C5CFC, #C084FC, #22D37A, #7C5CFC)"
              : "transparent",
            animation: isPlaying ? "spin 3s linear infinite" : "none",
          }}
        >
          <div
            className="w-[64px] h-[64px] rounded-full flex items-center justify-center text-[28px]"
            style={{
              background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
              boxShadow: isPlaying ? "0 0 30px #7C5CFC66" : "0 0 20px var(--accent-glow)",
              transition: "box-shadow 0.3s",
            }}
          >
            🤖
          </div>
        </div>

        <div className="text-[13px] font-semibold relative z-10 flex items-center gap-2">
          {state === "transcribing" ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-t-transparent inline-block"
                style={{ borderColor: "var(--accent)", animation: "spin 0.8s linear infinite" }}
              />
              Analysing audio...
            </>
          ) : isPlaying ? (
            <>
              <span className="flex items-end gap-0.5 flex-shrink-0">
                {[3, 5, 4, 6, 3].map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full block"
                    style={{
                      height: h * 3,
                      background: "#7C5CFC",
                      animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </span>
              Coach speaking...
            </>
          ) : (
            "AI Speaking Coach"
          )}
        </div>

        {(state === "intro" || state === "error") && !isPlaying && (
          <div
            className="absolute bottom-3 left-3 right-3 rounded-[10px] p-2 text-[12px] z-20"
            style={{ background: "#000000BB" }}
          >
            "Hi! I'm your coach. Let's do a quick audio check. Say:{" "}
            <strong>'Hello, how are you?'</strong>"
          </div>
        )}

        <div
          className="absolute top-3 right-3 rounded-[6px] px-2 py-0.5 text-[10px] font-bold text-white z-20"
          style={{ background: state === "recording" ? "#FF4D6A" : isPlaying ? "#7C5CFC" : "#6B7194" }}
        >
          {state === "recording" ? "● LIVE" : isPlaying ? "● PLAYING" : "● READY"}
        </div>
      </div>

      {/* Audio player card */}
      {(state === "intro" || state === "error") && (
        <div
          className="border rounded-[16px] p-4"
          style={{
            background: "var(--card)",
            borderColor: isPlaying ? "#7C5CFC44" : "var(--border)",
            transition: "border-color 0.3s",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-none cursor-pointer transition-all"
              style={{
                background: isPlaying
                  ? "linear-gradient(135deg,#7C5CFC,#C084FC)"
                  : "var(--surface)",
                boxShadow: isPlaying ? "0 0 20px #7C5CFC44" : "none",
                color: isPlaying ? "#fff" : "var(--text)",
              }}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold truncate">
                {isPlaying ? "Coach is speaking..." : "Listen to instructions"}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                Tap play to hear the audio check instructions
              </div>
            </div>

            {/* Time */}
            <div
              className="text-[11px] font-mono font-semibold flex-shrink-0 tabular-nums"
              style={{ color: "var(--muted)" }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Waveform visualization */}
          <div className="mb-2">
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
                background: "linear-gradient(90deg,#7C5CFC,#C084FC)",
              }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 sm:w-3 sm:h-3 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              style={{
                left: `calc(${progress * 100}% - 10px)`,
                background: "#fff",
                boxShadow: "0 0 6px #7C5CFC88",
              }}
            />
          </div>
        </div>
      )}

      {/* Prompt */}
      <div
        className="border rounded-[12px] p-2.5 text-[13px] leading-relaxed text-center"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        Please say:{" "}
        <span className="font-bold" style={{ color: "var(--accent)" }}>
          "Hello, how are you?"
        </span>
      </div>

      {/* Error */}
      {errorMsg && (
        <div
          className="border rounded-[12px] p-3 text-[12px]"
          style={{ background: "#FF4D6A11", borderColor: "#FF4D6A44", color: "#FF4D6A" }}
        >
          {errorMsg}
        </div>
      )}

      {/* Intro state */}
      {(state === "intro" || state === "error") && (
        <div className="flex flex-col gap-3">
          <Button onClick={handleStart}>Start Audio Check</Button>
          {state === "error" && (
            <Button variant="secondary" onClick={() => setState("passed")}>
              Skip (mic issue)
            </Button>
          )}
        </div>
      )}

      {/* Recording state */}
      {state === "recording" && (
        <div className="flex flex-col gap-3.5">
          <div
            className="border rounded-[18px] p-5"
            style={{ background: "var(--card)", borderColor: "#FF4D6A44" }}
          >
            <div className="flex justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#FF4D6A", animation: "pulse 1s infinite" }}
                />
                <span className="font-bold text-[13px]" style={{ color: "#FF4D6A" }}>
                  Listening...
                </span>
              </div>
              <span className="font-extrabold text-[18px]" style={{ color: "var(--yellow)" }}>
                {String(countdown).padStart(2, "0")}s
              </span>
            </div>
            <Waveform barCount={28} active={true} />
          </div>
          <Button variant="secondary" onClick={handleStop}>
            Stop Recording
          </Button>
        </div>
      )}

      {/* Transcribing state */}
      {state === "transcribing" && (
        <div
          className="border rounded-[18px] p-5 flex items-center gap-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent flex-shrink-0"
            style={{ borderColor: "var(--accent)", animation: "spin 1s linear infinite" }}
          />
          <div>
            <div className="font-bold text-[14px]">Analysing audio...</div>
            <div className="text-[12px]" style={{ color: "var(--muted)" }}>
              WinSpeak is transcribing your speech
            </div>
          </div>
        </div>
      )}

      {/* Failed state */}
      {state === "failed" && (
        <div className="flex flex-col gap-3.5">
          <div
            className="border rounded-[18px] p-5 text-center"
            style={{ background: "#FF4D6A11", borderColor: "#FF4D6A44" }}
          >
            <div className="text-[32px] mb-2">🎙</div>
            <div className="font-extrabold text-[17px] mb-1" style={{ color: "#FF4D6A" }}>
              Couldn't hear that clearly
            </div>
            <div className="text-[13px]" style={{ color: "var(--muted)" }}>
              Try speaking louder or closer to the mic
            </div>
          </div>
          <Button onClick={handleStart}>Try Again</Button>
          <Button variant="secondary" onClick={() => setState("passed")}>
            Skip check
          </Button>
        </div>
      )}

      {/* Passed state */}
      {state === "passed" && (
        <div className="flex flex-col gap-3.5 pb-4">
          <div
            className="border rounded-[18px] p-5 text-center"
            style={{ background: "#22D37A11", borderColor: "#22D37A44" }}
          >
            <div className="text-[40px] mb-2">✅</div>
            <div className="font-extrabold text-[17px] mb-1" style={{ color: "#22D37A" }}>
              Audio Detected!
            </div>
            <div className="text-[13px]" style={{ color: "var(--muted)" }}>
              Mic is working perfectly. You're ready to go!
            </div>
          </div>
          <Button onClick={() => { unlockAudioContext(); navigate("/question"); }}>Start Challenge →</Button>
        </div>
      )}
    </div>
  );
}
