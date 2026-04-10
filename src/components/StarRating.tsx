import { scoreToStars } from "@/lib/stars";

interface StarRatingProps {
  /** Either pass `score` (0-100) — converted via scoreToStars — or `stars` (0-5) directly. */
  score?: number;
  stars?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

/**
 * Renders 5 stars with full + half-star support.
 * No numeric value displayed. Used everywhere in school mode.
 */
export default function StarRating({
  score,
  stars: starsProp,
  size = 22,
  color = "#F8B84E",
  emptyColor = "#E6ECF7",
}: StarRatingProps) {
  const value = starsProp != null ? starsProp : scoreToStars(score ?? 0);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = value - i;
        return (
          <Star key={i} size={size} fillRatio={filled} color={color} emptyColor={emptyColor} />
        );
      })}
    </div>
  );
}

function Star({ size, fillRatio, color, emptyColor }: { size: number; fillRatio: number; color: string; emptyColor: string }) {
  // fillRatio: <=0 empty, >=1 full, 0-1 partial
  const clamped = Math.max(0, Math.min(1, fillRatio));
  const id = `star-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={`${clamped * 100}%`} stopColor={color} />
          <stop offset={`${clamped * 100}%`} stopColor={emptyColor} />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.08 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z"
        fill={`url(#${id})`}
        stroke={color}
        strokeWidth="0.6"
      />
    </svg>
  );
}
