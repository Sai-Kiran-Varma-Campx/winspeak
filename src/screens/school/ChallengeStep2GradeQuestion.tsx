import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSchoolCategory,
  getSchoolQuestionsByCategoryAndGrade,
  type SchoolQuestion,
} from "@/constants/challenges-school";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import { useStore } from "@/context/UserStoreContext";

export default function ChallengeStep2GradeQuestion() {
  const navigate = useNavigate();
  const session = useSchoolSession();
  const store = useStore();

  useEffect(() => {
    if (!session.selectedCategory) navigate("/school/administer", { replace: true });
  }, [session.selectedCategory, navigate]);

  const category = session.selectedCategory ? getSchoolCategory(session.selectedCategory) : null;

  // Only show grades the teacher is assigned to
  const teacherGrades = store.grades.length > 0 ? store.grades : [1, 2, 3, 4];
  const [grade, setGrade] = useState<number | null>(null);
  const [picked, setPicked] = useState<SchoolQuestion | null>(null);

  const questions = session.selectedCategory && grade
    ? getSchoolQuestionsByCategoryAndGrade(session.selectedCategory, grade)
    : [];

  // Reset question when grade changes
  useEffect(() => { setPicked(null); }, [grade]);

  function next() {
    if (!picked || !grade) return;
    session.setGradeAndQuestion(grade, picked);
    navigate("/school/administer/run");
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 22px 160px" }}>

      {/* Header */}
      <div className="school-reveal school-reveal-1" style={{ paddingTop: 28, marginBottom: 24 }}>
        <div style={{
          display: "inline-block", padding: "5px 12px", borderRadius: 999,
          background: "#FED7AA", border: "1.5px solid #FDBA74",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
          color: "#EA580C", textTransform: "uppercase",
          marginBottom: 12,
        }}>
          Step 2 of 3
        </div>
        <h1 style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 800,
          fontSize: 28, letterSpacing: "-0.03em", margin: 0, color: "#7C2D12",
        }}>
          {category ? `${category.emoji} ${category.title}` : "Pick Grade & Question"}
        </h1>
        <p style={{ fontSize: 14, color: "#A8603C", fontWeight: 500, marginTop: 6 }}>
          Select a grade, then pick a question for your students.
        </p>
      </div>

      {/* Grade selection */}
      <div className="school-reveal school-reveal-2" style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: "#A8603C",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
        }}>Select Grade</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {teacherGrades.map((g) => {
            const isActive = grade === g;
            return (
              <button
                key={g}
                onClick={() => setGrade(g)}
                style={{
                  flex: 1, minWidth: 70, padding: "14px 12px",
                  borderRadius: 18,
                  border: `2px solid ${isActive ? "#EA580C" : "rgba(124,45,18,0.12)"}`,
                  background: isActive ? "linear-gradient(135deg, #EA580C, #DB2777)" : "#fff",
                  color: isActive ? "#fff" : "#7C2D12",
                  fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 18,
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 4px 0 #B7350F, 0 8px 20px -6px rgba(219,39,119,0.3)"
                    : "0 2px 0 rgba(124,45,18,0.05)",
                  transform: isActive ? "translateY(-2px)" : "none",
                  transition: "all 0.2s cubic-bezier(.34,1.56,.64,1)",
                  textAlign: "center",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question list — only show when grade is selected */}
      {grade && (
        <>
          <div className="school-reveal school-reveal-3" style={{
            fontSize: 11, fontWeight: 800, color: "#A8603C",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
          }}>Select Question</div>

          {questions.length === 0 ? (
            <div style={{
              background: "#fff", border: "1.5px solid rgba(124,45,18,0.12)",
              borderRadius: 22, padding: "40px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, color: "#7C2D12" }}>
                No questions yet
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: "#A8603C" }}>
                No questions available for Grade {grade} in this category.
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
                      border: `1.5px solid ${isSelected ? "#EA580C" : "rgba(124,45,18,0.12)"}`,
                      background: isSelected ? "linear-gradient(135deg, rgba(234,88,12,0.08), rgba(219,39,119,0.05))" : "#fff",
                      boxShadow: isSelected
                        ? "0 2px 0 rgba(234,88,12,0.15), 0 8px 20px -10px rgba(234,88,12,0.2)"
                        : "0 1px 0 rgba(124,45,18,0.05)",
                      transform: isSelected ? "translateY(-1px)" : "none",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit", color: "#7C2D12",
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#EA580C" : "rgba(124,45,18,0.2)"}`,
                      background: isSelected ? "#EA580C" : "#fff",
                      display: "grid", placeItems: "center",
                      flexShrink: 0, marginTop: 2,
                    }}>
                      {isSelected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontFamily: "'Sora', sans-serif", fontWeight: 700,
                        fontSize: 16, letterSpacing: "-0.01em",
                        color: isSelected ? "#EA580C" : "#7C2D12",
                        display: "block", marginBottom: 4,
                      }}>{q.title}</span>
                      <div style={{
                        fontSize: 13, color: "#A8603C",
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
