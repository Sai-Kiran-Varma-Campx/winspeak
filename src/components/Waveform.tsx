import { useWaveform } from "@/hooks/useWaveform";

interface WaveformProps {
  barCount?: number;
  active?: boolean;
  variant?: "default" | "recording";
}

export default function Waveform({
  barCount = 28,
  active = false,
  variant = "default",
}: WaveformProps) {
  const { bars } = useWaveform(barCount, active);

  const isRecording = variant === "recording";

  return (
    <div
      className="flex items-center justify-center"
      style={{ gap: isRecording ? 2 : 3, height: isRecording ? 60 : 50 }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: isRecording ? 4 : 3,
            height: active ? h : 8,
            borderRadius: 99,
            background: isRecording
              ? "linear-gradient(to top, #FF4D6A, #7C5CFC)"
              : "linear-gradient(to top, var(--accent), #C084FC)",
            opacity: isRecording ? 0.7 : 0.6 + Math.random() * 0.4,
            transition: active ? "height 0.1s ease" : undefined,
          }}
        />
      ))}
    </div>
  );
}
