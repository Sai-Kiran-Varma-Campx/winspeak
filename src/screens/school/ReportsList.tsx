import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useStore } from "@/context/UserStoreContext";
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

const PAGE_SIZE = 10;

export default function ReportsList() {
  const navigate = useNavigate();
  const store = useStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [gradeDropOpen, setGradeDropOpen] = useState(false);
  const gradeDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gradeDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (gradeDropRef.current && !gradeDropRef.current.contains(e.target as Node)) setGradeDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gradeDropOpen]);

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

  // Keep only the latest attempt per student+question (attempts are sorted by createdAt desc)
  const latestAttempts = (() => {
    const seen = new Set<string>();
    return attempts.filter((a) => {
      const key = `${a.studentId}:${a.questionTitle}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const teacherGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    if (gradeFilter === null && teacherGrades.length > 0) {
      setGradeFilter(teacherGrades[0]);
    }
  }, [teacherGrades.length]);

  const filtered = latestAttempts.filter((a) => {
    if (gradeFilter && a.grade !== gradeFilter) return false;
    if (!search) return true;
    const student = studentMap.get(a.studentId);
    const name = student?.fullName ?? "";
    return name.toLowerCase().includes(search.toLowerCase()) ||
      a.questionTitle.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, gradeFilter]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="school-page-container">
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: "1.5px solid rgba(124, 58, 237, 0.25)", boxShadow: "0 4px 15px rgba(124, 58, 237, 0.08)",
        borderRadius: 20, padding: "24px 32px", marginBottom: 30, width: "100%", maxWidth: 900,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ flexShrink: 0 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="8" width="32" height="36" rx="4" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1.5" />
            <rect x="16" y="4" width="16" height="8" rx="3" fill="#7C3AED" />
            <path d="M24 18 L26 23 L31 23.5 L27 27 L28.5 32 L24 29 L19.5 32 L21 27 L17 23.5 L22 23Z" fill="#A78BFA" />
            <line x1="14" y1="36" x2="34" y2="36" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="40" x2="28" y2="40" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 28, fontWeight: 500, color: "#4C1D95", margin: 0 }}>Reports</h1>
          <p style={{ color: "#6E5E8A", fontSize: 14, fontWeight: 500, margin: 0, marginTop: 2 }}>View detailed performance reports for your students</p>
        </div>
      </div>

      {/* Search + Grade filter */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        maxWidth: 900, marginBottom: 24, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student or challenge..."
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 14,
              border: "1.5px solid rgba(124,58,237,0.25)",
              background: "rgba(237, 233, 254, 0.55)",
              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
              fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500,
              color: "#4C1D95", outline: "none",
            }}
          />
        </div>
        <div ref={gradeDropRef} style={{ position: "relative", flexShrink: 0 }}>
          <div
            onClick={() => setGradeDropOpen((p) => !p)}
            style={{
              padding: "12px 40px 12px 24px", borderRadius: 30,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 15,
              color: "#fff", cursor: "pointer", minWidth: 140,
              userSelect: "none",
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            Grade {gradeFilter ?? teacherGrades[0] ?? "—"}
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
              zIndex: 50,
            }}>
              {teacherGrades.map((g) => (
                <div
                  key={g}
                  onClick={() => { setGradeFilter(g); setGradeDropOpen(false); }}
                  style={{
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14,
                    color: gradeFilter === g ? "#fff" : "#4C1D95",
                    background: gradeFilter === g ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (gradeFilter !== g) e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                  onMouseLeave={(e) => { if (gradeFilter !== g) e.currentTarget.style.background = "transparent"; }}
                >
                  Grade {g}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reports list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size={28} />
        </div>
      ) : latestAttempts.length === 0 ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.08)",
          borderRadius: 24, padding: "48px 32px", textAlign: "center", maxWidth: 500,
        }}>
          <div style={{ fontSize: 48, marginBottom: 15 }}>&#128200;</div>
          <h3 style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 22, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
          }}>No reports yet</h3>
          <p style={{ color: "#6E5E8A", fontSize: 15, fontWeight: 500, marginBottom: 24 }}>
            Run a speaking challenge to generate your first student report.
          </p>
          <button
            onClick={() => navigate("/school/administer")}
            style={{
              padding: "14px 36px", borderRadius: 30,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              border: "none", color: "#fff", cursor: "pointer",
              fontWeight: 500, fontSize: 16,
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            Administer Challenge
          </button>
        </div>
      ) : (
        <div style={{
          width: "100%", maxWidth: 900,
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.08)",
          borderRadius: 20, overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1.5fr 0.8fr 0.8fr 0.5fr",
            gap: 12, padding: "14px 24px",
            background: "rgba(124,58,237,0.06)",
            borderBottom: "1px solid rgba(124,58,237,0.1)",
          }}>
            {["Student", "Challenge", "Score", "Date", ""].map((h) => (
              <div key={h} style={{
                fontSize: 11, fontWeight: 500, color: "#4C1D95",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {paginated.map((a, idx) => {
            const student = studentMap.get(a.studentId);
            return (
              <div
                key={a.id}
                onClick={() => navigate(`/school/report/${a.id}`)}
                style={{
                  display: "grid", gridTemplateColumns: "1.2fr 1.5fr 0.8fr 0.8fr 0.5fr",
                  gap: 12, padding: "14px 24px", alignItems: "center",
                  borderBottom: idx < paginated.length - 1 ? "1px solid rgba(124,58,237,0.06)" : "none",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 500, fontSize: 14,
                    fontFamily: "'Fredoka', 'Sora', sans-serif", flexShrink: 0,
                  }}>
                    {(student?.fullName ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Fredoka', 'Sora', sans-serif",
                      fontWeight: 500, fontSize: 15, color: "#4C1D95",
                    }}>{student?.fullName ?? "Unknown"}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: "#6E5E8A" }}>
                      Grade {a.grade}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 500, color: "#4C1D95",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {a.questionTitle}
                </div>
                <div>
                  <StarRating stars={scoreToStars(a.score)} size={16} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#6E5E8A" }}>
                  {fmtDate(a.createdAt)}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: "#7C3AED",
                }}>
                  View →
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 20, width: "100%", maxWidth: 900,
        }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "1.5px solid rgba(124,58,237,0.15)",
              background: "rgba(255,255,255,0.55)", cursor: safePage <= 1 ? "not-allowed" : "pointer",
              display: "grid", placeItems: "center",
              opacity: safePage <= 1 ? 0.4 : 1,
              color: "#4C1D95", fontWeight: 500, fontSize: 14,
            }}
          >&#8249;</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: p === safePage ? "none" : "1.5px solid rgba(124,58,237,0.15)",
                background: p === safePage ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "rgba(255,255,255,0.55)",
                color: p === safePage ? "#fff" : "#4C1D95",
                fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 13,
                cursor: "pointer",
                boxShadow: p === safePage ? "0 2px 6px rgba(124,58,237,0.2)" : "none",
              }}
            >{p}</button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "1.5px solid rgba(124,58,237,0.15)",
              background: "rgba(255,255,255,0.55)", cursor: safePage >= totalPages ? "not-allowed" : "pointer",
              display: "grid", placeItems: "center",
              opacity: safePage >= totalPages ? 0.4 : 1,
              color: "#4C1D95", fontWeight: 500, fontSize: 14,
            }}
          >&#8250;</button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{
          textAlign: "center", marginTop: 12,
          fontSize: 13, fontWeight: 500, color: "#6E5E8A", opacity: 0.7,
        }}>
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} report{filtered.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
