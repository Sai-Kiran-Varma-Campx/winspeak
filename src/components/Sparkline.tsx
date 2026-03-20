interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function Sparkline({
  data,
  color = "#7C5CFC",
  width = 80,
  height = 28,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = height * 0.12;

  const xs = data.map((_, i) => (i / (data.length - 1)) * width);
  const ys = data.map(
    (v) => height - pad - ((v - min) / range) * (height - pad * 2)
  );

  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  // Fill area under line
  const fillPoints =
    `0,${height} ` +
    xs.map((x, i) => `${x},${ys[i]}`).join(" ") +
    ` ${width},${height}`;

  const trend = data[data.length - 1] - data[0];
  const trendColor = trend > 0 ? "#22D37A" : trend < 0 ? "#FF4D6A" : color;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible", display: "block" }}
    >
      {/* Fill area */}
      <polygon points={fillPoints} fill={trendColor} fillOpacity={0.08} />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={trendColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={xs[xs.length - 1]}
        cy={ys[ys.length - 1]}
        r={3}
        fill={trendColor}
      />
    </svg>
  );
}
