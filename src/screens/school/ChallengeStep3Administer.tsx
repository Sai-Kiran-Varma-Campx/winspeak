import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useSchoolSession } from "@/context/SchoolSessionContext";
import { useSession } from "@/context/SessionContext";
import { getSchoolCategory } from "@/constants/challenges-school";
import Spinner from "@/components/Spinner";

interface StudentRow {
  id: string;
  fullName: string;
  grade: number;
  section?: string | null;
}

const PAGE_SIZE = 8;

export default function ChallengeStep3Administer() {
  const navigate = useNavigate();
  const session = useSchoolSession();
  const recordSession = useSession();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done">("all");
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const statusDropRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!statusDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (statusDropRef.current && !statusDropRef.current.contains(e.target as Node)) setStatusDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [statusDropOpen]);

  // Bounce out if previous steps were skipped
  useEffect(() => {
    if (!session.selectedCategory || !session.selectedQuestion || session.selectedGrade == null) {
      navigate("/school/administer", { replace: true });
    }
  }, [session, navigate]);

  // Load roster for selected grade once
  useEffect(() => {
    if (session.rosterSnapshot.length > 0 || session.selectedGrade == null) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        let rows = (await api.listStudents(session.selectedGrade!)) as StudentRow[];
        // Filter by selected section if one was chosen (custom challenge flow)
        if (session.selectedSection) {
          rows = rows.filter((r) => r.section === session.selectedSection);
        }
        session.setRoster(rows);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startStudent(s: StudentRow) {
    if (!session.selectedQuestion) return;
    session.startStudent(s.id);
    // Reuse the existing recording flow. Recording screen will read the
    // school session and route to /school/analysing → /school/report on submit.
    recordSession.reset();
    recordSession.setChallengeId(`school:${session.selectedQuestion.id}`);
    navigate("/school/recording");
  }

  const allDone =
    session.rosterSnapshot.length > 0 &&
    session.rosterSnapshot.every((s) => session.studentStatus[s.id] === "done");

  const q = session.selectedQuestion;

  const doneCount = session.rosterSnapshot.filter((s) => session.studentStatus[s.id] === "done").length;
  const totalCount = session.rosterSnapshot.length;

  const filtered = useMemo(() => {
    return session.rosterSnapshot.filter((s) => {
      const st = session.studentStatus[s.id] ?? "pending";
      if (statusFilter === "pending" && st === "done") return false;
      if (statusFilter === "done" && st !== "done") return false;
      if (search && !s.fullName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [session.rosterSnapshot, session.studentStatus, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-48">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Step 3 of 3
        </div>
        <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 28, fontWeight: 500, color: "#4C1D95", margin: 0, lineHeight: 1.2 }}>
          Administer Challenge
        </h1>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#6E5E8A", marginTop: 6 }}>
          Start recording for each student in your class.
        </p>

        {q && (() => {
          const isCustom = q.id?.startsWith("custom_");
          const cat = !isCustom && session.selectedCategory ? getSchoolCategory(session.selectedCategory) : null;
          return (
            <div style={{
              background: "#EDE9FE", border: "1.5px solid #C4B5FD",
              borderRadius: 22, padding: 20, marginTop: 20,
              boxShadow: "0 2px 0 rgba(124,58,237,0.06)", position: "relative", overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                {isCustom ? (
                  <>
                    <span style={{
                      fontSize: 18, width: 32, height: 32, borderRadius: 10,
                      background: "#fff", border: "1.5px solid #C4B5FD",
                      display: "inline-grid", placeItems: "center",
                    }}>&#9997;&#65039;</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#4C1D95" }}>Custom Challenge</span>
                    <span style={{ color: "#7C3AED", fontSize: 13, fontWeight: 600 }}>·</span>
                  </>
                ) : cat && (
                  <>
                    <span style={{
                      fontSize: 20, width: 32, height: 32, borderRadius: 10,
                      background: "#fff", border: "1.5px solid #C4B5FD",
                      display: "inline-grid", placeItems: "center",
                    }}>{cat.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#4C1D95" }}>{cat.title}</span>
                    <span style={{ color: "#7C3AED", fontSize: 13, fontWeight: 600 }}>·</span>
                  </>
                )}
                {session.selectedGrade != null && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "2px 10px",
                    borderRadius: 999, background: "#C4B5FD",
                    border: "1px solid #A78BFA", color: "#4C1D95",
                  }}>
                    Grade {session.selectedGrade}{session.selectedSection ? ` · Section ${session.selectedSection}` : ""}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 17, fontWeight: 500, color: "#4C1D95", marginBottom: 4 }}>{q.title}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#6E5E8A", lineHeight: 1.5 }}>{q.prompt}</div>
            </div>
          );
        })()}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size={32} />
          </div>
        ) : session.rosterSnapshot.length === 0 ? (
          <div style={{
            background: "white", border: "1.5px solid rgba(124,58,237,0.12)",
            padding: 32, textAlign: "center", borderRadius: 24,
            boxShadow: "0 2px 0 rgba(124,58,237,0.04)",
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 20, fontWeight: 500, color: "#4C1D95", marginBottom: 8 }}>No students in Grade {session.selectedGrade}{session.selectedSection ? ` · Section ${session.selectedSection}` : ""}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#6E5E8A" }}>
              Add students from your Teacher Home before administering challenges.
            </div>
          </div>
        ) : (
          <>
          {/* Search + Filter bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap",
          }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                style={{
                  width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12,
                  border: "1.5px solid rgba(124,58,237,0.12)", background: "#fff",
                  fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500,
                  color: "#4C1D95", outline: "none",
                }}
              />
            </div>

            {/* Status filter dropdown */}
            <div ref={statusDropRef} style={{ position: "relative" }}>
              <div
                onClick={() => setStatusDropOpen((p) => !p)}
                style={{
                  padding: "12px 40px 12px 16px",
                  borderRadius: 30,
                  background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                  fontFamily: "'Fredoka', 'Sora', sans-serif",
                  fontWeight: 700, fontSize: 14, color: "#fff",
                  cursor: "pointer", minWidth: 150, userSelect: "none",
                  boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                }}
              >
                {statusFilter === "all" ? `All Students (${totalCount})` : statusFilter === "pending" ? `Pending (${totalCount - doneCount})` : `Completed (${doneCount})`}
              </div>
              <svg style={{ position: "absolute", right: 16, top: "50%", transform: statusDropOpen ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)", transition: "transform 0.2s", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {statusDropOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: "1.5px solid rgba(124,58,237,0.18)",
                  borderRadius: 14, padding: 4,
                  boxShadow: "0 8px 24px rgba(124,58,237,0.15)",
                  zIndex: 50,
                }}>
                  {([
                    { value: "all" as const, label: `All Students (${totalCount})` },
                    { value: "pending" as const, label: `Pending (${totalCount - doneCount})` },
                    { value: "done" as const, label: `Completed (${doneCount})` },
                  ]).map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => { setStatusFilter(opt.value); setStatusDropOpen(false); }}
                      style={{
                        padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                        fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14,
                        color: statusFilter === opt.value ? "#fff" : "#4C1D95",
                        background: statusFilter === opt.value ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "transparent",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { if (statusFilter !== opt.value) e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                      onMouseLeave={(e) => { if (statusFilter !== opt.value) e.currentTarget.style.background = "transparent"; }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: "#fff", border: "1.5px solid rgba(124,58,237,0.1)",
            borderRadius: 22, overflow: "hidden",
            boxShadow: "0 2px 0 rgba(124,58,237,0.04), 0 8px 24px -16px rgba(124,58,237,0.1)",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 120px 100px",
              padding: "12px 20px", gap: 12,
              background: "#EDE9FE", borderBottom: "1.5px solid #C4B5FD",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.08em" }}>Student</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Status</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Action</div>
            </div>

            {/* Table rows */}
            {paginated.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
                <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 14, color: "#4C1D95" }}>No students match</div>
                <div style={{ fontSize: 12, color: "#6E5E8A", marginTop: 2 }}>Try a different search or filter.</div>
              </div>
            ) : paginated.map((s, idx) => {
              const status = session.studentStatus[s.id] ?? "pending";
              const avatarColors = [
                { bg: "#EDE9FE", bd: "#C4B5FD", text: "#7C3AED" },
                { bg: "#F3E8FF", bd: "#D8B4FE", text: "#9333EA" },
                { bg: "#E0E7FF", bd: "#A5B4FC", text: "#4F46E5" },
                { bg: "#EDE9FE", bd: "#C4B5FD", text: "#7C3AED" },
              ];
              const avatarStyle = avatarColors[idx % 4];

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 100px",
                    padding: "14px 20px", gap: 12,
                    alignItems: "center",
                    borderBottom: idx < paginated.length - 1 ? "1px solid rgba(124,58,237,0.06)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFE"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Student name + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      display: "grid", placeItems: "center",
                      fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 17,
                      background: avatarStyle.bg, border: `1.5px solid ${avatarStyle.bd}`,
                      color: avatarStyle.text, flexShrink: 0,
                    }}>
                      {s.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
                        fontSize: 15, color: "#4C1D95",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{s.fullName}</div>
                      <div style={{ fontSize: 11, color: "#6E5E8A", fontWeight: 500 }}>
                        Grade {s.grade}{s.section ? ` · ${s.section}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: "center" }}>
                    {status === "done" ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 12px", borderRadius: 999,
                        background: "#CCFBF1", border: "1px solid #5EEAD4",
                        fontSize: 12, fontWeight: 700, color: "#0D9488",
                      }}>
                        ✓ Completed
                      </span>
                    ) : status === "active" ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 12px", borderRadius: 999,
                        background: "#EDE9FE", border: "1px solid #C4B5FD",
                        fontSize: 12, fontWeight: 700, color: "#7C3AED",
                      }}>
                        ● In Progress
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 12px", borderRadius: 999,
                        background: "#F5F3FF", border: "1px solid rgba(124,58,237,0.12)",
                        fontSize: 12, fontWeight: 700, color: "#6E5E8A",
                      }}>
                        Not Started
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  <div style={{ textAlign: "center" }}>
                    {status === "done" ? (
                      <button
                        onClick={() => startStudent(s)}
                        style={{
                          padding: "8px 18px", borderRadius: 30,
                          background: "rgba(124,58,237,0.08)",
                          border: "1.5px solid rgba(124,58,237,0.2)",
                          color: "#4C1D95",
                          fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 13,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        Retry
                      </button>
                    ) : (
                      <button
                        onClick={() => startStudent(s)}
                        style={{
                          padding: "8px 18px", borderRadius: 30,
                          background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                          border: "none", color: "#fff",
                          fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 13,
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                          display: "flex", alignItems: "center", gap: 6,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        Start
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginTop: 16,
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: "1.5px solid rgba(124,58,237,0.12)",
                  background: "#fff", cursor: safePage <= 1 ? "not-allowed" : "pointer",
                  display: "grid", placeItems: "center",
                  opacity: safePage <= 1 ? 0.4 : 1,
                  color: "#4C1D95", fontWeight: 800, fontSize: 14,
                }}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: p === safePage ? "none" : "1.5px solid rgba(124,58,237,0.12)",
                    background: p === safePage ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "#fff",
                    color: p === safePage ? "#fff" : "#4C1D95",
                    fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 13,
                    cursor: "pointer",
                    boxShadow: p === safePage ? "0 2px 6px rgba(124,58,237,0.2)" : "none",
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: "1.5px solid rgba(124,58,237,0.12)",
                  background: "#fff", cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                  display: "grid", placeItems: "center",
                  opacity: safePage >= totalPages ? 0.4 : 1,
                  color: "#4C1D95", fontWeight: 800, fontSize: 14,
                }}
              >
                ›
              </button>
            </div>
          )}

          {/* Showing count */}
          <div style={{
            textAlign: "center", marginTop: 10,
            fontSize: 12, fontWeight: 600, color: "#6E5E8A", opacity: 0.6,
          }}>
            Showing {paginated.length} of {filtered.length} student{filtered.length !== 1 ? "s" : ""}
            {filtered.length !== totalCount && ` (filtered from ${totalCount})`}
          </div>
          </>
        )}
      </div>

      {/* Bottom bar with progress + All Done */}
      <div className="school-bottom-bar">
        <div className="school-bottom-bar-inner" style={{ flexDirection: "column", gap: 0 }}>
          <div className="school-progress-track">
            <div className="school-progress-fill" style={{ width: "100%" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <button onClick={() => navigate("/school/administer/grade")} className="school-btn-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <button
              onClick={() => {
                session.reset();
                navigate("/school");
              }}
              disabled={!allDone}
              className="school-btn-next"
            >
              {allDone ? "🎉 All Done — Home" : "Waiting for students…"} <span className="btn-icon">{allDone ? "→" : "⏳"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
