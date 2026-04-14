import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useStore } from "@/context/UserStoreContext";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import Spinner from "@/components/Spinner";

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
  createdAt: string;
}

interface ChallengeRow {
  questionId: string;
  questionTitle: string;
  grade: number;
  sections: string[];
  totalStudents: number;
  completedStudents: number;
  latestDate: string;
}

function aggregateCustomChallenges(students: StudentRow[], attempts: AttemptRow[]): ChallengeRow[] {
  const custom = attempts.filter((a) => a.questionId?.startsWith("custom_"));
  const map = new Map<string, { questionId: string; questionTitle: string; grade: number; studentIds: Set<string>; latestDate: string }>();
  for (const a of custom) {
    const key = `${a.grade}::${a.questionId}`;
    if (!map.has(key)) {
      map.set(key, { questionId: a.questionId, questionTitle: a.questionTitle, grade: a.grade, studentIds: new Set(), latestDate: a.createdAt });
    }
    const e = map.get(key)!;
    e.studentIds.add(a.studentId);
    if (a.createdAt > e.latestDate) e.latestDate = a.createdAt;
  }
  const rows: ChallengeRow[] = [];
  for (const e of map.values()) {
    const gradeStudents = students.filter((s) => s.grade === e.grade);
    const sections = Array.from(new Set(gradeStudents.map((s) => s.section).filter((x): x is string => !!x))).sort();
    rows.push({
      questionId: e.questionId,
      questionTitle: e.questionTitle,
      grade: e.grade,
      sections,
      totalStudents: gradeStudents.length,
      completedStudents: e.studentIds.size,
      latestDate: e.latestDate,
    });
  }
  return rows.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

const PAGE_SIZE = 10;

export default function CustomChallenges() {
  const navigate = useNavigate();
  const store = useStore();
  const session = useSchoolSession();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [gradeDropOpen, setGradeDropOpen] = useState(false);
  const gradeDropRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!gradeDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (gradeDropRef.current && !gradeDropRef.current.contains(e.target as Node)) setGradeDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gradeDropOpen]);

  // Create Challenge modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newScenario, setNewScenario] = useState("");
  const [newGrade, setNewGrade] = useState<number | null>(null);
  const [newSection, setNewSection] = useState<string | null>(null); // null = All sections

  function submitCreate() {
    if (!newTitle.trim() || !newPrompt.trim() || newGrade == null) return;
    const sectionTrimmed = newSection?.trim() || null;
    session.setCustomChallenge(
      newTitle.trim(),
      newPrompt.trim(),
      newScenario.trim() || "Your teacher has a special challenge for you today!",
      newGrade,
      sectionTrimmed,
    );
    setShowCreate(false);
    setNewTitle("");
    setNewPrompt("");
    setNewScenario("");
    setNewGrade(null);
    setNewSection(null);
    navigate("/school/administer/run");
  }

  const canSubmit = newTitle.trim() && newPrompt.trim() && newGrade != null;

  const teacherGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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

  useEffect(() => {
    if (gradeFilter === null && teacherGrades.length > 0) setGradeFilter(teacherGrades[0]);
  }, [teacherGrades.length]);

  const allRows = aggregateCustomChallenges(students, attempts);
  const filtered = allRows.filter((r) => {
    if (gradeFilter && r.grade !== gradeFilter) return false;
    if (search && !r.questionTitle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [gradeFilter, search]);

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
            <rect x="6" y="32" width="24" height="5" rx="2" fill="#A78BFA" transform="rotate(-45 18 34)" />
            <rect x="6" y="32" width="8" height="5" rx="2" fill="#7C3AED" transform="rotate(-45 18 34)" />
            <path d="M33 10 L35 15 L40 15.5 L36.5 18.5 L37.5 23 L33 20.5 L28.5 23 L29.5 18.5 L26 15.5 L31 15Z" fill="#C4B5FD" stroke="#7C3AED" strokeWidth="1.2" />
            <circle cx="22" cy="12" r="2.5" fill="#DDD6FE" />
            <circle cx="40" cy="8" r="2" fill="#8B5CF6" />
            <circle cx="38" cy="26" r="2" fill="#DDD6FE" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 28, fontWeight: 500, color: "#4C1D95", margin: 0 }}>My Challenges</h1>
          <p style={{ color: "#6E5E8A", fontSize: 14, fontWeight: 500, margin: 0, marginTop: 2 }}>Challenges you created and administered to your class</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: "12px 22px", borderRadius: 30,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14,
            boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            flexShrink: 0,
          }}
        >
          + New Challenge
        </button>
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
            placeholder="Search custom challenges..."
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

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size={28} />
        </div>
      ) : allRows.length === 0 ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.08)",
          borderRadius: 24, padding: "48px 32px", textAlign: "center", maxWidth: 500,
        }}>
          <div style={{ fontSize: 48, marginBottom: 15 }}>&#128221;</div>
          <h3 style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 22, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
          }}>No custom challenges yet</h3>
          <p style={{ color: "#6E5E8A", fontSize: 15, fontWeight: 500, marginBottom: 24 }}>
            Create your own speaking challenge tailored to your class.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: "14px 36px", borderRadius: 30,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              border: "none", color: "#fff", cursor: "pointer",
              fontWeight: 500, fontSize: 16,
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            Create Your First Challenge
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)",
          border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 20,
          padding: 40, textAlign: "center", width: "100%", maxWidth: 900,
        }}>
          <p style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 16, fontWeight: 500, color: "#6E5E8A" }}>
            No custom challenges match your filters.
          </p>
        </div>
      ) : (
        <div style={{
          width: "100%", maxWidth: 900, overflow: "hidden",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(124, 58, 237, 0.25)",
          borderRadius: 20,
        }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.9fr",
            gap: 12, padding: "14px 24px",
            background: "rgba(124,58,237,0.06)",
            borderBottom: "1px solid rgba(124,58,237,0.1)",
          }}>
            {["Challenge", "Progress", ""].map((h, i) => (
              <div key={i} style={{
                fontSize: 11, fontWeight: 500, color: "#4C1D95",
                textTransform: "uppercase" as const, letterSpacing: "0.06em",
                textAlign: i === 1 ? "center" : "left",
              }}>{h}</div>
            ))}
          </div>

          {paginated.map((r, idx) => {
            const pct = r.totalStudents > 0 ? Math.round((r.completedStudents / r.totalStudents) * 100) : 0;
            return (
              <div
                key={`${r.grade}-${r.questionId}`}
                style={{
                  display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.9fr",
                  gap: 12, padding: "16px 24px", alignItems: "center",
                  borderBottom: idx < paginated.length - 1 ? "1px solid rgba(124,58,237,0.06)" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.04)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                      fontSize: 15, color: "#4C1D95",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{r.questionTitle}</div>
                    <div style={{ fontSize: 11, color: "#6E5E8A", fontWeight: 500, marginTop: 2 }}>
                      Grade {r.grade}{r.sections.length > 0 ? ` · Section ${r.sections.join(", ")}` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#4C1D95" }}>
                    {r.completedStudents} / {r.totalStudents}
                  </div>
                  <div style={{
                    width: "100%", height: 6, borderRadius: 999,
                    background: "rgba(124,58,237,0.15)", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                      borderRadius: 999,
                    }} />
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/school/class-report/${r.grade}/${encodeURIComponent(r.questionId)}`)}
                  style={{
                    padding: "9px 14px", borderRadius: 12,
                    background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                    border: "none", color: "#fff", cursor: "pointer",
                    fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 12.5,
                    boxShadow: "0 2px 8px rgba(124,58,237,0.25)",
                    whiteSpace: "nowrap",
                  }}
                >
                  View Report →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 16, width: "100%", maxWidth: 900,
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

      {/* ── Create Challenge Modal ── */}
      {showCreate && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
            background: "rgba(76, 29, 149, 0.25)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 28, padding: "28px 24px 24px",
              width: "100%", maxWidth: 440,
              boxShadow: "0 6px 0 rgba(124,58,237,0.08), 0 24px 60px -16px rgba(124,58,237,0.25)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 5,
              background: "linear-gradient(90deg, #7C3AED, #A78BFA, #C4B5FD, #7C3AED)",
              borderRadius: "28px 28px 0 0",
            }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: "linear-gradient(135deg, #EDE9FE, #F3E8FF)",
                  display: "grid", placeItems: "center", fontSize: 22,
                  border: "1.5px solid #C4B5FD",
                }}>&#9997;&#65039;</div>
                <div>
                  <div style={{
                    fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                    fontSize: 20, color: "#4C1D95", letterSpacing: "-0.02em",
                  }}>Create a Challenge</div>
                  <div style={{ fontSize: 12, color: "#6E5E8A", fontWeight: 500 }}>
                    Your class will love this!
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  border: "1.5px solid rgba(124,58,237,0.12)",
                  background: "#fff", cursor: "pointer",
                  display: "grid", placeItems: "center",
                  color: "#6E5E8A", fontSize: 16,
                }}
              >×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  color: "#6E5E8A", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 6,
                }}>Challenge Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. My Dream Superpower"
                  maxLength={80}
                  autoFocus
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 16,
                    border: "2px solid rgba(124,58,237,0.12)",
                    background: "#FAFAFE",
                    fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 500,
                    color: "#4C1D95", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7C3AED"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)"}
                />
              </div>

              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  color: "#6E5E8A", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 6,
                }}>What should they talk about?</label>
                <textarea
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="e.g. If you could have any superpower, what would it be and why? Tell us how you'd use it to help others."
                  maxLength={300}
                  rows={3}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 16,
                    border: "2px solid rgba(124,58,237,0.12)",
                    background: "#FAFAFE",
                    fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 500,
                    color: "#4C1D95", outline: "none", resize: "none",
                    lineHeight: 1.5,
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7C3AED"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)"}
                />
              </div>

              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  color: "#6E5E8A", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 6,
                }}>Scene / Context <span style={{ fontWeight: 500, opacity: 0.6 }}>(optional)</span></label>
                <input
                  value={newScenario}
                  onChange={(e) => setNewScenario(e.target.value)}
                  placeholder="e.g. You're presenting to your class during morning assembly."
                  maxLength={200}
                  style={{
                    width: "100%", padding: "13px 16px", borderRadius: 16,
                    border: "2px solid rgba(124,58,237,0.12)",
                    background: "#FAFAFE",
                    fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 500,
                    color: "#4C1D95", outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#7C3AED"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)"}
                />
              </div>

              {/* Grade picker */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 500,
                  color: "#6E5E8A", textTransform: "uppercase",
                  letterSpacing: "0.08em", marginBottom: 8,
                }}>Grade</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {teacherGrades.map((g) => {
                    const isActive = newGrade === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setNewGrade(g); setNewSection(null); }}
                        style={{
                          flex: 1, minWidth: 56, padding: "10px 0",
                          borderRadius: 14,
                          border: `2px solid ${isActive ? "#7C3AED" : "rgba(124,58,237,0.12)"}`,
                          background: isActive ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "#fff",
                          color: isActive ? "#fff" : "#4C1D95",
                          fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 16,
                          cursor: "pointer",
                          boxShadow: isActive
                            ? "0 3px 0 #5B21B6, 0 6px 14px -4px rgba(124,58,237,0.3)"
                            : "0 1px 0 rgba(124,58,237,0.05)",
                          transition: "all 0.18s cubic-bezier(.34,1.56,.64,1)",
                        }}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section input (only after grade is selected) */}
              {newGrade != null && (
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 500,
                    color: "#6E5E8A", textTransform: "uppercase",
                    letterSpacing: "0.08em", marginBottom: 6,
                  }}>Section</label>
                  <input
                    value={newSection ?? ""}
                    onChange={(e) => setNewSection(e.target.value || null)}
                    placeholder="e.g. A"
                    maxLength={20}
                    style={{
                      width: "100%", padding: "13px 16px", borderRadius: 16,
                      border: "2px solid rgba(124,58,237,0.12)",
                      background: "#FAFAFE",
                      fontFamily: "'Poppins', sans-serif", fontSize: 14, fontWeight: 500,
                      color: "#4C1D95", outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#7C3AED"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.12)"}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  flex: 1, padding: "13px 0", borderRadius: 16,
                  border: "1.5px solid rgba(124,58,237,0.15)",
                  background: "#fff", color: "#4C1D95",
                  fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitCreate}
                disabled={!canSubmit}
                style={{
                  flex: 2, padding: "13px 0", borderRadius: 16,
                  border: "none",
                  background: canSubmit
                    ? "linear-gradient(135deg, #7C3AED, #A78BFA)"
                    : "rgba(124,58,237,0.08)",
                  color: canSubmit ? "#fff" : "#6E5E8A",
                  fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  boxShadow: canSubmit
                    ? "0 3px 0 #5B21B6, 0 8px 20px -6px rgba(124,58,237,0.3)"
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
