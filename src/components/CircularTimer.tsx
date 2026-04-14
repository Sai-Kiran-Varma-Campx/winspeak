import { CIRCULAR_TIMER_RADIUS, CIRCULAR_TIMER_CIRCUMFERENCE, RECORDING_DURATION_SECS } from "@/constants";

interface CircularTimerProps {
  seconds: number;
  isRecording: boolean;
}

export default function CircularTimer({ seconds, isRecording }: CircularTimerProps) {
  const elapsed = RECORDING_DURATION_SECS - seconds;
  const pct = elapsed / RECORDING_DURATION_SECS;
  const offset = CIRCULAR_TIMER_CIRCUMFERENCE * (1 - pct);
  const isRed = seconds <= 20;
  const strokeColor = isRed ? "#CC6B7E" : "var(--accent)";
  const textColor = isRed ? "#CC6B7E" : "var(--text)";

  return (
    <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px]">
      <svg
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        viewBox="0 0 200 200"
        className="w-full h-full"
      >
        <circle
          cx="100"
          cy="100"
          r={CIRCULAR_TIMER_RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
        />
        <circle
          cx="100"
          cy="100"
          r={CIRCULAR_TIMER_RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="8"
          strokeDasharray={CIRCULAR_TIMER_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.3s",
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span
          className="text-[38px] sm:text-[48px] font-black leading-none"
          style={{ color: textColor }}
        >
          {String(seconds).padStart(2, "0")}
        </span>
        <span className="text-[12px] mt-1" style={{ color: "var(--muted)" }}>
          seconds
        </span>
        {isRecording && (
          <div className="flex items-center gap-1.5 mt-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "#CC6B7E" }}
            />
            <span className="text-[11px] font-bold" style={{ color: "#CC6B7E" }}>
              RECORDING
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
