import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import BulkImportModal from "@/components/admin/BulkImportModal";
import Spinner from "@/components/Spinner";

const card = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.12)", borderRadius: 16 } as const;
const btn = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.2)" } as const;
const th = { padding: "10px 14px", textAlign: "left" as const, color: "#6E5E8A", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const };
const td = { padding: "10px 14px", color: "#4C1D95", fontSize: 13 };

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [tab, setTab] = useState<"teachers" | "stats">("teachers");

  function loadData() {
    if (!id) return;
    Promise.all([
      adminApi.listSchools().then((s) => setSchool(s.find((x: any) => x.id === id))),
      adminApi.listTeachers(id).then(setTeachers),
      adminApi.getSchoolStats(id).then(setStats),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [id]);

  async function removeTeacher(teacherId: string) {
    if (!confirm("Remove this teacher?")) return;
    await adminApi.deleteTeacher(teacherId);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;
  if (!school) return <p style={{ color: "#F43F5E" }}>School not found</p>;

  return (
    <div>
      <button onClick={() => navigate("/admin/schools")}
        style={{ background: "transparent", border: "none", color: "#7C3AED", cursor: "pointer", fontSize: 13, marginBottom: 12, padding: 0, fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500 }}>
        &larr; Back to Schools
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, color: "#4C1D95", fontWeight: 700, margin: 0, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>{school.name}</h1>
        <p style={{ color: "#7C3AED", fontSize: 14, margin: "4px 0", fontWeight: 600 }}>Code: {school.code}</p>
        {school.address && <p style={{ color: "#6E5E8A", fontSize: 13, margin: 0 }}>{school.address}</p>}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["teachers", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: 10, border: "none", fontSize: 13, cursor: "pointer",
            fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
            background: tab === t ? "linear-gradient(135deg, #7C3AED, #A78BFA)" : "rgba(255,255,255,0.5)",
            color: tab === t ? "#fff" : "#6E5E8A",
            boxShadow: tab === t ? "0 4px 16px rgba(124,58,237,0.2)" : "none",
          }}>
            {t === "teachers" ? "Teachers" : "Stats"}
          </button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowBulk(true)} style={btn}>Bulk Import CSV</button>
          </div>

          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
                <th style={th}>Name</th><th style={th}>Username</th><th style={th}>Grades</th>
                <th style={{ ...th, textAlign: "center" }}>Students</th><th style={{ ...th, textAlign: "right" }}>Actions</th>
              </tr></thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.06)" }}>
                    <td style={td}>{t.name}</td>
                    <td style={{ ...td, color: "#7C3AED", fontWeight: 600 }}>{t.username}</td>
                    <td style={{ ...td, color: "#8B7AA8" }}>{(t.grades || []).join(", ") || "\u2014"}</td>
                    <td style={{ ...td, textAlign: "center" }}>{t.studentCount}</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <button onClick={() => removeTeacher(t.id)}
                        style={{ padding: "4px 12px", borderRadius: 8, border: "1.5px solid rgba(244,63,94,0.2)", background: "transparent", color: "#e11d48", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: "#8B7AA8" }}>No teachers yet</td></tr>}
              </tbody>
            </table>
          </div>

          {showBulk && id && (
            <BulkImportModal schoolId={id} onClose={() => setShowBulk(false)}
              onImported={() => { if (id) adminApi.listTeachers(id).then(setTeachers); }} />
          )}
        </>
      )}

      {tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Teachers", value: stats.teachers, color: "#7C3AED" },
            { label: "Students", value: stats.students, color: "#8B5CF6" },
            { label: "Attempts", value: stats.attempts, color: "#A78BFA" },
          ].map((c) => (
            <div key={c.label} style={{ ...card, padding: "20px 18px" }}>
              <div style={{ fontSize: 12, color: "#6E5E8A", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
