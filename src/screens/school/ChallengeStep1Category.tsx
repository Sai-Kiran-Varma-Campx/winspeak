import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SCHOOL_CATEGORIES } from "@/constants/challenges-school";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import LaughingSunflower from "@/components/LaughingSunflower";

const CARD_COLORS = [
  { bg: "#FED7AA", bd: "#FDBA74" },
  { bg: "#FCE7F3", bd: "#F9A8D4" },
  { bg: "#CCFBF1", bd: "#5EEAD4" },
  { bg: "#FEF3C7", bd: "#FCD34D" },
  { bg: "#FCE7F3", bd: "#F9A8D4" },
  { bg: "#FED7AA", bd: "#FDBA74" },
  { bg: "#CCFBF1", bd: "#5EEAD4" },
  { bg: "#FEF3C7", bd: "#FCD34D" },
];

type Selection = typeof SCHOOL_CATEGORIES[number]["id"] | "custom";

export default function ChallengeStep1Category() {
  const navigate = useNavigate();
  const session = useSchoolSession();
  const [selected, setSelected] = useState<Selection | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [customScenario, setCustomScenario] = useState("");

  function next() {
    if (selected === "custom") {
      setShowCustom(true);
      return;
    }
    if (!selected) return;
    session.setCategory(selected);
    navigate("/school/administer/grade");
  }

  function submitCustom() {
    if (!customTitle.trim() || !customPrompt.trim()) return;
    session.setCustomChallenge(
      customTitle.trim(),
      customPrompt.trim(),
      customScenario.trim() || "Your teacher has a special challenge for you today!",
    );
    navigate("/school/administer/run");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 22px 160px" }}>

      {/* Header */}
      <div className="school-reveal school-reveal-1" style={{ paddingTop: 28, marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <div style={{
              display: "inline-block", padding: "5px 12px", borderRadius: 999,
              background: "#FED7AA", border: "1.5px solid #FDBA74",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              color: "#EA580C", textTransform: "uppercase",
              marginBottom: 12,
            }}>
              Step 1 of 3
            </div>
            <h1 style={{
              fontFamily: "'Sora', sans-serif", fontWeight: 800,
              fontSize: 28, letterSpacing: "-0.03em", margin: 0, color: "#7C2D12",
            }}>
              Pick a Category
            </h1>
            <p style={{ fontSize: 14, color: "#A8603C", fontWeight: 500, marginTop: 6 }}>
              Choose a speaking activity for your class.
            </p>
          </div>

          {/* Create Your Own — compact button top-right */}
          <button
            onClick={() => { setSelected("custom"); setShowCustom(true); }}
            style={{
              flexShrink: 0, marginTop: 18,
              padding: "10px 16px", borderRadius: 16,
              background: "#FEF3C7",
              border: "2px solid #FCD34D",
              color: "#92400E",
              fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 3px 0 rgba(245,158,11,0.15), 0 6px 14px -6px rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", gap: 7,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: 7,
              background: "#F59E0B", color: "#fff",
              display: "inline-grid", placeItems: "center",
              fontSize: 15, fontWeight: 800, lineHeight: 1,
            }}>+</span>
            Create Challenge
          </button>
        </div>
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
                border: `2px solid ${isSelected ? "#EA580C" : color.bd}`,
                background: color.bg,
                boxShadow: isSelected
                  ? "0 2px 0 rgba(234,88,12,0.15), 0 8px 20px -10px rgba(234,88,12,0.25)"
                  : "0 1px 0 rgba(124,45,18,0.06)",
                color: "#7C2D12",
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
                  background: "#EA580C", display: "grid", placeItems: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: "#fff", border: "1.5px solid rgba(124,45,18,0.12)",
                display: "grid", placeItems: "center", fontSize: 24,
                boxShadow: "0 1px 0 rgba(124,45,18,0.06)",
                marginBottom: isLast ? 0 : 12, flexShrink: 0,
              }}>{c.emoji}</div>
              <div style={{ flex: isLast ? 1 : undefined }}>
                <div style={{
                  fontFamily: "'Sora', sans-serif", fontWeight: 800,
                  fontSize: 16, letterSpacing: "-0.01em", marginBottom: 3,
                }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#A8603C", fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>
                  {c.description}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 700, color: "#7C2D12", opacity: 0.7,
                }}>
                  <span style={{
                    background: "#fff", border: "1px solid rgba(124,45,18,0.1)",
                    padding: "2px 8px", borderRadius: 8,
                  }}>{c.gradeLabel}</span>
                  <span>{c.ageRange}</span>
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
            <button onClick={next} disabled={!selected || selected === "custom"} className="school-btn-next">
              Let's pick a question <span className="btn-icon">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Create Challenge Modal ── */}
      {showCustom && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
            background: "rgba(124, 45, 18, 0.25)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowCustom(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 28, padding: "28px 24px 24px",
              width: "100%", maxWidth: 440,
              boxShadow: "0 6px 0 rgba(124,45,18,0.08), 0 24px 60px -16px rgba(124,45,18,0.3)",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Decorative top bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 5,
              background: "linear-gradient(90deg, #EA580C, #DB2777, #F59E0B, #0D9488)",
              borderRadius: "28px 28px 0 0",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "linear-gradient(135deg, #FED7AA, #FCE7F3)",
                  display: "grid", placeItems: "center", fontSize: 22,
                  border: "1.5px solid #FDBA74",
                }}>✍️</div>
                <div>
                  <div style={{
                    fontFamily: "'Sora', sans-serif", fontWeight: 800,
                    fontSize: 20, color: "#7C2D12", letterSpacing: "-0.02em",
                  }}>Create a Challenge</div>
                  <div style={{ fontSize: 12, color: "#A8603C", fontWeight: 500 }}>
                    Your class will love this!
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCustom(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  border: "1.5px solid rgba(124,45,18,0.1)",
                  background: "#fff", cursor: "pointer",
                  display: "grid", placeItems: "center",
                  color: "#A8603C", fontSize: 16,
                }}
              >×</button>
            </div>

            {/* Sunflower encouragement */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#FEF3C7", border: "1.5px solid #FCD34D",
              borderRadius: 16, padding: "10px 14px", marginBottom: 20,
            }}>
              <LaughingSunflower size={36} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E", lineHeight: 1.4 }}>
                Think of something fun your students would love to talk about!
              </div>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 800,
                  color: "#A8603C", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 6,
                }}>Challenge Title</label>
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. My Dream Superpower"
                  maxLength={80}
                  autoFocus
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 16,
                    border: "2px solid rgba(124,45,18,0.12)",
                    background: "#FFF8F3",
                    fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600,
                    color: "#7C2D12", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#EA580C"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,45,18,0.12)"}
                />
              </div>

              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 800,
                  color: "#A8603C", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 6,
                }}>What should they talk about?</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. If you could have any superpower, what would it be and why? Tell us how you'd use it to help others."
                  maxLength={300}
                  rows={3}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 16,
                    border: "2px solid rgba(124,45,18,0.12)",
                    background: "#FFF8F3",
                    fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 500,
                    color: "#7C2D12", outline: "none", resize: "none",
                    lineHeight: 1.5,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#EA580C"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,45,18,0.12)"}
                />
              </div>

              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 800,
                  color: "#A8603C", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 6,
                }}>Scene / Context <span style={{ fontWeight: 500, opacity: 0.6 }}>(optional)</span></label>
                <input
                  value={customScenario}
                  onChange={(e) => setCustomScenario(e.target.value)}
                  placeholder="e.g. You're presenting to your class during morning assembly."
                  maxLength={200}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 16,
                    border: "2px solid rgba(124,45,18,0.12)",
                    background: "#FFF8F3",
                    fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 500,
                    color: "#7C2D12", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#EA580C"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,45,18,0.12)"}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowCustom(false)}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 16,
                  border: "1.5px solid rgba(124,45,18,0.12)",
                  background: "#fff", color: "#7C2D12",
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitCustom}
                disabled={!customTitle.trim() || !customPrompt.trim()}
                style={{
                  flex: 2, padding: "13px 0", borderRadius: 16,
                  border: "none",
                  background: customTitle.trim() && customPrompt.trim()
                    ? "linear-gradient(135deg, #EA580C, #DB2777)"
                    : "rgba(124,45,18,0.08)",
                  color: customTitle.trim() && customPrompt.trim() ? "#fff" : "#A8603C",
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14,
                  cursor: customTitle.trim() && customPrompt.trim() ? "pointer" : "not-allowed",
                  boxShadow: customTitle.trim() && customPrompt.trim()
                    ? "0 3px 0 #B7350F, 0 8px 20px -6px rgba(219,39,119,0.3)"
                    : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Start Challenge 🎤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
