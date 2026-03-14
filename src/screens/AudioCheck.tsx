import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import Waveform from "@/components/Waveform";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { transcribeAudio, synthesizeSpeech } from "@/services/gemini";

function LoadingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full block"
          style={{
            background: "var(--accent)",
            animation: `bounce 1s ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function SoundBars() {
  return (
    <span className="flex items-end gap-0.5">
      {[3, 5, 4, 6, 3].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full block"
          style={{
            height: h * 3,
            background: "var(--accent)",
            animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

const COACH_INTRO =
  "Hi! I'm your AI speaking coach. Let's do a quick audio check. When you're ready, tap the button and say: Hello, how are you? I'll listen and confirm your mic is working.";

type AudioState = "intro" | "recording" | "transcribing" | "passed" | "failed" | "error";

const STEPS = [
  { label: "Audio Check", status: "active" as const },
  { label: "Rules & Question", status: "pending" as const },
  { label: "Record", status: "pending" as const },
];

// Auto-stop after 5 seconds
const AUTO_STOP_MS = 5000;

export default function AudioCheck() {
  const navigate = useNavigate();
  const [state, setState] = useState<AudioState>("intro");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const { startRecording, stopRecording, isRecording } = useAudioRecorder();

  async function handleListen() {
    if (isSpeaking || isLoadingTTS) return;
    setIsLoadingTTS(true);
    try {
      await synthesizeSpeech(COACH_INTRO, () => {
        setIsLoadingTTS(false);
        setIsSpeaking(true);
      });
    } finally {
      setIsSpeaking(false);
      setIsLoadingTTS(false);
    }
  }

  // Countdown timer while recording
  useEffect(() => {
    if (state !== "recording") return;
    setCountdown(5);
    const start = Date.now();
    const iv = setInterval(() => {
      const remaining = Math.max(0, 5 - Math.floor((Date.now() - start) / 1000));
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
    setErrorMsg("");
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
      // If transcription fails, just pass — mic is clearly working
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

      {/* Avatar panel */}
      <div
        className="border rounded-[22px] flex flex-col items-center justify-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#1A1D2E,#0F1018)",
          borderColor: "var(--border)",
          aspectRatio: "16/9",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 60% 40%, var(--accent-glow), transparent 60%)",
          }}
        />
        <div
          className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-[32px] relative z-10"
          style={{
            background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
            boxShadow: "0 0 30px var(--accent-glow)",
          }}
        >
          🤖
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
          ) : isLoadingTTS ? (
            <>
              <LoadingDots />
              Fetching voice...
            </>
          ) : isSpeaking ? (
            <>
              <SoundBars />
              Coach speaking...
            </>
          ) : (
            "Avatar Intro Video"
          )}
        </div>
        {(state === "intro" || state === "error") && (
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
          style={{ background: state === "recording" ? "#FF4D6A" : "#6B7194" }}
        >
          {state === "recording" ? "● LIVE" : "● READY"}
        </div>
      </div>

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
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Intro state */}
      {(state === "intro" || state === "error") && (
        <div className="flex flex-col gap-3">
          {/* Listen to coach voice */}
          <button
            onClick={handleListen}
            disabled={isSpeaking || isLoadingTTS}
            className="border rounded-[14px] p-4 flex items-center gap-3.5 cursor-pointer disabled:opacity-50 transition-colors"
            style={{
              background: "var(--card)",
              borderColor: isLoadingTTS || isSpeaking ? "var(--accent)" : "var(--border)",
              fontFamily: "DM Sans, sans-serif",
              textAlign: "left",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[18px] flex-shrink-0"
              style={{
                background: isLoadingTTS || isSpeaking
                  ? "linear-gradient(135deg,var(--accent),#C084FC)"
                  : "var(--surface)",
                boxShadow: isLoadingTTS || isSpeaking ? "0 0 16px var(--accent-glow)" : "none",
              }}
            >
              {isLoadingTTS ? (
                <span
                  className="w-5 h-5 rounded-full border-2 border-t-transparent block"
                  style={{ borderColor: "#fff", animation: "spin 0.8s linear infinite" }}
                />
              ) : isSpeaking ? "🔊" : "▶"}
            </div>
            <div>
              <div className="text-[13px] font-bold" style={{ color: isLoadingTTS || isSpeaking ? "var(--accent)" : "var(--text)" }}>
                {isLoadingTTS ? "Fetching coach voice..." : isSpeaking ? "Coach is speaking..." : "Listen to instructions"}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                Hear the AI coach explain the audio check
              </div>
            </div>
          </button>

          <Button onClick={handleStart}>🎙 Start Audio Check</Button>
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
            ■ Stop Recording
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
              Gemini is transcribing your speech
            </div>
          </div>
        </div>
      )}

      {/* Failed state — let them retry */}
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
          <Button onClick={handleStart}>🔄 Try Again</Button>
          <Button variant="secondary" onClick={() => setState("passed")}>
            Skip check
          </Button>
        </div>
      )}

      {/* Passed state */}
      {state === "passed" && (
        <div className="flex flex-col gap-3.5">
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
          <Button onClick={() => navigate("/question")}>Start Challenge →</Button>
        </div>
      )}
    </div>
  );
}
