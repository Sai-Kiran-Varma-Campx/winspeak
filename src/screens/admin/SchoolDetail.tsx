import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import BulkImportModal from "@/components/admin/BulkImportModal";
import Spinner from "@/components/Spinner";

const glass = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.12)", borderRadius: 20 } as const;
const input = { padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "rgba(255,255,255,0.6)", color: "#4C1D95", fontSize: 14, fontFamily: "'Poppins', sans-serif", outline: "none", width: "100%" } as const;
const btn = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.2)" } as const;
const btnGhost = { padding: "10px 20px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "transparent", color: "#6E5E8A", cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif" } as const;
const th = { padding: "12px 16px", textAlign: "left" as const, color: "#6E5E8A", fontWeight: 600, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.8 };
const td = { padding: "12px 16px", color: "#4C1D95", fontSize: 13 };
const font = "'Fredoka', 'Sora', sans-serif";

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: "", username: "", password: "", grades: "" });
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  function loadData() {
    if (!id) return;
    Promise.all([
      adminApi.listSchools().then((s) => setSchool(s.find((x: any) => x.id === id))),
      adminApi.listTeachers(id).then(setTeachers),
      adminApi.getSchoolStats(id).then(setStats),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [id]);

  async function removeTeacher(teacherId: string, name: string) {
    if (!confirm(`Remove teacher "${name}"? This will also remove their students and attempt data.`)) return;
    await adminApi.deleteTeacher(teacherId);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
    if (stats) setStats({ ...stats, teachers: Math.max(0, stats.teachers - 1) });
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();
    if (addingTeacher || !id) return;
    setTeacherError("");
    const { name, username, password, grades } = teacherForm;
    if (!name.trim() || !username.trim() || !password.trim()) {
      setTeacherError("Name, username, and password are required");
      return;
    }
    if (username.trim().length < 3) { setTeacherError("Username must be at least 3 characters"); return; }
    if (password.trim().length < 6) { setTeacherError("Password must be at least 6 characters"); return; }
    setAddingTeacher(true);
    try {
      const parsedGrades = grades ? grades.split(",").map((g) => parseInt(g.trim())).filter((g) => g >= 1 && g <= 10) : undefined;
      const created = await adminApi.createTeacher(id, {
        name: name.trim(), username: username.trim(), password: password.trim(), grades: parsedGrades,
      });
      setTeachers((prev) => [{ ...created, studentCount: 0 }, ...prev]);
      setShowAddTeacher(false);
      setTeacherForm({ name: "", username: "", password: "", grades: "" });
      if (stats) setStats({ ...stats, teachers: stats.teachers + 1 });
    } catch (e: any) {
      const msg = e?.message || "Failed";
      const match = msg.match(/API \d+: (.*)/);
      if (match) { try { setTeacherError(JSON.parse(match[1]).error); } catch { setTeacherError(match[1]); } }
      else setTeacherError(msg);
    } finally { setAddingTeacher(false); }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Spinner size={28} /></div>;
  if (!school) return <div style={{ textAlign: "center", padding: 80 }}><p style={{ color: "#F43F5E", fontSize: 16 }}>School not found</p><button onClick={() => navigate("/admin/schools")} style={{ ...btn, marginTop: 12 }}>Go to Schools</button></div>;

  const statCards = [
    { label: "Teachers", value: stats?.teachers ?? 0, icon: "👩‍🏫", color: "#7C3AED" },
    { label: "Students", value: stats?.students ?? 0, icon: "👦", color: "#8B5CF6" },
    { label: "Attempts", value: stats?.attempts ?? 0, icon: "🎯", color: "#A78BFA" },
  ];

  return (
    <div>
      {/* Back button */}
      <button onClick={() => navigate("/admin/schools")}
        style={{ background: "transparent", border: "none", color: "#7C3AED", cursor: "pointer", fontSize: 13, padding: 0, fontFamily: font, fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Back to Schools
      </button>

      {/* School Info Card */}
      <div style={{ ...glass, padding: "24px 28px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
            }}>🏫</div>
            <div>
              <h1 style={{ fontSize: 24, color: "#4C1D95", fontWeight: 700, margin: 0, fontFamily: font }}>{school.name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{
                  padding: "2px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                  background: "rgba(124,58,237,0.1)", color: "#7C3AED",
                }}>{school.code}</span>
                {school.contactEmail && <span style={{ fontSize: 12, color: "#8B7AA8" }}>{school.contactEmail}</span>}
              </div>
            </div>
          </div>
          {school.address && <p style={{ color: "#6E5E8A", fontSize: 13, margin: "8px 0 0 66px" }}>{school.address}</p>}
        </div>

        {/* Stat cards inline */}
        <div style={{ display: "flex", gap: 12 }}>
          {statCards.map((c) => (
            <div key={c.label} style={{
              background: "rgba(255,255,255,0.5)", borderRadius: 14, padding: "14px 18px", minWidth: 100, textAlign: "center",
              border: "1px solid rgba(124,58,237,0.08)",
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.color, fontFamily: font }}>{c.value}</div>
              <div style={{ fontSize: 10, color: "#8B7AA8", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => { setShowAddTeacher(true); setShowBulk(false); }} style={btn}>
          + Add Teacher
        </button>
        <button onClick={() => { setShowBulk(true); setShowAddTeacher(false); }} style={btnGhost}>
          📄 Bulk Import CSV
        </button>
      </div>

      {/* Add Single Teacher Form */}
      {showAddTeacher && (
        <div style={{ ...glass, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: "#4C1D95", margin: 0, fontFamily: font }}>Add Teacher</h3>
            <button onClick={() => { setShowAddTeacher(false); setTeacherError(""); }}
              style={{ background: "transparent", border: "none", color: "#8B7AA8", cursor: "pointer", fontSize: 18, padding: 0 }}>✕</button>
          </div>
          <form onSubmit={handleAddTeacher}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6E5E8A", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name *</label>
                <input placeholder="e.g. Priya Sharma" value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} style={input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6E5E8A", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Username *</label>
                <input placeholder="e.g. priya_s" value={teacherForm.username}
                  onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })} style={input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6E5E8A", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Password *</label>
                <input placeholder="Min 6 characters" value={teacherForm.password}
                  onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} style={input} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6E5E8A", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Grades (optional)</label>
                <input placeholder="e.g. 1,2,3" value={teacherForm.grades}
                  onChange={(e) => setTeacherForm({ ...teacherForm, grades: e.target.value })} style={input} />
              </div>
            </div>
            {teacherError && <p style={{ color: "#F43F5E", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>{teacherError}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={addingTeacher} style={btn}>{addingTeacher ? "Adding..." : "Add Teacher"}</button>
              <button type="button" onClick={() => { setShowAddTeacher(false); setTeacherError(""); }} style={btnGhost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers Table */}
      <div style={{ ...glass, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid rgba(124,58,237,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: "#4C1D95", fontFamily: font, fontSize: 16 }}>
            Teachers <span style={{ color: "#8B7AA8", fontWeight: 400, fontSize: 14 }}>({teachers.length})</span>
          </h3>
        </div>

        {teachers.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>👩‍🏫</div>
            <p style={{ color: "#6E5E8A", fontSize: 15, fontWeight: 500, margin: "0 0 4px", fontFamily: font }}>No teachers yet</p>
            <p style={{ color: "#8B7AA8", fontSize: 13, margin: 0 }}>Click "Add Teacher" or "Bulk Import CSV" to onboard teachers</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.06)" }}>
              <th style={th}>Teacher</th>
              <th style={th}>Username</th>
              <th style={th}>Grades</th>
              <th style={{ ...th, textAlign: "center" }}>Students</th>
              <th style={{ ...th, textAlign: "right" }}>Actions</th>
            </tr></thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.05)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 600, fontSize: 14, fontFamily: font, flexShrink: 0,
                      }}>{(t.name || "T")[0].toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                    </div>
                  </td>
                  <td style={{ ...td, color: "#7C3AED", fontWeight: 600, fontFamily: "'Poppins', monospace" }}>{t.username}</td>
                  <td style={td}>
                    {(t.grades || []).length > 0 ? (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {(t.grades as number[]).map((g: number) => (
                          <span key={g} style={{
                            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: "rgba(124,58,237,0.08)", color: "#7C3AED",
                          }}>{g}</span>
                        ))}
                      </div>
                    ) : <span style={{ color: "#C4B5FD" }}>&mdash;</span>}
                  </td>
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: t.studentCount > 0 ? "rgba(124,58,237,0.08)" : "transparent",
                      color: t.studentCount > 0 ? "#7C3AED" : "#C4B5FD",
                    }}>{t.studentCount}</span>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button onClick={() => removeTeacher(t.id, t.name)}
                      style={{ padding: "5px 14px", borderRadius: 8, border: "1.5px solid rgba(225,29,72,0.15)", background: "transparent", color: "#e11d48", cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk Import Modal */}
      {showBulk && id && (
        <BulkImportModal schoolId={id} onClose={() => setShowBulk(false)}
          onImported={() => { loadData(); }} />
      )}
    </div>
  );
}
