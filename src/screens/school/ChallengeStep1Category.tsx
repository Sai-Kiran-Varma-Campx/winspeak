import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SCHOOL_CATEGORIES } from "@/constants/challenges-school";
import { useSchoolSession } from "@/context/SchoolSessionContext";

const CARD_COLORS = [
  { bg: "#EDE9FE", bd: "#C4B5FD" },
  { bg: "#F3E8FF", bd: "#D8B4FE" },
  { bg: "#E0E7FF", bd: "#A5B4FC" },
  { bg: "#EDE9FE", bd: "#C4B5FD" },
  { bg: "#F3E8FF", bd: "#D8B4FE" },
  { bg: "#E0E7FF", bd: "#A5B4FC" },
  { bg: "#EDE9FE", bd: "#C4B5FD" },
  { bg: "#F3E8FF", bd: "#D8B4FE" },
];

type Selection = typeof SCHOOL_CATEGORIES[number]["id"];

export default function ChallengeStep1Category() {
  const navigate = useNavigate();
  const session = useSchoolSession();
  const [selected, setSelected] = useState<Selection | null>(null);

  function next() {
    if (!selected) return;
    session.setCategory(selected);
    navigate("/school/administer/grade");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 22px 160px" }}>

      {/* Header */}
      <div className="school-reveal school-reveal-1" style={{ paddingTop: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Step 1 of 3
        </div>
        <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 28, fontWeight: 500, color: "#4C1D95", margin: 0, lineHeight: 1.2 }}>
          Pick a Category
        </h1>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#6E5E8A", marginTop: 6 }}>
          Choose a speaking activity for your class.
        </p>
      </div>

      {/* Category cards */}
      <div className="school-reveal school-reveal-2" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
      }}>
        {SCHOOL_CATEGORIES.map((c, i) => {
          const color = CARD_COLORS[i % CARD_COLORS.length];
          const isSelected = selected === c.id;
          const isLast = i === SCHOOL_CATEGORIES.length - 1 && SCHOOL_CATEGORIES.length % 2 === 1;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="school-cat-card"
              style={{
                position: "relative", borderRadius: 22,
                padding: isLast ? "16px 20px" : "18px 16px 20px",
                textAlign: "left",
                cursor: "pointer", fontFamily: "inherit",
                border: `2px solid ${isSelected ? "#7C3AED" : color.bd}`,
                background: color.bg,
                boxShadow: isSelected
                  ? "0 2px 0 rgba(124,58,237,0.15), 0 8px 20px -10px rgba(124,58,237,0.25)"
                  : "0 1px 0 rgba(76,29,149,0.06)",
                color: "#4C1D95",
                minHeight: isLast ? undefined : 140,
                display: "flex",
                flexDirection: isLast ? "row" : "column",
                alignItems: isLast ? "center" : undefined,
                gap: isLast ? 16 : undefined,
                justifyContent: isLast ? undefined : "space-between",
                overflow: "hidden",
                gridColumn: isLast ? "1 / -1" : undefined,
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#7C3AED", display: "grid", placeItems: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "#fff", border: "1.5px solid rgba(124,58,237,0.12)",
                display: "grid", placeItems: "center", fontSize: 24,
                boxShadow: "0 1px 0 rgba(124,58,237,0.06)",
                marginBottom: isLast ? 0 : 12, flexShrink: 0,
              }}>{c.emoji}</div>
              <div style={{ flex: isLast ? 1 : undefined }}>
                <div style={{
                  fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                  fontSize: 16, letterSpacing: "-0.01em", marginBottom: 3,
                }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#6E5E8A", fontWeight: 500, lineHeight: 1.4 }}>
                  {c.description}
                </div>
              </div>
            </button>
          );
        })}

      </div>

      {/* Bottom bar */}
      <div className="school-bottom-bar">
        <div className="school-bottom-bar-inner" style={{ flexDirection: "column", gap: 0 }}>
          <div className="school-progress-track">
            <div className="school-progress-fill" style={{ width: "33%" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <button onClick={() => navigate("/school")} className="school-btn-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <button onClick={next} disabled={!selected} className="school-btn-next">
              Let's pick a question <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
