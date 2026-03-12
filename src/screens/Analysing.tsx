import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OrbCanvas from "@/components/OrbCanvas";
import { useInterval } from "@/hooks/useInterval";
import { TIPS, ANALYSIS_STEPS, ANALYSIS_STEP_THRESHOLDS } from "@/constants";

export default function Analysing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);

  // Progress ticker
  useInterval(() => {
    setProgress((p) => {
      if (p >= 100) return 100;
      return p + 1;
    });
  }, progress < 100 ? 300 : null);

  // Auto-navigate when done
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => navigate("/report"), 800);
      return () => clearTimeout(t);
    }
  }, [progress, navigate]);

  // Tip rotator
  useInterval(() => {
    setTipVisible(false);
    setTimeout(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
      setTipVisible(true);
    }, 300);
  }, 3000);

  return (
    <div
      className="px-5 pt-10 pb-8 flex flex-col items-center gap-8"
      style={{ minHeight: 700 }}
    >
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
          This will take ~30 seconds
        </div>
      </div>

      {/* Orb */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: 180, height: 180 }}
      >
        <OrbCanvas progress={progress} />
        <div
          className="relative z-10 rounded-full flex flex-col items-center justify-center"
          style={{
            width: 168,
            height: 168,
            background: "var(--bg)",
          }}
        >
          <div className="text-[40px]">🤖</div>
          <div className="font-black text-[20px]" style={{ color: "var(--accent)" }}>
            {progress}%
          </div>
        </div>
      </div>

      {/* Analysis Steps */}
      <div className="w-full flex flex-col gap-2.5">
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
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          minHeight: 70,
        }}
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
