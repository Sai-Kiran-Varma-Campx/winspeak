import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useStore } from "@/context/UserStoreContext";
import Spinner from "@/components/Spinner";
import AddStudentModal from "./AddStudentModal";

interface StudentRow {
  id: string;
  fullName: string;
  grade: number;
  section: string | null;
  parentEmail: string | null;
  lastChallengeDate: string | null;
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
  categoryId: string;
  grade: number;
  sections: string[];
  totalStudents: number;
  completedStudents: number;
  latestDate: string;
}

function aggregateChallenges(students: StudentRow[], attempts: AttemptRow[]): ChallengeRow[] {
  const map = new Map<string, { questionId: string; questionTitle: string; categoryId: string; grade: number; studentIds: Set<string>; latestDate: string }>();
  for (const a of attempts) {
    const key = `${a.grade}::${a.questionId}`;
    if (!map.has(key)) {
      map.set(key, { questionId: a.questionId, questionTitle: a.questionTitle, categoryId: a.categoryId, grade: a.grade, studentIds: new Set(), latestDate: a.createdAt });
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
      categoryId: e.categoryId,
      grade: e.grade,
      sections,
      totalStudents: gradeStudents.length,
      completedStudents: e.studentIds.size,
      latestDate: e.latestDate,
    });
  }
  return rows.sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

