import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StepProgress from "@/components/StepProgress";
import { useInterval } from "@/hooks/useInterval";

const STEPS = [
  { label: "Audio Check", status: "completed" as const },
  { label: "Rules & Question", status: "active" as const },
  { label: "Record", status: "pending" as const },
];

export default function Question() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);

  useInterval(
    () => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + 2;
      });
    },
    !videoComplete ? 100 : null
  );

  useEffect(() => {
    if (progress >= 100 && !videoComplete) {
      setVideoComplete(true);
    }
  }, [progress, videoComplete]);

  function handleRepeat() {
    setProgress(0);
    setVideoComplete(false);
  }

  return (
    <div className="p-5 pb-8 flex flex-col gap-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
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

      <StepProgress steps={STEPS} />

      {/* Video panel */}
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
        <div className="text-[13px] font-semibold">Explaining Rules...</div>
        {/* Progress bar at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: "linear-gradient(90deg,var(--accent),#22D37A)",
            }}
          />
        </div>
      </div>

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

      <button
        onClick={handleRepeat}
        className="border rounded-[12px] p-3 text-[13px] cursor-pointer w-full"
        style={{
          background: "transparent",
          borderColor: "var(--border)",
          color: "var(--muted)",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        🔁 Repeat Question
      </button>

      <Button
        disabled={!videoComplete}
        onClick={() => navigate("/recording")}
      >
        {videoComplete ? "🎙 Start Recording →" : "Watch the full video to continue..."}
      </Button>
    </div>
  );
}
