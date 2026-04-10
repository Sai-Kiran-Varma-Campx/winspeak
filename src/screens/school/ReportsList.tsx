import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  questionTitle: string;
  categoryId: string;
  grade: number;
  score: number;
  createdAt: string;
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function ReportsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const filtered = attempts.filter((a) => {
    if (!search) return true;
    const student = studentMap.get(a.studentId);
    const name = student?.fullName ?? "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
      a.questionTitle.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="school-page-container">
      {/* Header */}
      <div className="school-page-header">
        <h1>Reports</h1>
        <p>View detailed performance reports for your students</p>
      </div>

      {/* Search */}
      <div style={{ width: "100%", maxWidth: 900, marginBottom: 24 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or challenge..."
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            fontFamily: "'Nunito', 'Poppins', sans-serif", fontSize: 14, fontWeight: 600,
            color: "#2d1b69", outline: "none",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        />
      </div>

      {/* Reports */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size={28} />
        </div>
      ) : attempts.length === 0 ? (
        <div className="school-glass" style={{ padding: "48px 32px", textAlign: "center", maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 15 }}>&#128200;</div>
          <h3 style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 22, fontWeight: 700, color: "#2d1b69", marginBottom: 8,
          }}>No reports yet</h3>
          <p style={{ color: "#5a3e8a", fontSize: 15, fontWeight: 600, marginBottom: 24 }}>
            Run a speaking challenge to generate your first student report.
          </p>
          <button
            onClick={() => navigate("/school/administer")}
            style={{
              padding: "14px 36px", borderRadius: 30,
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              border: "none", color: "#fff", cursor: "pointer",
              fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
            }}
          >
            Administer Challenge
          </button>
        </div>
      ) : (
        <div className="school-page-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {filtered.map((a) => {
            const student = studentMap.get(a.studentId);
            return (
              <div
                key={a.id}
                className="school-glass-card"
                style={{ padding: 24, cursor: "pointer" }}
                onClick={() => navigate(`/school/report/${a.id}`)}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 12,
                }}>
                  <div style={{
                    fontFamily: "'Fredoka', 'Sora', sans-serif",
                    fontSize: 17, fontWeight: 600, color: "#2d1b69",
                  }}>
                    {student?.fullName ?? "Unknown"}
                  </div>
                  <StarRating stars={scoreToStars(a.score)} size={14} />
                </div>
                <p style={{
                  color: "#5a3e8a", fontSize: 14, fontWeight: 600, marginBottom: 6,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {a.questionTitle}
                </p>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ color: "#7a5eaa", fontSize: 12, fontWeight: 500 }}>
                    {fmtDate(a.createdAt)}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: "#ff6b35",
                  }}>
                    View Report →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{
          textAlign: "center", marginTop: 20,
          fontSize: 13, fontWeight: 600, color: "#5a3e8a", opacity: 0.7,
        }}>
          Showing {filtered.length} of {attempts.length} report{attempts.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
