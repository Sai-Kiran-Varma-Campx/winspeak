import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

const card = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.12)", borderRadius: 16 } as const;
const input = { padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "rgba(255,255,255,0.6)", color: "#4C1D95", fontSize: 14, fontFamily: "'Poppins', sans-serif", outline: "none", width: "100%" } as const;
const btn = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(124,58,237,0.2)" } as const;
const btnGhost = { padding: "10px 20px", borderRadius: 12, border: "1.5px solid rgba(124,58,237,0.15)", background: "transparent", color: "#6E5E8A", cursor: "pointer", fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif" } as const;
const btnDanger = { padding: "10px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #e11d48, #f43f5e)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Fredoka', 'Sora', sans-serif", boxShadow: "0 4px 16px rgba(225,29,72,0.2)" } as const;
const th = { padding: "12px 14px", textAlign: "left" as const, color: "#6E5E8A", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const };
const td = { padding: "12px 14px", color: "#4C1D95", fontSize: 13 };

export default function SchoolsList() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "", contactEmail: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { adminApi.listSchools().then(setSchools).finally(() => setLoading(false)); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (!form.name.trim() || !form.code.trim()) { setError("Name and code are required"); return; }
    setCreating(true);
    try {
      const created = await adminApi.createSchool({ name: form.name.trim(), code: form.code.trim(), address: form.address.trim() || undefined, contactEmail: form.contactEmail.trim() || undefined });
      setSchools((prev) => [{ ...created, teacherCount: 0, studentCount: 0 }, ...prev]);
      setShowCreate(false);
      setForm({ name: "", code: "", address: "", contactEmail: "" });
    } catch (e: any) { setError(e.message || "Failed to create school"); } finally { setCreating(false); }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await adminApi.deleteSchool(deleteTarget.id);
      setSchools((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) { alert(e.message || "Failed to delete"); } finally { setDeleting(false); }
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "#4C1D95", fontWeight: 700, margin: 0, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>Schools</h1>
        <button onClick={() => setShowCreate(true)} style={btn}>+ Add School</button>
      </div>

      {showCreate && (
        <div style={{ ...card, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: "#4C1D95", marginTop: 0, marginBottom: 16, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>New School</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="School Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} />
              <input placeholder="Code (e.g. DPS-HYD) *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={input} />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={input} />
              <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} style={input} />
            </div>
            {error && <p style={{ color: "#F43F5E", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating} style={btn}>{creating ? "Creating..." : "Create"}</button>
              <button type="button" onClick={() => { setShowCreate(false); setError(""); }} style={btnGhost}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
            <th style={th}>Name</th><th style={th}>Code</th>
            <th style={{ ...th, textAlign: "center" }}>Teachers</th><th style={{ ...th, textAlign: "center" }}>Students</th>
            <th style={{ ...th, textAlign: "right" }}>Actions</th>
          </tr></thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.06)", cursor: "pointer" }}
                onClick={() => navigate(`/admin/schools/${s.id}`)}>
                <td style={{ ...td, fontWeight: 600 }}>{s.name}</td>
                <td style={{ ...td, color: "#7C3AED", fontWeight: 600 }}>{s.code}</td>
                <td style={{ ...td, textAlign: "center" }}>{s.teacherCount}</td>
                <td style={{ ...td, textAlign: "center" }}>{s.studentCount}</td>
                <td style={{ ...td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setDeleteTarget(s)}
                    style={{ padding: "4px 12px", borderRadius: 8, border: "1.5px solid rgba(225,29,72,0.2)", background: "transparent", color: "#e11d48", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {schools.length === 0 && <tr><td colSpan={5} style={{ padding: 30, textAlign: "center", color: "#8B7AA8" }}>No schools yet. Click "+ Add School" to create one.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: "1.5px solid rgba(225,29,72,0.2)", borderRadius: 24, padding: 28, width: "100%", maxWidth: 440,
            boxShadow: "0 24px 80px rgba(225,29,72,0.1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "rgba(225,29,72,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
              }}>
                ⚠️
              </div>
              <h3 style={{ color: "#4C1D95", margin: 0, fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 18 }}>
                Delete School?
              </h3>
            </div>

            <p style={{ color: "#4C1D95", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
              You are about to permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.code}).
            </p>

            <div style={{
              background: "rgba(225,29,72,0.06)", border: "1px solid rgba(225,29,72,0.15)",
              borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#9f1239", lineHeight: 1.6,
            }}>
              <strong>This will permanently delete:</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                <li>All teachers in this school ({deleteTarget.teacherCount} teachers)</li>
                <li>All students managed by those teachers ({deleteTarget.studentCount} students)</li>
                <li>All student attempt records and reports</li>
              </ul>
              <p style={{ margin: "8px 0 0", fontWeight: 600 }}>This action cannot be undone.</p>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={btnGhost}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={btnDanger}>
                {deleting ? "Deleting..." : "Delete School"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
