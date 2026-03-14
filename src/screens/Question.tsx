import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import { synthesizeSpeech } from "@/services/gemini";
import { useInterval } from "@/hooks/useInterval";

const STEPS = [
  { label: "Audio Check", status: "completed" as const },
  { label: "Rules & Question", status: "active" as const },
  { label: "Record", status: "pending" as const },
];

const COACH_SCRIPT =
  "This week's challenge: Persuasion Master. Convince an AI investor to fund your startup idea in 60 seconds. You have 2 retries and can earn 1000 XP. Speak clearly, stay on topic, and make every second count. Tap 'Start Recording' when you're ready. Good luck!";

export default function Question() {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);
  const [loadingTTS, setLoadingTTS] = useState(false);
  const didSpeak = useRef(false);

  // Animate progress bar while TTS is playing
  useInterval(
    () => {
      setProgress((p) => Math.min(p + 1.5, 95));
    },
    isSpeaking ? 300 : null
  );

  // Run TTS on mount (once)
  useEffect(() => {
    if (didSpeak.current) return;
    didSpeak.current = true;

    async function speak() {
      setLoadingTTS(true);
      setIsSpeaking(false);
      try {
        await synthesizeSpeech(COACH_SCRIPT, () => {
          setLoadingTTS(false);
          setIsSpeaking(true);
        });
      } finally {
        setIsSpeaking(false);
        setProgress(100);
        setVideoComplete(true);
        setLoadingTTS(false);
      }
    }

    speak();
  }, []);

  async function handleReplay() {
    if (isSpeaking || loadingTTS) return;
    setProgress(0);
    setVideoComplete(false);
    setLoadingTTS(true);
    try {
      await synthesizeSpeech(COACH_SCRIPT, () => {
        setLoadingTTS(false);
        setIsSpeaking(true);
      });
    } finally {
      setIsSpeaking(false);
      setProgress(100);
      setVideoComplete(true);
      setLoadingTTS(false);
    }
  }

  return (
    <div className="p-5 pb-8">
      {/* Back + title — full width */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/audiocheck")}
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
            STEP 2 OF 3
          </div>
          <div className="text-[18px] font-extrabold">Rules & Question</div>
        </div>
      </div>

      {/* Step progress — full width */}
      <div className="mb-5">
        <StepProgress steps={STEPS} />
      </div>

      {/* 2-col on desktop: video | question+repeat+submit */}
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* LEFT: Video / TTS panel */}
        <div>
          <div
            className="border rounded-[22px] flex flex-col items-center justify-center gap-2.5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#1A1D2E,#0F1018)",
              borderColor: "var(--border)",
              aspectRatio: "16/9",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at 40% 50%, #22D37A22, transparent 60%)",
              }}
            />
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[28px]"
              style={{ background: "linear-gradient(135deg,#22D37A,#7C5CFC)" }}
            >
              🤖
            </div>
            <div className="text-[13px] font-semibold flex items-center gap-2">
              {loadingTTS ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-t-transparent inline-block flex-shrink-0"
                    style={{ borderColor: "#22D37A", animation: "spin 0.8s linear infinite" }}
                  />
                  Fetching voice...
                </>
              ) : isSpeaking ? (
                <>
                  <span className="flex items-end gap-0.5 flex-shrink-0">
                    {[3, 5, 4, 6, 3].map((h, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full block"
                        style={{
                          height: h * 3,
                          background: "#22D37A",
                          animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </span>
                  Coach speaking...
                </>
              ) : videoComplete ? (
                "Instructions complete ✓"
              ) : (
                "Preparing..."
              )}
            </div>
            {/* Progress bar at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg,var(--accent),#22D37A)",
                }}
              />
            </div>
          </div>

          {/* Replay button */}
          <button
            onClick={handleReplay}
            disabled={isSpeaking || loadingTTS}
            className="border rounded-[12px] p-3 text-[13px] cursor-pointer w-full mt-3 disabled:opacity-40"
            style={{
              background: "transparent",
              borderColor: "var(--border)",
              color: "var(--muted)",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            🔊 Replay Instructions
          </button>
        </div>

        {/* RIGHT: Question card + submit */}
        <div className="flex flex-col gap-5">
          {/* Question card */}
          <div
            className="border rounded-[20px] p-5"
            style={{ background: "var(--card)", borderColor: "#7C5CFC44" }}
          >
            <div
              className="text-[11px] font-semibold tracking-[1px] mb-2"
              style={{ color: "var(--muted)" }}
            >
              THIS WEEK'S CHALLENGE
            </div>
            <div className="text-[17px] font-extrabold mb-2.5 leading-snug">
              Persuasion Master 🎯
            </div>
            <div
              className="rounded-[14px] p-3.5 pl-4"
              style={{
                background: "var(--surface)",
                borderLeft: "3px solid var(--accent)",
              }}
            >
              <div
                className="text-[11px] mb-1.5 font-semibold"
                style={{ color: "var(--muted)" }}
              >
                QUESTION
              </div>
              <div className="text-[14px] leading-relaxed">
                "Convince an AI investor to fund your startup idea in 60 seconds. Present your
                pitch with confidence and clarity."
              </div>
            </div>
            <div className="flex gap-2.5 mt-3.5">
              {[
                { value: "60s", label: "Max Time", color: "var(--accent)" },
                { value: "2", label: "Retries Left", color: "#22D37A" },
                { value: "1000", label: "XP Reward", color: "#FFB830" },
              ].map(({ value, label, color }) => (
                <div
                  key={label}
                  className="flex-1 rounded-[10px] p-2.5 text-center"
                  style={{ background: "var(--surface)" }}
                >
                  <div className="text-[18px] font-extrabold" style={{ color }}>
                    {value}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            disabled={!videoComplete}
            onClick={() => navigate("/recording")}
          >
            {videoComplete
              ? "🎙 Start Recording →"
              : loadingTTS
              ? "Loading coach voice..."
              : "Listen to instructions first..."}
          </Button>
        </div>
      </div>
    </div>
  );
}
