const ITEMS = [
  // Row 1 (top) — tilted at various angles
  { char: "A", top: "3%", left: "5%", size: 95, color: "#7C3AED", rotate: -12 },
  { char: "3", top: "5%", left: "28%", size: 80, color: "#8B5CF6", rotate: 15 },
  { char: "+", top: "7%", left: "50%", size: 100, color: "#A78BFA", rotate: -8 },
  { char: "B", top: "4%", left: "70%", size: 75, color: "#6D28D9", rotate: 20 },
  { char: "÷", top: "10%", left: "90%", size: 90, color: "#7C3AED", rotate: -18 },

  // Row 2
  { char: "×", top: "20%", left: "12%", size: 85, color: "#A78BFA", rotate: 22 },
  { char: "5", top: "22%", left: "38%", size: 92, color: "#8B5CF6", rotate: -10 },
  { char: "C", top: "18%", left: "62%", size: 75, color: "#7C3AED", rotate: 18 },
  { char: "−", top: "24%", left: "85%", size: 95, color: "#6D28D9", rotate: -5 },

  // Row 3
  { char: "D", top: "38%", left: "6%", size: 88, color: "#8B5CF6", rotate: -20 },
  { char: "+", top: "35%", left: "30%", size: 80, color: "#A78BFA", rotate: 25 },
  { char: "7", top: "40%", left: "55%", size: 95, color: "#7C3AED", rotate: -14 },
  { char: "E", top: "36%", left: "78%", size: 82, color: "#6D28D9", rotate: 10 },
  { char: "×", top: "42%", left: "92%", size: 75, color: "#8B5CF6", rotate: 30 },

  // Row 4
  { char: "÷", top: "55%", left: "18%", size: 85, color: "#7C3AED", rotate: -22 },
  { char: "F", top: "58%", left: "42%", size: 90, color: "#A78BFA", rotate: 15 },
  { char: "2", top: "52%", left: "68%", size: 88, color: "#8B5CF6", rotate: -12 },
  { char: "−", top: "60%", left: "88%", size: 78, color: "#6D28D9", rotate: 18 },

  // Row 5
  { char: "8", top: "72%", left: "10%", size: 92, color: "#A78BFA", rotate: -16 },
  { char: "G", top: "75%", left: "35%", size: 82, color: "#7C3AED", rotate: 24 },
  { char: "+", top: "70%", left: "60%", size: 95, color: "#8B5CF6", rotate: -8 },
  { char: "H", top: "76%", left: "82%", size: 78, color: "#6D28D9", rotate: 20 },

  // Row 6 (bottom)
  { char: "4", top: "88%", left: "8%", size: 85, color: "#7C3AED", rotate: 15 },
  { char: "×", top: "90%", left: "30%", size: 75, color: "#A78BFA", rotate: -20 },
  { char: "I", top: "86%", left: "52%", size: 85, color: "#8B5CF6", rotate: 12 },
  { char: "÷", top: "92%", left: "75%", size: 82, color: "#6D28D9", rotate: -25 },
  { char: "9", top: "88%", left: "92%", size: 78, color: "#7C3AED", rotate: 10 },
];

// 4 rockets: 1 left, 1 right, 2 middle (up + down), different directions
const ROCKETS = [
  { top: "22%", left: "2%", size: 64, delay: 0, rotate: 25 },      // Left side (between A and D)
  { top: "18%", left: "48%", size: 60, delay: 1.2, rotate: -35 },  // Middle-top
  { top: "70%", left: "50%", size: 68, delay: 2.4, rotate: 45 },   // Middle-bottom
  { top: "60%", left: "94%", size: 62, delay: 0.8, rotate: -20 },  // Right side
];

function RocketSvg({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 40 60" fill="none">
      {/* Body */}
      <path d="M20 4 C12 12 10 30 10 40 L30 40 C30 30 28 12 20 4Z" fill="#C4B5FD" stroke="#A78BFA" strokeWidth="1.2" />
      {/* Window */}
      <circle cx="20" cy="22" r="6" fill="#F5F3FF" stroke="#A78BFA" strokeWidth="1" />
      <circle cx="20" cy="22" r="3.5" fill="#DDD6FE" />
      <circle cx="18.5" cy="20.5" r="1.2" fill="#F5F3FF" opacity="0.9" />
      {/* Nose tip */}
      <path d="M20 4 C18 8 17 12 16.5 14 L23.5 14 C23 12 22 8 20 4Z" fill="#A78BFA" />
      {/* Fins */}
      <path d="M10 34 L2 46 L10 42Z" fill="#8B5CF6" />
      <path d="M30 34 L38 46 L30 42Z" fill="#8B5CF6" />
      {/* Bottom */}
      <rect x="12" y="40" width="16" height="3" rx="1" fill="#7C3AED" />
      {/* Flame */}
      <ellipse cx="20" cy="50" rx="5" ry="8" fill="#DDD6FE" opacity="0.7">
        <animate attributeName="ry" values="8;10;6;8" dur="0.4s" repeatCount="indefinite" />
        <animate attributeName="rx" values="5;4;6;5" dur="0.4s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="20" cy="50" rx="3" ry="5" fill="#EDE9FE" opacity="0.8">
        <animate attributeName="ry" values="5;7;4;5" dur="0.35s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

export default function SchoolBgDecorations() {
  return (
    <div className="school-decorations" aria-hidden="true">
      {ITEMS.map((item, i) => (
        <span
          key={`c-${i}`}
          className="school-deco-item"
          style={{
            top: item.top,
            left: item.left,
            fontSize: item.size,
            color: item.color,
            transform: `rotate(${item.rotate}deg)`,
          }}
        >
          {item.char}
        </span>
      ))}

      {ROCKETS.map((r, i) => (
        <span
          key={`r-${i}`}
          className="school-deco-rocket"
          style={{
            top: r.top,
            left: r.left,
            transform: `rotate(${r.rotate}deg)`,
            animationDelay: `${r.delay}s`,
          }}
        >
          <RocketSvg size={r.size} />
        </span>
      ))}
    </div>
  );
}
