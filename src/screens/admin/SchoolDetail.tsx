import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import BulkImportModal from "@/components/admin/BulkImportModal";
import Spinner from "@/components/Spinner";

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
  if (!school) return <p style={{ color: "#f43f5e" }}>School not found</p>;

  return (
    <div>
      <button onClick={() => navigate("/admin/schools")}
        style={{ background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, marginBottom: 12, padding: 0 }}>
        ← Back to Schools
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, margin: 0 }}>{school.name}</h1>
        <p style={{ color: "#6366f1", fontSize: 14, margin: "4px 0" }}>Code: {school.code}</p>
        {school.address && <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{school.address}</p>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["teachers", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, cursor: "pointer",
            background: tab === t ? "#6366f1" : "#1a1a2e", color: tab === t ? "#fff" : "#888",
          }}>
            {t === "teachers" ? "Teachers" : "Stats"}
          </button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowBulk(true)}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13 }}>
              Bulk Import CSV
            </button>
          </div>

          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Name</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Username</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Grades</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Students</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "#888" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                    <td style={{ padding: "10px 14px" }}>{t.name}</td>
                    <td style={{ padding: "10px 14px", color: "#8b5cf6" }}>{t.username}</td>
                    <td style={{ padding: "10px 14px", color: "#888" }}>{(t.grades || []).join(", ") || "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{t.studentCount}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button onClick={() => removeTeacher(t.id)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #f43f5e33", background: "transparent", color: "#f43f5e", cursor: "pointer", fontSize: 11 }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "30px 14px", textAlign: "center", color: "#555" }}>No teachers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {showBulk && id && (
            <BulkImportModal
              schoolId={id}
              onClose={() => setShowBulk(false)}
              onImported={() => { if (id) adminApi.listTeachers(id).then(setTeachers); }}
            />
          )}
        </>
      )}

      {tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Teachers", value: stats.teachers, color: "#6366f1" },
            { label: "Students", value: stats.students, color: "#8b5cf6" },
            { label: "Attempts", value: stats.attempts, color: "#a78bfa" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: "20px 18px" }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
