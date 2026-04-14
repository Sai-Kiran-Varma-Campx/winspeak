import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/context/UserStoreContext";
import AddStudentModal from "./AddStudentModal";
import Spinner from "@/components/Spinner";

interface StudentRow {
  id: string;
  fullName: string;
  grade: number;
  section: string | null;
  parentEmail: string | null;
  lastChallengeDate: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Never";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

export default function StudentsList() {
  const store = useStore();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
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
  const PAGE_SIZE = 10;
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<{ fullName: string; studentExternalId: string; grade: number; section: string; parentEmail: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Use teacher's assigned grades, or derive from existing students
  const teacherGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Auto-select first grade when grades load
  useEffect(() => {
    if (gradeFilter === null && teacherGrades.length > 0) {
      setGradeFilter(teacherGrades[0]);
    }
  }, [teacherGrades.length]);

  async function load() {
    setLoading(true);
    try {
      const rows = await api.listStudents();
      setStudents(rows as StudentRow[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) { setImportError("File is empty or has no data rows."); return; }
        // Parse header
        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const nameIdx = header.findIndex((h) => h.includes("name"));
        const rollIdx = header.findIndex((h) => h.includes("roll") || h.includes("id"));
        const gradeIdx = header.findIndex((h) => h.includes("grade"));
        const sectionIdx = header.findIndex((h) => h.includes("section"));
        const emailIdx = header.findIndex((h) => h.includes("email") || h.includes("parent"));

        if (nameIdx === -1) { setImportError("CSV must have a 'Name' column."); return; }
        if (gradeIdx === -1) { setImportError("CSV must have a 'Grade' column."); return; }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          const name = cols[nameIdx] || "";
          const grade = parseInt(cols[gradeIdx]) || 0;
          if (!name || !grade) continue;
          rows.push({
            fullName: name,
            studentExternalId: rollIdx >= 0 ? (cols[rollIdx] || "") : "",
            grade,
            section: sectionIdx >= 0 ? (cols[sectionIdx] || "") : "",
            parentEmail: emailIdx >= 0 ? (cols[emailIdx] || "") : "",
          });
        }
        if (rows.length === 0) { setImportError("No valid student rows found."); return; }
        setImportData(rows);
        setShowImport(true);
      } catch { setImportError("Failed to parse CSV file."); }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-selected
    e.target.value = "";
  }

  async function confirmImport() {
    setImporting(true);
    setImportError("");
    try {
      for (const s of importData) {
        await api.createStudent({
          fullName: s.fullName,
          studentExternalId: s.studentExternalId || null,
          grade: s.grade,
          section: s.section || null,
          parentEmail: s.parentEmail || null,
        });
      }
      setShowImport(false);
      setImportData([]);
      load();
    } catch (err: any) {
      setImportError(err?.message || "Failed to import students.");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    const csv = "Full Name,Roll Number,Grade,Section,Parent Email\nJohn Doe,1,2,A,parent@example.com\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = students.filter((s) => {
    if (gradeFilter && s.grade !== gradeFilter) return false;
    if (search && !s.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, gradeFilter]);

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
        <div>
          <h1 style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 28, fontWeight: 500, color: "#4C1D95", margin: 0 }}>Students</h1>
          <p style={{ color: "#6E5E8A", fontSize: 14, fontWeight: 500, margin: 0, marginTop: 2 }}>View and manage your student roster</p>
        </div>
      </div>

      {/* Search + Grade filter + Add */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        maxWidth: 900, marginBottom: 24, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 140, position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
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
        <div ref={gradeDropRef} style={{ position: "relative" }}>
          <div
            onClick={() => setGradeDropOpen((p) => !p)}
            style={{
              padding: "12px 40px 12px 24px", borderRadius: 30,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 15,
              color: "#fff", cursor: "pointer", minWidth: 140,
              userSelect: "none",
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
              transition: "all 0.3s ease",
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
        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: "none" }} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            padding: "12px 24px", borderRadius: 30,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 15,
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            transition: "all 0.3s ease", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
            <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
          </svg>
          Import
        </button>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: "12px 24px", borderRadius: 30,
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500, fontSize: 15,
            boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            transition: "all 0.3s ease", flexShrink: 0,
          }}
        >
          + Add Student
        </button>
      </div>

