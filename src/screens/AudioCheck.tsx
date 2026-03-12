import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import Waveform from "@/components/Waveform";
import { useCountdown } from "@/hooks/useCountdown";
import { useInterval } from "@/hooks/useInterval";

type AudioState = "intro" | "recording" | "passed";

const STEPS = [
  { label: "Audio Check", status: "active" as const },
  { label: "Rules & Question", status: "pending" as const },
  { label: "Record", status: "pending" as const },
];

export default function AudioCheck() {
  const navigate = useNavigate();
  const [state, setState] = useState<AudioState>("intro");
  const [volume, setVolume] = useState(60);
  const { seconds, start, reset } = useCountdown(30);

  // Auto-pass when countdown hits 0
  useEffect(() => {
    if (state === "recording" && seconds === 0) {
      setState("passed");
    }
  }, [seconds, state]);

  // Volume animation while recording
  useInterval(
    () => setVolume(Math.floor(Math.random() * 80 + 20)),
    state === "recording" ? 1000 : null
  );

  function handleStart() {
    setState("recording");
    reset(30);
    start();
  }

  return (
    <div className="p-5 pb-8 flex flex-col gap-5">
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
        <div className="text-[13px] font-semibold relative z-10">Avatar Intro Video</div>
        {state === "intro" && (
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
          style={{ background: "#FF4D6A" }}
        >
          ● LIVE
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

      {/* Intro state */}
      {state === "intro" && (
        <Button onClick={handleStart}>🎙 Start Audio Check</Button>
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
                  style={{
                    background: "#FF4D6A",
                    animation: "pulse 1s infinite",
                  }}
                />
                <span className="font-bold text-[13px]" style={{ color: "#FF4D6A" }}>
                  Recording
                </span>
              </div>
              <span className="font-extrabold text-[18px]" style={{ color: "var(--yellow)" }}>
                {String(seconds).padStart(2, "0")}s
              </span>
            </div>
            <Waveform barCount={28} active={true} />
            <div
              className="h-1.5 rounded-full overflow-hidden mt-2.5"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${volume}%`,
                  background: "linear-gradient(90deg,#FF4D6A,#FF4D6Acc)",
                  boxShadow: "0 0 8px #FF4D6A88",
                }}
              />
            </div>
            <div
              className="text-[11px] text-center mt-1.5"
              style={{ color: "var(--muted)" }}
            >
              Audio level: {volume}%
            </div>
          </div>
          <Button variant="secondary" onClick={() => setState("passed")}>
            ■ Stop Recording
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
