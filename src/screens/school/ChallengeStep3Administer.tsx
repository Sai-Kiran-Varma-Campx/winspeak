import { useEffect, useMemo, useState } from "react";
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
  const [page, setPage] = useState(1);

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
        const rows = (await api.listStudents(session.selectedGrade!)) as StudentRow[];
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

  const avatarColors = [
    "bg-[#FED7AA] border-[#FDBA74] text-[#EA580C]",
    "bg-[#FCE7F3] border-[#F9A8D4] text-[#DB2777]",
    "bg-[#FEF3C7] border-[#FCD34D] text-[#D97706]",
    "bg-[#CCFBF1] border-[#5EEAD4] text-[#0D9488]"
  ];

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 pb-48">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-block px-3 py-1 mb-3 rounded-full bg-[#FEF2E8] border-[1.5px] border-[rgba(124,45,18,0.12)] text-[11px] font-black tracking-widest text-[#A8603C] uppercase">
          STEP 3 OF 3
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif" }} className="font-black text-[36px] tracking-[-0.02em] text-[#7C2D12]">Administer to Class</h1>

        {q && (() => {
          const cat = session.selectedCategory ? getSchoolCategory(session.selectedCategory) : null;
          return (
            <div className="bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] rounded-[22px] p-5 mt-5 shadow-[0_2px_0_rgba(42,31,26,0.06)] relative overflow-hidden">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                {cat && (
                  <>
                    <span style={{
                      fontSize: 20, width: 32, height: 32, borderRadius: 10,
                      background: "#fff", border: "1.5px solid #FCD34D",
                      display: "inline-grid", placeItems: "center",
                    }}>{cat.emoji}</span>
                    <span className="text-[13px] font-black text-[#92400E]">{cat.title}</span>
                    <span style={{ color: "#D97706", fontSize: 13, fontWeight: 600 }}>·</span>
                  </>
                )}
                {session.selectedGrade != null && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "2px 10px",
                    borderRadius: 999, background: "#FED7AA",
                    border: "1px solid #FDBA74", color: "#92400E",
                  }}>
                    Grade {session.selectedGrade}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "'Sora', sans-serif" }} className="text-[17px] font-black text-[#7C2D12] mb-1">{q.title}</div>
              <div className="text-[14px] font-medium text-[#A8603C] leading-snug">{q.prompt}</div>
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
          <div className="bg-[white] border-[1.5px] border-[rgba(124,45,18,0.12)] p-8 text-center shadow-[0_2px_0_rgba(42,31,26,0.06)] rounded-[24px]">
            <div className="text-[36px] mb-3">👥</div>
            <div style={{ fontFamily: "'Sora', sans-serif" }} className="text-[20px] font-black text-[#7C2D12] mb-2">No students in Grade {session.selectedGrade}</div>
            <div className="text-[14px] font-semibold text-[#A8603C]">
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
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                style={{
                  width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12,
                  border: "1.5px solid rgba(124,45,18,0.12)", background: "#fff",
                  fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500,
                  color: "#7C2D12", outline: "none",
                }}
              />
            </div>

            {/* Status filter dropdown */}
            <div style={{ position: "relative" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "done")}
                style={{
                  appearance: "none",
                  padding: "10px 36px 10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid rgba(124,45,18,0.12)",
                  background: "#fff",
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  color: "#7C2D12",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: 150,
                }}
              >
                <option value="all">All Students ({totalCount})</option>
                <option value="pending">Pending ({totalCount - doneCount})</option>
                <option value="done">Completed ({doneCount})</option>
              </select>
              <svg style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8603C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div style={{
            background: "#fff", border: "1.5px solid rgba(124,45,18,0.1)",
            borderRadius: 22, overflow: "hidden",
            boxShadow: "0 2px 0 rgba(124,45,18,0.04), 0 8px 24px -16px rgba(124,45,18,0.1)",
          }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 120px 100px",
              padding: "12px 20px", gap: 12,
              background: "#FED7AA", borderBottom: "1.5px solid #FDBA74",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em" }}>Student</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Status</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Action</div>
            </div>

            {/* Table rows */}
            {paginated.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 14, color: "#7C2D12" }}>No students match</div>
                <div style={{ fontSize: 12, color: "#A8603C", marginTop: 2 }}>Try a different search or filter.</div>
              </div>
            ) : paginated.map((s, idx) => {
              const status = session.studentStatus[s.id] ?? "pending";
              const avatarStyle = [
                { bg: "#FED7AA", bd: "#FDBA74", text: "#EA580C" },
                { bg: "#FCE7F3", bd: "#F9A8D4", text: "#DB2777" },
                { bg: "#FEF3C7", bd: "#FCD34D", text: "#D97706" },
                { bg: "#CCFBF1", bd: "#5EEAD4", text: "#0D9488" },
              ][idx % 4];

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 100px",
                    padding: "14px 20px", gap: 12,
                    alignItems: "center",
                    borderBottom: idx < paginated.length - 1 ? "1px solid rgba(124,45,18,0.06)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#FFF8F3"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* Student name + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      display: "grid", placeItems: "center",
                      fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 17,
                      background: avatarStyle.bg, border: `1.5px solid ${avatarStyle.bd}`,
                      color: avatarStyle.text, flexShrink: 0,
                    }}>
                      {s.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: "'Sora', sans-serif", fontWeight: 700,
                        fontSize: 15, color: "#7C2D12",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>{s.fullName}</div>
                      <div style={{ fontSize: 11, color: "#A8603C", fontWeight: 500 }}>
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
                        background: "#FEF3C7", border: "1px solid #FCD34D",
                        fontSize: 12, fontWeight: 700, color: "#B45309",
                      }}>
                        ● In Progress
                      </span>
                    ) : (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 12px", borderRadius: 999,
                        background: "#FEF2E8", border: "1px solid rgba(124,45,18,0.12)",
                        fontSize: 12, fontWeight: 700, color: "#A8603C",
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
                          padding: "7px 14px", borderRadius: 12,
                          background: "#fff",
                          border: "1.5px solid #FDBA74",
                          color: "#EA580C",
                          fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        🔄 Retry
                      </button>
                    ) : (
                      <button
                        onClick={() => startStudent(s)}
                        style={{
                          padding: "7px 18px", borderRadius: 12,
                          background: "linear-gradient(135deg, #EA580C, #DB2777)",
                          border: "none", color: "#fff",
                          fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13,
                          cursor: "pointer",
                          boxShadow: "0 2px 0 #B7350F",
                          transition: "all 0.15s ease",
                        }}
                      >
                        ▶ Start
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
                  border: "1.5px solid rgba(124,45,18,0.12)",
                  background: "#fff", cursor: safePage <= 1 ? "not-allowed" : "pointer",
                  display: "grid", placeItems: "center",
                  opacity: safePage <= 1 ? 0.4 : 1,
                  color: "#7C2D12", fontWeight: 800, fontSize: 14,
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
                    border: p === safePage ? "none" : "1.5px solid rgba(124,45,18,0.12)",
                    background: p === safePage ? "linear-gradient(135deg, #EA580C, #DB2777)" : "#fff",
                    color: p === safePage ? "#fff" : "#7C2D12",
                    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13,
                    cursor: "pointer",
                    boxShadow: p === safePage ? "0 2px 6px rgba(234,88,12,0.2)" : "none",
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
                  border: "1.5px solid rgba(124,45,18,0.12)",
                  background: "#fff", cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                  display: "grid", placeItems: "center",
                  opacity: safePage >= totalPages ? 0.4 : 1,
                  color: "#7C2D12", fontWeight: 800, fontSize: 14,
                }}
              >
                ›
              </button>
            </div>
          )}

          {/* Showing count */}
          <div style={{
            textAlign: "center", marginTop: 10,
            fontSize: 12, fontWeight: 600, color: "#A8603C", opacity: 0.6,
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
            <button onClick={() => navigate(-1)} className="school-btn-back">
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
