import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSchoolCategory, type SchoolQuestion } from "@/constants/challenges-school";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import { useStore } from "@/context/UserStoreContext";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";

export default function ChallengeStep2GradeQuestion() {
  const navigate = useNavigate();
  const session = useSchoolSession();
  const store = useStore();

  useEffect(() => {
    if (!session.selectedCategory) navigate("/school/administer", { replace: true });
  }, [session.selectedCategory, navigate]);

  const category = session.selectedCategory ? getSchoolCategory(session.selectedCategory) : null;

  // Only show grades the teacher is assigned to
  const teacherGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const [grade, setGrade] = useState<number | null>(null);
  const [gradeDropOpen, setGradeDropOpen] = useState(false);
  const gradeDropRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<SchoolQuestion | null>(null);

  useEffect(() => {
    if (!gradeDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (gradeDropRef.current && !gradeDropRef.current.contains(e.target as Node)) setGradeDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gradeDropOpen]);

  // Questions fetched from API
  const [questions, setQuestions] = useState<SchoolQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  // Fetch questions when grade is selected (all questions for the category, not filtered by grade)
  useEffect(() => {
    if (!grade || !session.selectedCategory) return;
    setLoadingQ(true);
    setPicked(null);
    api.listSchoolQuestions(session.selectedCategory).then((rows) => {
      setQuestions(rows);
      setLoadingQ(false);
    }).catch(() => setLoadingQ(false));
  }, [grade, session.selectedCategory]);

  function next() {
    if (!picked || !grade) return;
    session.setGradeAndQuestion(grade, picked);
    navigate("/school/administer/run");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 22px 160px" }}>

      {/* Header */}
      <div className="school-reveal school-reveal-1" style={{ paddingTop: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Step 2 of 3
        </div>
        <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 28, fontWeight: 500, color: "#4C1D95", margin: 0, lineHeight: 1.2 }}>
          {category ? `${category.emoji} ${category.title}` : "Pick Grade & Question"}
        </h1>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#6E5E8A", marginTop: 6 }}>
          Select a grade, then pick a question for your students.
        </p>
      </div>

      {/* Grade selection — dropdown */}
      <div className="school-reveal school-reveal-2" style={{ marginBottom: 24, position: "relative", zIndex: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, color: "#6E5E8A",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
        }}>Select Grade</div>
        <div ref={gradeDropRef} style={{ position: "relative", maxWidth: 200 }}>
          <div
            onClick={() => setGradeDropOpen((p) => !p)}
            style={{
              padding: "12px 40px 12px 24px", borderRadius: 30,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 15,
              color: "#fff", cursor: "pointer",
              userSelect: "none",
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            {grade ? `Grade ${grade}` : "Choose grade"}
          </div>
          <svg style={{ position: "absolute", right: 16, top: "50%", transform: gradeDropOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)", transition: "transform 0.2s", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {gradeDropOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid rgba(124,58,237,0.18)",
              borderRadius: 14, padding: 4,
              boxShadow: "0 8px 24px rgba(124,58,237,0.15)",
              zIndex: 50, maxHeight: 260, overflowY: "auto",
            }}>
              {teacherGrades.map((g) => (
                <div
                  key={g}
                  onClick={() => { setGrade(g); setGradeDropOpen(false); }}
                  style={{
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14,
                    color: grade === g ? "#fff" : "#4C1D95",
                    background: grade === g ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (grade !== g) e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                  onMouseLeave={(e) => { if (grade !== g) e.currentTarget.style.background = "transparent"; }}
                >
                  Grade {g}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question list — only show when grade is selected */}
      {grade && (
        <>
          <div className="school-reveal school-reveal-3" style={{
            fontSize: 11, fontWeight: 800, color: "#6E5E8A",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
          }}>Select Question</div>

          {loadingQ ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Spinner size={24} />
            </div>
          ) : questions.length === 0 ? (
            <div style={{
              background: "#fff", border: "1.5px solid rgba(124,58,237,0.12)",
              borderRadius: 22, padding: "40px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, color: "#4C1D95" }}>
                No questions yet
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: "#6E5E8A" }}>
                No questions available for this category.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions.map((q) => {
                const isSelected = picked?.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setPicked(q)}
                    style={{
                      padding: "18px 20px", textAlign: "left", cursor: "pointer",
                      borderRadius: 22,
                      border: `1.5px solid ${isSelected ? "#7C3AED" : "rgba(124,58,237,0.12)"}`,
                      background: isSelected ? "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.05))" : "#fff",
                      boxShadow: isSelected
                        ? "0 2px 0 rgba(124,58,237,0.15), 0 8px 20px -10px rgba(124,58,237,0.2)"
                        : "0 1px 0 rgba(124,58,237,0.05)",
                      transform: isSelected ? "translateY(-1px)" : "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit", color: "#4C1D95",
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#7C3AED" : "rgba(124,58,237,0.2)"}`,
                      background: isSelected ? "#7C3AED" : "#fff",
                      display: "grid", placeItems: "center",
                      flexShrink: 0, marginTop: 2,
                    }}>
                      {isSelected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                        fontSize: 16, letterSpacing: "-0.01em",
                        color: isSelected ? "#7C3AED" : "#4C1D95",
                        display: "block", marginBottom: 4,
                      }}>{q.title}</span>
                      <div style={{
                        fontSize: 13, color: "#6E5E8A",
                        fontWeight: 500, lineHeight: 1.5,
                      }}>{q.prompt}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bottom bar */}
      <div className="school-bottom-bar">
        <div className="school-bottom-bar-inner" style={{ flexDirection: "column", gap: 0 }}>
          <div className="school-progress-track">
            <div className="school-progress-fill" style={{ width: "66%" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <button onClick={() => navigate(-1)} className="school-btn-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <button onClick={next} disabled={!picked} className="school-btn-next">
              Start challenge! <span className="btn-icon">🎤</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
