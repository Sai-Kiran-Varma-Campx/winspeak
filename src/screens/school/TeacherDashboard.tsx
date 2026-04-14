import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Spinner from "@/components/Spinner";
import StarRating from "@/components/StarRating";
import { scoreToStars } from "@/lib/stars";

interface StudentRow {
  id: string;
  fullName: string;
  grade: number;
  section: string | null;
}
interface AttemptRow {
  id: string;
  studentId: string;
  score: number;
  skillFluency?: number; skillGrammar?: number; skillVocabulary?: number;
  skillClarity?: number; skillStructure?: number; skillRelevancy?: number;
  createdAt: string;
}

interface Aggregate {
  student: StudentRow;
  count: number;
  avgScore: number;
  topStrength: string;
  areaToImprove: string;
}

const SKILL_KEYS: { key: keyof AttemptRow; label: string }[] = [
  { key: "skillFluency",   label: "Fluency" },
  { key: "skillGrammar",   label: "Grammar" },
  { key: "skillVocabulary", label: "Vocabulary" },
  { key: "skillClarity",   label: "Clarity" },
  { key: "skillStructure", label: "Structure" },
  { key: "skillRelevancy", label: "Relevancy" },
];

function aggregate(students: StudentRow[], attempts: AttemptRow[]): Aggregate[] {
  return students.map((s) => {
    const mine = attempts.filter((a) => a.studentId === s.id);
    if (mine.length === 0) {
      return { student: s, count: 0, avgScore: 0, topStrength: "—", areaToImprove: "—" };
    }
    const avg = Math.round(mine.reduce((sum, a) => sum + a.score, 0) / mine.length);
    const skillAvg: Record<string, number> = {};
    SKILL_KEYS.forEach(({ key, label }) => {
      const vals = mine.map((a) => a[key] as number | undefined).filter((v): v is number => typeof v === "number");
      if (vals.length > 0) skillAvg[label] = vals.reduce((s, v) => s + v, 0) / vals.length;
    });
    const skills = Object.entries(skillAvg);
    const top = [...skills].sort((a, b) => b[1] - a[1])[0];
    const bot = [...skills].sort((a, b) => a[1] - b[1])[0];
    return {
      student: s,
      count: mine.length,
      avgScore: avg,
      topStrength: top ? top[0] : "—",
      areaToImprove: bot ? bot[0] : "—",
    };
  });
}

export default function TeacherDashboard() {
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

  const rows = aggregate(students, attempts);
  const totalAttempts = attempts.length;
  const avgScore = rows.length > 0
    ? Math.round(rows.filter(r => r.count > 0).reduce((s, r) => s + r.avgScore, 0) / Math.max(rows.filter(r => r.count > 0).length, 1))
    : 0;

  return (
    <div className="school-page-container">
      {/* Header */}
      <div className="school-page-header">
        <h1>Dashboard</h1>
        <p>Track your class's learning progress and achievements</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Spinner size={28} />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="school-page-cards" style={{ marginBottom: 30 }}>
            <div className="school-glass-card" style={{ padding: 30, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 15 }}>&#128218;</div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 600, color: "#2d1b69", marginBottom: 8,
              }}>Total Students</h3>
              <p style={{ color: "#5a3e8a", fontSize: 14, fontWeight: 600 }}>
                {students.length} student{students.length !== 1 ? "s" : ""} enrolled
              </p>
            </div>
            <div className="school-glass-card" style={{ padding: 30, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 15 }}>&#127942;</div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 600, color: "#2d1b69", marginBottom: 8,
              }}>Challenges Done</h3>
              <p style={{ color: "#5a3e8a", fontSize: 14, fontWeight: 600 }}>
                {totalAttempts} attempt{totalAttempts !== 1 ? "s" : ""} completed
              </p>
            </div>
            <div className="school-glass-card" style={{ padding: 30, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 15 }}>&#127775;</div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 600, color: "#2d1b69", marginBottom: 8,
              }}>Average Score</h3>
              <p style={{ color: "#5a3e8a", fontSize: 14, fontWeight: 600 }}>
                {avgScore > 0 ? `${avgScore}% class average` : "No scores yet"}
              </p>
            </div>
          </div>

          {/* Class overview table */}
          {rows.length > 0 && (
            <div className="school-glass" style={{
              width: "100%", maxWidth: 900, overflow: "hidden",
              borderRadius: 20, padding: 0,
            }}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "1.5fr 0.6fr 1.2fr 1fr 1fr",
                gap: 12, padding: "14px 24px",
                background: "rgba(255,255,255,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.3)",
              }}>
                {["Student", "Done", "Avg Stars", "Strength", "Improve"].map((h) => (
                  <div key={h} style={{
                    fontSize: 11, fontWeight: 800, color: "#4a1a7a",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    textAlign: h === "Done" ? "center" : "left",
                  }}>{h}</div>
                ))}
              </div>

              {rows.map((r, idx) => (
                <div
                  key={r.student.id}
                  style={{
                    display: "grid", gridTemplateColumns: "1.5fr 0.6fr 1.2fr 1fr 1fr",
                    gap: 12, padding: "14px 24px", alignItems: "center",
                    borderBottom: idx < rows.length - 1 ? "1px solid rgba(255,255,255,0.2)" : "none",
                  }}
                >
                  <div>
                    <div style={{
                      fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                      fontSize: 15, color: "#2d1b69",
                    }}>{r.student.fullName}</div>
                    <div style={{ fontSize: 11, color: "#5a3e8a", fontWeight: 500 }}>
                      Grade {r.student.grade}
                    </div>
                  </div>
                  <div style={{
                    textAlign: "center", fontWeight: 800, fontSize: 14, color: "#2d1b69",
                    background: "rgba(255,255,255,0.4)", borderRadius: 999,
                    width: 32, height: 32, display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto",
                    border: "1px solid rgba(255,255,255,0.5)",
                  }}>{r.count}</div>
                  <div>
                    {r.count > 0 ? <StarRating stars={scoreToStars(r.avgScore)} size={16} /> : <span style={{ color: "#5a3e8a" }}>—</span>}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#0D9488", background: "rgba(204,251,241,0.7)",
                    border: "1px solid #5EEAD4", padding: "3px 8px", borderRadius: 999,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{r.topStrength}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#B45309", background: "rgba(254,243,199,0.7)",
                    border: "1px solid #FCD34D", padding: "3px 8px", borderRadius: 999,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{r.areaToImprove}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
