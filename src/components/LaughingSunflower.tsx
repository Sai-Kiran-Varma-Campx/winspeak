export default function LaughingSunflower({ size = 90 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      style={{ animation: "sunflowerWiggle 2.5s ease-in-out infinite" }}
    >
      {/* Petals */}
      <g transform="translate(60,60)">
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={i}
            rx="12"
            ry="22"
            fill={i % 2 === 0 ? "#FCD34D" : "#FBBF24"}
            transform={`rotate(${i * 30}) translate(0,-28)`}
          />
        ))}
      </g>
      {/* Face */}
      <circle cx="60" cy="60" r="22" fill="#92400E" />
      <circle cx="60" cy="60" r="19" fill="#A8603C" />
      {/* Happy squint eyes */}
      <path d="M50 56 Q53 52 56 56" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M64 56 Q67 52 70 56" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Big smile */}
      <path d="M50 64 Q60 74 70 64" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Rosy cheeks */}
      <circle cx="48" cy="63" r="3.5" fill="#EA580C" opacity="0.35" />
      <circle cx="72" cy="63" r="3.5" fill="#EA580C" opacity="0.35" />
    </svg>
  );
}
