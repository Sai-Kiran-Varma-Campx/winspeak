import { useRef, useEffect } from "react";

interface OrbCanvasProps {
  progress: number;
}

function drawOrb(canvas: HTMLCanvasElement, pct: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cx = 90, cy = 90, r = 84;
  ctx.clearRect(0, 0, 180, 180);
  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#1E2130";
  ctx.lineWidth = 8;
  ctx.stroke();
  // Fill
  const start = -Math.PI / 2;
  const end = start + (Math.PI * 2 * pct) / 100;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = "#7C5CFC";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.stroke();
}

export default function OrbCanvas({ progress }: OrbCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawOrb(canvasRef.current, progress);
    }
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={180}
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
