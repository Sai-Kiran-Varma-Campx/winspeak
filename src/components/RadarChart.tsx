const LABELS = ["Fluency", "Grammar", "Vocabulary", "Clarity", "Structure", "Relevancy"];
const N = LABELS.length;

function polarToXY(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface RadarChartProps {
  skills: Record<string, number>;
  size?: number;
}

export default function RadarChart({ skills, size = 220 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.68;
  const labelR = maxR + 20;

  // Angles: start at top (-90°), evenly spaced
  const angles = LABELS.map((_, i) => -90 + (360 / N) * i);

  // Grid rings at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const gridPolygons = gridLevels.map((level) =>
    angles.map((a) => {
      const p = polarToXY(a, maxR * level, cx, cy);
      return `${p.x},${p.y}`;
    }).join(" ")
  );

  // Score polygon
  const scorePoints = LABELS.map((label, i) => {
    const val = Math.min((skills[label] ?? 0) / 100, 1);
    const p = polarToXY(angles[i], maxR * val, cx, cy);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Score dots
  const dots = LABELS.map((label, i) => {
    const val = Math.min((skills[label] ?? 0) / 100, 1);
    const score = skills[label] ?? 0;
    const color = score >= 80 ? "#22D37A" : score >= 60 ? "#FFB830" : "#FF4D6A";
    return { ...polarToXY(angles[i], maxR * val, cx, cy), color };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible" }}
    >
      {/* Grid polygons */}
      {gridPolygons.map((pts, li) => (
        <polygon
          key={li}
          points={pts}
          fill="none"
          stroke="var(--border)"
          strokeWidth={li === gridPolygons.length - 1 ? 1.5 : 1}
        />
      ))}

      {/* Axis lines */}
      {angles.map((a, i) => {
        const end = polarToXY(a, maxR, cx, cy);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="var(--border)"
            strokeWidth="1"
          />
        );
      })}

      {/* Score filled polygon */}
      <polygon
        points={scorePoints}
        fill="#7C5CFC"
        fillOpacity={0.18}
        stroke="#7C5CFC"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Score dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={4.5} fill={d.color} />
      ))}

      {/* Labels */}
      {LABELS.map((label, i) => {
        const lp = polarToXY(angles[i], labelR, cx, cy);
        // Align text based on position
        const anchor =
          lp.x < cx - 5 ? "end" : lp.x > cx + 5 ? "start" : "middle";
        return (
          <text
            key={label}
            x={lp.x}
            y={lp.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={9.5}
            fontWeight={600}
            fill="var(--muted)"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
