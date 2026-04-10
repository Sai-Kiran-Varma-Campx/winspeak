import { useEffect, useState } from "react";
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

  const filtered = students.filter((s) => {
    if (search && !s.fullName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="school-page-container">
      {/* Header */}
      <div className="school-page-header">
        <h1>Students</h1>
        <p>View and manage your student roster</p>
      </div>

      {/* Search + Add */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        maxWidth: 900, marginBottom: 24, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
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
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: "12px 24px", borderRadius: 30,
            background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
            border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "'Nunito', 'Poppins', sans-serif", fontWeight: 700, fontSize: 15,
            boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
            transition: "all 0.3s ease", flexShrink: 0,
          }}
        >
          + Add Student
        </button>
      </div>

      {/* Student cards */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner size={28} />
        </div>
      ) : students.length === 0 ? (
        <div className="school-glass" style={{ padding: "48px 32px", textAlign: "center", maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 15 }}>&#128102;</div>
          <h3 style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            fontSize: 22, fontWeight: 700, color: "#2d1b69", marginBottom: 8,
          }}>No students yet</h3>
          <p style={{ color: "#5a3e8a", fontSize: 15, fontWeight: 600, marginBottom: 24 }}>
            Add your first student to start running challenges.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "14px 36px", borderRadius: 30,
              background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)",
              border: "none", color: "#fff", cursor: "pointer",
              fontWeight: 700, fontSize: 16,
              boxShadow: "0 4px 15px rgba(255, 107, 53, 0.4)",
            }}
          >
            Add First Student
          </button>
        </div>
      ) : (
        <div className="school-page-cards">
          {filtered.map((s) => (
            <div key={s.id} className="school-glass-card" style={{ padding: 24, textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(106,47,160,0.2), rgba(255,107,53,0.2))",
                display: "grid", placeItems: "center", margin: "0 auto 12px",
                fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 24, fontWeight: 700,
                color: "#4a1a7a",
              }}>
                {s.fullName.charAt(0).toUpperCase()}
              </div>
              <h3 style={{
                fontFamily: "'Fredoka', 'Sora', sans-serif",
                fontSize: 18, fontWeight: 600, color: "#2d1b69", marginBottom: 4,
              }}>{s.fullName}</h3>
              <p style={{ color: "#5a3e8a", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Grade {s.grade}{s.section ? `-${s.section}` : ""}
              </p>
              <p style={{ color: "#7a5eaa", fontSize: 12, fontWeight: 500 }}>
                Last active: {fmtDate(s.lastChallengeDate)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{
          textAlign: "center", marginTop: 20,
          fontSize: 13, fontWeight: 600, color: "#5a3e8a", opacity: 0.7,
        }}>
          Showing {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""}
        </div>
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