      {/* Student list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size={28} />
        </div>
      ) : students.length === 0 ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.12) 100%)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          border: "1.5px solid rgba(124, 58, 237, 0.25)",
          boxShadow: "0 4px 15px rgba(124, 58, 237, 0.08)",
          borderRadius: 24, padding: "48px 32px", textAlign: "center", maxWidth: 500,
        }}>
          <div style={{ fontSize: 48, marginBottom: 15 }}>&#128102;</div>
          <h3 style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 22, fontWeight: 500, color: "#4C1D95", marginBottom: 8,
          }}>No students yet</h3>
          <p style={{ color: "#6E5E8A", fontSize: 15, fontWeight: 500, marginBottom: 24 }}>
            Add your first student to start running challenges.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "14px 36px", borderRadius: 30,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              border: "none", color: "#fff", cursor: "pointer",
              fontWeight: 500, fontSize: 16,
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            Add First Student
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
            display: "grid", gridTemplateColumns: "1fr 0.6fr 0.6fr 0.8fr",
            gap: 12, padding: "14px 24px",
            background: "rgba(124,58,237,0.06)",
            borderBottom: "1px solid rgba(124,58,237,0.1)",
          }}>
            {["Student", "Grade", "Section", "Last Active"].map((h) => (
              <div key={h} style={{
                fontSize: 11, fontWeight: 500, color: "#4C1D95",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {paginated.map((s, idx) => (
            <div
              key={s.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 0.6fr 0.6fr 0.8fr",
                gap: 12, padding: "14px 24px", alignItems: "center",
                borderBottom: idx < paginated.length - 1 ? "1px solid rgba(124,58,237,0.06)" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.04)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 500, fontSize: 16,
                  fontFamily: "'Fredoka', 'Sora', sans-serif", flexShrink: 0,
                }}>
                  {s.fullName.charAt(0).toUpperCase()}
                </div>
                <div style={{
                  fontFamily: "'Fredoka', 'Sora', sans-serif",
                  fontWeight: 500, fontSize: 15, color: "#4C1D95",
                }}>{s.fullName}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#4C1D95" }}>
                Grade {s.grade}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#6E5E8A" }}>
                {s.section || "—"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#6E5E8A" }}>
                {fmtDate(s.lastChallengeDate)}
              </div>
            </div>
          ))}
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
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </div>
      )}

      {showAdd && (
        <AddStudentModal
          teacherGrades={store.grades}
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load(); }}
        />
      )}

      {/* Import preview modal */}
      {showImport && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, background: "rgba(76,29,149,0.25)",
          }}
          onClick={() => { setShowImport(false); setImportData([]); setImportError(""); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 24, padding: "24px",
              width: "100%", maxWidth: 560, maxHeight: "80vh", overflow: "auto",
              border: "1.5px solid rgba(124,58,237,0.15)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 20, fontWeight: 500, color: "#4C1D95" }}>
                Import Students
              </div>
              <button
                onClick={() => { setShowImport(false); setImportData([]); setImportError(""); }}
                style={{ width: 32, height: 32, borderRadius: 10, border: "1.5px solid rgba(124,58,237,0.12)", background: "#fff", cursor: "pointer", display: "grid", placeItems: "center", color: "#6E5E8A", fontSize: 16 }}
              >×</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 500, color: "#6E5E8A", marginBottom: 16 }}>
              {importData.length} student{importData.length !== 1 ? "s" : ""} found in file. Review and confirm:
            </div>

            {/* Preview table */}
            <div style={{ borderRadius: 14, border: "1px solid rgba(124,58,237,0.12)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{
                display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.5fr 0.5fr",
                gap: 8, padding: "10px 14px",
                background: "rgba(124,58,237,0.06)",
                fontSize: 10, fontWeight: 500, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                <div>Name</div><div>Roll</div><div>Grade</div><div>Section</div>
              </div>
              {importData.slice(0, 20).map((s, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1.5fr 0.5fr 0.5fr 0.5fr",
                  gap: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, color: "#4C1D95",
                  borderTop: "1px solid rgba(124,58,237,0.06)",
                }}>
                  <div style={{ fontWeight: 500 }}>{s.fullName}</div>
                  <div>{s.studentExternalId || "—"}</div>
                  <div>{s.grade}</div>
                  <div>{s.section || "—"}</div>
                </div>
              ))}
              {importData.length > 20 && (
                <div style={{ padding: "8px 14px", fontSize: 12, fontWeight: 500, color: "#6E5E8A", textAlign: "center" }}>
                  ...and {importData.length - 20} more
                </div>
              )}
            </div>

            {importError && (
              <div style={{ fontSize: 12, fontWeight: 500, color: "#F43F5E", marginBottom: 12 }}>{importError}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowImport(false); setImportData([]); setImportError(""); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 500,
                  background: "#fff", border: "1.5px solid rgba(124,58,237,0.15)", color: "#4C1D95",
                  cursor: "pointer", fontFamily: "'Fredoka', 'Sora', sans-serif",
                }}
              >Cancel</button>
              <button
                onClick={confirmImport}
                disabled={importing}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 500,
                  background: "linear-gradient(135deg, #7C3AED, #A78BFA)", border: "none", color: "#fff",
                  cursor: importing ? "default" : "pointer", opacity: importing ? 0.7 : 1,
                  fontFamily: "'Fredoka', 'Sora', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {importing ? <><Spinner size={14} color="#fff" /> Importing...</> : `Import ${importData.length} Students`}
              </button>
            </div>

            <button
              onClick={downloadTemplate}
              style={{
                marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 10,
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: "#7C3AED", textDecoration: "underline",
              }}
            >
              Download CSV template
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
