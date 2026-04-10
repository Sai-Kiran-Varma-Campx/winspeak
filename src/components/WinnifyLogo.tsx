/**
 * Winnify Jr. brand logo — uses the actual Winnify logo image + "Jr." badge.
 */
export default function WinnifyLogo({
  height = 32,
}: {
  height?: number;
}) {
  const jrSize = Math.max(12, height * 0.4);

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
    }}>
      <img
        src="/winnify-logo.png"
        alt="Winnify"
        style={{
          height,
          width: "auto",
          objectFit: "contain",
          display: "block",
        }}
      />
      <span style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: jrSize,
        fontWeight: 900,
        color: "#F59E0B",
        background: "#6B5DAD",
        padding: `${jrSize * 0.3}px ${jrSize * 0.5}px`,
        borderRadius: jrSize * 0.35,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        boxShadow: "0 2px 0 rgba(107,93,173,0.3)",
        textShadow: "1px 1px 0 rgba(194,65,12,0.5)",
        display: "inline-flex",
        alignItems: "center",
      }}>
        Jr.
      </span>
    </div>
  );
}
