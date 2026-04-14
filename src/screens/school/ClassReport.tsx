import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";
import StarRating from "@/components/StarRating";

interface StudentRow {
  id: string;
  fullName: string;
  grade: number;
  section: string | null;
}

interface AttemptRow {
  id: string;
  studentId: string;
  questionId: string;
  questionTitle: string;
  categoryId: string;
  grade: number;
  score: number;
  skillFluency?: number; skillGrammar?: number; skillVocabulary?: number;
  skillClarity?: number; skillStructure?: number; skillRelevancy?: number;
  createdAt: string;
}

function medalFor(rank: number): string | null {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return null;
}

export default function ClassReport() {
  const navigate = useNavigate();
  const params = useParams<{ grade: string; questionId: string }>();
  const grade = parseInt(params.grade || "0", 10);
  const questionId = decodeURIComponent(params.questionId || "");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([
          api.listStudents() as Promise<StudentRow[]>,
          api.listSchoolAttempts({ limit: 200 }) as Promise<AttemptRow[]>,
        ]);
        setStudents(s);
        setAttempts(a);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Only attempts for this specific challenge + grade
  const relevant = attempts.filter((a) => a.grade === grade && a.questionId === questionId);

  // Keep the best (highest-scoring) attempt per student
  const bestByStudent = useMemo(() => {
    const map = new Map<string, AttemptRow>();
    for (const a of relevant) {
      const cur = map.get(a.studentId);
      if (!cur || a.score > cur.score) map.set(a.studentId, a);
    }
    return map;
  }, [relevant]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const gradeStudents = students.filter((s) => s.grade === grade);

  const ranked = Array.from(bestByStudent.values())
    .map((a) => ({ attempt: a, student: studentMap.get(a.studentId) }))
    .filter((r) => !!r.student)
    .sort((a, b) => b.attempt.score - a.attempt.score);

  const questionTitle = relevant[0]?.questionTitle ?? "Challenge";
  const sectionsSet = new Set(gradeStudents.map((s) => s.section).filter((x): x is string => !!x));
  const sections = Array.from(sectionsSet).sort();

  const avgScore = ranked.length > 0
    ? Math.round(ranked.reduce((sum, r) => sum + r.attempt.score, 0) / ranked.length)
    : 0;

  // Skill averages
  const skillLabels = [
    { key: "skillFluency" as const, label: "Fluency" },
    { key: "skillGrammar" as const, label: "Grammar" },
    { key: "skillVocabulary" as const, label: "Vocabulary" },
    { key: "skillClarity" as const, label: "Clarity" },
    { key: "skillStructure" as const, label: "Structure" },
    { key: "skillRelevancy" as const, label: "Relevancy" },
  ];
  const skillAverages = skillLabels.map((sk) => {
    const vals = ranked.map((r) => r.attempt[sk.key] as number | undefined).filter((v): v is number => typeof v === "number");
    const avg = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
    return { label: sk.label, avg };
  });

  if (loading) {
    return (
      <div className="school-page-container">
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size={28} />
        </div>
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="school-page-container">
        <button
          onClick={() => navigate("/school")}
          style={{
            padding: "10px 18px", borderRadius: 12, marginBottom: 20,
            border: "1.5px solid rgba(124,58,237,0.25)",
            background: "rgba(255,255,255,0.6)", color: "#4C1D95",
            cursor: "pointer", fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontWeight: 700, fontSize: 13,
          }}
        >&larr; Back to Home</button>
        <div className="school-glass-card" style={{
          padding: 48, textAlign: "center", width: "100%", maxWidth: 700,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#128218;</div>
          <p style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 20, fontWeight: 500, color: "#4C1D95" }}>
            No attempts yet for this challenge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="school-page-container">
      {/* Back button */}
      <button
        onClick={() => navigate("/school")}
        style={{
          padding: "10px 18px", borderRadius: 12, marginBottom: 20,
          border: "1.5px solid rgba(124,58,237,0.25)",
          background: "rgba(255,255,255,0.6)", color: "#4C1D95",
          cursor: "pointer", fontFamily: "'Fredoka', 'Sora', sans-serif",
          fontWeight: 700, fontSize: 13, alignSelf: "flex-start",
        }}
      >&larr; Back to Home</button>

      {/* Header card */}
      <div style={{
        width: "100%", maxWidth: 900, marginBottom: 24,
        padding: "28px 32px",
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: "1.5px solid rgba(124, 58, 237, 0.25)",
        boxShadow: "0 4px 15px rgba(124, 58, 237, 0.08)",
        borderRadius: 20,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Class Report
        </div>
        <h1 style={{
          fontFamily: "'Fredoka', 'Sora', sans-serif",
          fontSize: 26, fontWeight: 700, color: "#4C1D95", margin: 0, lineHeight: 1.2,
        }}>
          {questionTitle}
        </h1>
        <div style={{ fontSize: 14, color: "#6E5E8A", fontWeight: 600, marginTop: 6 }}>
          Grade {grade}{sections.length > 0 ? ` · Section ${sections.join(", ")}` : ""}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 14, width: "100%", maxWidth: 900, marginBottom: 24,
      }}>
        <div className="school-glass-card" style={{ padding: "20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Class Average
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StarRating score={avgScore} size={22} />
          </div>
        </div>
        <div className="school-glass-card" style={{ padding: "20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Students Taken
          </div>
          <div style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 15, fontWeight: 700, color: "#4C1D95", lineHeight: 1.2,
          }}>
            {ranked.length === gradeStudents.length
              ? "All students completed"
              : `${gradeStudents.length - ranked.length} yet to start`}
          </div>
        </div>
        <div className="school-glass-card" style={{ padding: "20px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Top Performer
          </div>
          <div style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 15, fontWeight: 700, color: "#4C1D95",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            marginBottom: 6,
          }}>
            {ranked[0].student?.fullName ?? "—"}
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <StarRating score={ranked[0].attempt.score} size={16} />
          </div>
        </div>
      </div>

      {/* Skill averages */}
      <div style={{
        width: "100%", maxWidth: 900, marginBottom: 24,
        padding: "22px 28px",
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: "1.5px solid rgba(124, 58, 237, 0.25)",
        borderRadius: 20,
      }}>
        <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 16, fontWeight: 500, color: "#4C1D95", marginBottom: 14 }}>
          Class Skill Averages
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {skillAverages.map((sk) => (
            <div key={sk.label} style={{
              padding: "14px 16px", borderRadius: 12,
              background: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(124,58,237,0.12)",
              display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#4C1D95" }}>{sk.label}</div>
              <StarRating score={sk.avg} size={16} />
            </div>
          ))}
        </div>
      </div>

      {/* Student leaderboard */}
      <div style={{
        width: "100%", maxWidth: 900, overflow: "hidden",
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: "1.5px solid rgba(124, 58, 237, 0.25)",
        borderRadius: 20,
      }}>
        <div style={{
          padding: "16px 24px",
          background: "rgba(124,58,237,0.06)",
          borderBottom: "1px solid rgba(124,58,237,0.1)",
          fontFamily: "'Fredoka', 'Sora', sans-serif",
          fontSize: 15, fontWeight: 700, color: "#4C1D95",
        }}>
          Student Rankings
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "0.4fr 1.6fr 0.6fr 1fr 0.6fr",
          gap: 12, padding: "12px 24px",
          background: "rgba(124,58,237,0.04)",
          borderBottom: "1px solid rgba(124,58,237,0.08)",
        }}>
          {["#", "Student", "Section", "Rating", ""].map((h, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 800, color: "#4C1D95",
              textTransform: "uppercase", letterSpacing: "0.06em",
              textAlign: i === 0 ? "center" : "left",
            }}>{h}</div>
          ))}
        </div>

        {ranked.map((r, idx) => {
          const medal = medalFor(idx);
          return (
            <div
              key={r.attempt.id}
              style={{
                display: "grid", gridTemplateColumns: "0.4fr 1.6fr 0.6fr 1fr 0.6fr",
                gap: 12, padding: "14px 24px", alignItems: "center",
                borderBottom: idx < ranked.length - 1 ? "1px solid rgba(124,58,237,0.06)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.04)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                textAlign: "center", fontWeight: 800, fontSize: medal ? 20 : 14,
                color: "#4C1D95",
              }}>
                {medal ?? idx + 1}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  fontFamily: "'Fredoka', 'Sora', sans-serif", flexShrink: 0,
                }}>
                  {(r.student?.fullName ?? "?").charAt(0).toUpperCase()}
                </div>
                <div style={{
                  fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                  fontSize: 14, color: "#4C1D95",
                }}>{r.student?.fullName ?? "Unknown"}</div>
              </div>
              <div style={{ fontSize: 12, color: "#6E5E8A", fontWeight: 600 }}>
                {r.student?.section || "—"}
              </div>
              <div>
                <StarRating score={r.attempt.score} size={16} />
              </div>
              <button
                onClick={() => navigate(`/school/report/${r.attempt.id}`)}
                style={{
                  padding: "6px 12px", borderRadius: 10,
                  background: "rgba(255,255,255,0.7)",
                  border: "1.5px solid rgba(124,58,237,0.25)",
                  color: "#4C1D95", cursor: "pointer",
                  fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 11,
                  whiteSpace: "nowrap",
                }}
              >View →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