export default function TeacherHome() {
  const navigate = useNavigate();
  const store = useStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [gradeDropOpen, setGradeDropOpen] = useState(false);
  const gradeDropRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!gradeDropOpen) return;
    function handleClick(e: MouseEvent) {
      if (gradeDropRef.current && !gradeDropRef.current.contains(e.target as Node)) setGradeDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [gradeDropOpen]);

  const teacherGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  async function load() {
    setLoading(true);
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
  }

  useEffect(() => { load(); }, []);

  const challengeRows = aggregateChallenges(students, attempts);
  const totalAttempts = attempts.length;
  const activeStudentIds = new Set(attempts.map((a) => a.studentId));
  const pendingStudents = students.filter((s) => !activeStudentIds.has(s.id)).length;

  // Auto-select first grade
  useEffect(() => {
    if (gradeFilter === null && teacherGrades.length > 0) setGradeFilter(teacherGrades[0]);
  }, [teacherGrades.length]);

  // Filter by grade + search
  const filteredRows = challengeRows.filter((r) => {
    if (gradeFilter && r.grade !== gradeFilter) return false;
    if (search && !r.questionTitle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [gradeFilter, search]);

  return (
    <div className="school-page-container">
      {/* Greeting */}
      <div className="school-glass" style={{
        width: "100%",
        maxWidth: 900,
        marginBottom: 30,
        padding: "28px 36px",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        <div className="home-icon-float" style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, color: "white", fontFamily: "'Fredoka', sans-serif",
          fontWeight: 500, flexShrink: 0,
          boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
        }}>
          {store.name?.charAt(0)?.toUpperCase() || "T"}
        </div>
        <div>
          <p style={{
            fontSize: 16,
            fontWeight: 500,
            color: "#4C1D95",
            marginBottom: 4,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Welcome back,
          </p>
          <h1 style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 32,
            fontWeight: 500,
            color: "#4C1D95",
            lineHeight: 1.2,
            margin: 0,
          }}>
            {store.name}
          </h1>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 14, color: "#6E5E8A", fontFamily: "'Poppins', sans-serif", textAlign: "right" }}>
          <div style={{ fontWeight: 500 }}>{new Date().toLocaleDateString("en-US", { weekday: "long" })}</div>
          <div style={{ fontSize: 12 }}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Spinner size={28} />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="school-page-cards" style={{ marginBottom: 30, width: "100%", maxWidth: 900 }}>
            <div className="school-glass-card" style={{ padding: 30, textAlign: "center" }}>
              <div className="home-icon home-icon-float">
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
                  <circle cx="16" cy="16" r="8" fill="#DDD6FE" />
                  <circle cx="13.5" cy="15" r="1.2" fill="#4C1D95" />
                  <circle cx="18.5" cy="15" r="1.2" fill="#4C1D95" />
                  <path d="M13.5 19 Q16 21.5 18.5 19" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  <path d="M10 32 Q10 25 16 25 Q22 25 22 32 L23 40 L9 40Z" fill="#7C3AED" />
                  <circle cx="34" cy="16" r="8" fill="#C4B5FD" />
                  <circle cx="31.5" cy="15" r="1.2" fill="#4C1D95" />
                  <circle cx="36.5" cy="15" r="1.2" fill="#4C1D95" />
                  <path d="M31.5 19 Q34 21.5 36.5 19" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  <path d="M28 32 Q28 25 34 25 Q40 25 40 32 L41 40 L27 40Z" fill="#8B5CF6" />
                  <circle cx="28" cy="10" r="2.5" fill="#A78BFA" />
                  <circle cx="40" cy="10" r="2.5" fill="#A78BFA" />
                </svg>
              </div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
              }}>Total Students</h3>
              <p style={{ color: "#6E5E8A", fontSize: 14, fontWeight: 500, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
                {students.length} student{students.length !== 1 ? "s" : ""} enrolled
              </p>
            </div>
            <div className="school-glass-card" style={{ padding: 30, textAlign: "center" }}>
              <div className="home-icon home-icon-pulse">
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="8" width="32" height="36" rx="4" fill="#EDE9FE" stroke="#C4B5FD" strokeWidth="1.5" />
                  <rect x="16" y="4" width="16" height="8" rx="3" fill="#7C3AED" />
                  <path d="M24 18 L26 23 L31 23.5 L27 27 L28.5 32 L24 29 L19.5 32 L21 27 L17 23.5 L22 23Z" fill="#A78BFA" />
                  <line x1="14" y1="36" x2="34" y2="36" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
                  <line x1="14" y1="40" x2="28" y2="40" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
              }}>Challenges Done</h3>
              <p style={{ color: "#6E5E8A", fontSize: 14, fontWeight: 500, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
                {totalAttempts} attempt{totalAttempts !== 1 ? "s" : ""} completed
              </p>
            </div>
            <div className="school-glass-card" style={{ padding: 30, textAlign: "center" }}>
              <div className="home-icon home-icon-bounce">
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none">
                  <circle cx="16" cy="16" r="8" fill="#DDD6FE" />
                  <circle cx="13.5" cy="15" r="1.2" fill="#4C1D95" />
                  <circle cx="18.5" cy="15" r="1.2" fill="#4C1D95" />
                  <path d="M14 18 Q16 16 18 18" stroke="#4C1D95" strokeWidth="1" strokeLinecap="round" fill="none" />
                  <path d="M10 32 Q10 25 16 25 Q22 25 22 32 L23 40 L9 40Z" fill="#A78BFA" />
                  <circle cx="34" cy="16" r="8" fill="#C4B5FD" />
                  <circle cx="31.5" cy="15" r="1.2" fill="#4C1D95" />
                  <circle cx="36.5" cy="15" r="1.2" fill="#4C1D95" />
                  <path d="M32 18 Q34 16 36 18" stroke="#4C1D95" strokeWidth="1" strokeLinecap="round" fill="none" />
                  <path d="M28 32 Q28 25 34 25 Q40 25 40 32 L41 40 L27 40Z" fill="#7C3AED" />
                  <circle cx="40" cy="38" r="7" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
                  <path d="M37.5 38h5M40 35.5v5" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round">
                    <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
                  </path>
                </svg>
              </div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
              }}>Pending Students</h3>
              <p style={{ color: "#6E5E8A", fontSize: 14, fontWeight: 500, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
                {pendingStudents === 0 ? "All students have participated!" : `${pendingStudents} student${pendingStudents !== 1 ? "s" : ""} yet to start`}
              </p>
            </div>
          </div>

          {/* Action cards — kid-friendly */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 30,
            width: "100%",
            maxWidth: 900,
          }}>
            {/* Add Student — playful purple */}
            <button
              onClick={() => setShowAdd(true)}
              className="kid-action-btn"
              style={{
                position: "relative",
                padding: "26px 24px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: "linear-gradient(135deg, #F5F3FF 0%, #DDD6FE 100%)",
                border: "3px solid #A78BFA",
                borderRadius: 28,
                textAlign: "left",
                boxShadow: "0 6px 0 #7C3AED, 0 10px 20px rgba(124,58,237,0.2)",
                transition: "all 0.18s cubic-bezier(.34,1.56,.64,1)",
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                overflow: "hidden",
              }}
            >
              {/* Illustrated character circle */}
              <div style={{
                position: "relative", flexShrink: 0,
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 0 #6D28D9, inset 0 2px 0 rgba(255,255,255,0.3)",
                border: "3px solid #fff",
              }}>
                <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                  {/* Head */}
                  <circle cx="32" cy="24" r="11" fill="#EDE9FE" stroke="#4C1D95" strokeWidth="1.6"/>
                  {/* Hair tuft */}
                  <path d="M24 18 Q26 12 32 12 Q38 12 40 18 Q36 16 32 16 Q28 16 24 18Z" fill="#4C1D95"/>
                  {/* Eyes */}
                  <circle cx="28.5" cy="24" r="1.6" fill="#4C1D95"/>
                  <circle cx="35.5" cy="24" r="1.6" fill="#4C1D95"/>
                  <circle cx="29" cy="23.4" r="0.5" fill="#fff"/>
                  <circle cx="36" cy="23.4" r="0.5" fill="#fff"/>
                  {/* Smile */}
                  <path d="M28 28 Q32 31 36 28" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  {/* Cheeks */}
                  <circle cx="25" cy="27" r="1.6" fill="#FCA5A5" opacity="0.7"/>
                  <circle cx="39" cy="27" r="1.6" fill="#FCA5A5" opacity="0.7"/>
                  {/* Body */}
                  <path d="M18 48 Q18 37 32 37 Q46 37 46 48 L48 56 L16 56Z" fill="#7C3AED"/>
                  {/* Collar */}
                  <path d="M28 38 L32 42 L36 38" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                </svg>
                {/* Plus badge */}
                <div style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#4C1D95",
                  border: "3px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 0 #3B0764",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{
                  fontSize: 22, fontWeight: 500, color: "#4C1D95",
                  lineHeight: 1.1, marginBottom: 4,
                }}>
                  Add a Student
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#6D28D9" }}>
                  Welcome a new friend to class! 🎉
                </div>
              </div>
            </button>

            {/* Administer Challenge — playful pink-purple */}
            <button
              onClick={() => navigate("/school/administer")}
              className="kid-action-btn"
              style={{
                position: "relative",
                padding: "26px 24px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                border: "3px solid #A78BFA",
                borderRadius: 28,
                textAlign: "left",
                boxShadow: "0 6px 0 #7C3AED, 0 10px 20px rgba(124,58,237,0.2)",
                transition: "all 0.18s cubic-bezier(.34,1.56,.64,1)",
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                overflow: "hidden",
              }}
            >
              {/* Microphone character circle */}
              <div style={{
                position: "relative", flexShrink: 0,
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 0 #6D28D9, inset 0 2px 0 rgba(255,255,255,0.3)",
                border: "3px solid #fff",
              }}>
                <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                  {/* Mic body */}
                  <rect x="24" y="14" width="16" height="26" rx="8" fill="#EDE9FE" stroke="#4C1D95" strokeWidth="1.6"/>
                  {/* Mic grill lines */}
                  <line x1="28" y1="20" x2="36" y2="20" stroke="#4C1D95" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="28" y1="24" x2="36" y2="24" stroke="#4C1D95" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="28" y1="28" x2="36" y2="28" stroke="#4C1D95" strokeWidth="1" strokeLinecap="round"/>
                  {/* Mic face */}
                  <circle cx="29" cy="33" r="1.2" fill="#4C1D95"/>
                  <circle cx="35" cy="33" r="1.2" fill="#4C1D95"/>
                  <path d="M29 36 Q32 38 35 36" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  {/* Stand */}
                  <path d="M20 40 Q20 48 32 48 Q44 48 44 40" stroke="#4C1D95" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
                  <line x1="32" y1="48" x2="32" y2="54" stroke="#4C1D95" strokeWidth="2.4" strokeLinecap="round"/>
                  <line x1="25" y1="54" x2="39" y2="54" stroke="#4C1D95" strokeWidth="2.4" strokeLinecap="round"/>
                  {/* Sound waves */}
                  <path d="M14 22 Q10 27 14 32" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.4s" repeatCount="indefinite"/>
                  </path>
                  <path d="M50 22 Q54 27 50 32" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.4s" repeatCount="indefinite"/>
                  </path>
                </svg>
                {/* Play badge */}
                <div style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#4C1D95",
                  border: "3px solid #fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 0 #3B0764",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                    <polygon points="7 4 20 12 7 20 7 4"/>
                  </svg>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{
                  fontSize: 22, fontWeight: 500, color: "#4C1D95",
                  lineHeight: 1.1, marginBottom: 4,
                }}>
                  Start Challenge
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#6D28D9" }}>
                  Let's hear your kids speak! 🚀
                </div>
              </div>
            </button>
          </div>

          <style>{`
            .kid-action-btn:hover {
              transform: translateY(-4px) scale(1.01);
            }
            .kid-action-btn:active {
              transform: translateY(2px) scale(0.99);
              box-shadow: 0 2px 0 currentColor !important;
            }
          `}</style>

          {/* Search + Grade filter */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            maxWidth: 900, marginBottom: 16,
          }}>
            <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges..."
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

          {/* Challenges list */}
          {filteredRows.length > 0 && (
            <div style={{
              width: "100%", maxWidth: 900, overflow: "hidden",
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
              border: "1.5px solid rgba(124, 58, 237, 0.25)",
              borderRadius: 20, padding: 0,
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

              {paginatedRows.map((r, idx) => {
                const pct = r.totalStudents > 0 ? Math.round((r.completedStudents / r.totalStudents) * 100) : 0;
                return (
                  <div
                    key={`${r.grade}-${r.questionId}`}
                    style={{
                      display: "grid", gridTemplateColumns: "1.6fr 0.9fr 0.9fr",
                      gap: 12, padding: "16px 24px", alignItems: "center",
                      borderBottom: idx < paginatedRows.length - 1 ? "1px solid rgba(124,58,237,0.06)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Challenge name + grade/sections */}
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

                    {/* Progress bar + count */}
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

                    {/* View Class Report button */}
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
          {filteredRows.length > 0 && totalPages > 1 && (
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

          {filteredRows.length > 0 && (
            <div style={{
              textAlign: "center", marginTop: 10,
              fontSize: 13, fontWeight: 500, color: "#6E5E8A", opacity: 0.7,
            }}>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} challenge{filteredRows.length !== 1 ? "s" : ""}
            </div>
          )}

          {filteredRows.length === 0 && challengeRows.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 20,
              padding: 40, textAlign: "center", width: "100%", maxWidth: 900,
            }}>
              <p style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 16, fontWeight: 500, color: "#6E5E8A" }}>
                No challenges run for Grade {gradeFilter} yet
              </p>
            </div>
          )}

          {challengeRows.length === 0 && (
            <div className="school-glass-card" style={{
              padding: 40, textAlign: "center", width: "100%", maxWidth: 900,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>&#128218;</div>
              <p style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 20, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
              }}>No challenges yet</p>
              <p style={{ color: "#6E5E8A", fontSize: 14, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
                Run your first speaking challenge to see class reports here.
              </p>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <AddStudentModal
          teacherGrades={store.grades}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}
