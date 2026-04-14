import { scoreToStars } from "@/lib/stars";

interface StarRatingProps {
  score?: number;
  stars?: number;
  size?: number;
}

export default function StarRating({
  score,
  stars: starsProp,
  size = 22,
}: StarRatingProps) {
  const value = starsProp != null ? starsProp : scoreToStars(score ?? 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }} aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = value - i;
        const isFull = filled >= 1;
        const isHalf = !isFull && filled > 0;
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              lineHeight: 1,
              display: "inline-block",
              position: "relative",
              width: size,
              height: size,
              userSelect: "none",
            }}
          >
            {/* Empty star base (always shown) */}
            <span style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: size, lineHeight: 1,
              opacity: 0.25,
              filter: "grayscale(1)",
            }}>⭐</span>

            {/* Filled star */}
            {(isFull || isHalf) && (
              <span style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: size, lineHeight: 1,
                clipPath: isHalf ? "inset(0 50% 0 0)" : undefined,
                filter: "drop-shadow(0 1px 2px rgba(245,166,35,0.4))",
              }}>⭐</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
