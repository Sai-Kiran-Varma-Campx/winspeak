import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

export default function SchoolsList() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "", contactEmail: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.listSchools().then(setSchools).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (!form.name.trim() || !form.code.trim()) { setError("Name and code are required"); return; }
    setCreating(true);
    try {
      const created = await adminApi.createSchool({
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
      });
      setSchools((prev) => [{ ...created, teacherCount: 0, studentCount: 0 }, ...prev]);
      setShowCreate(false);
      setForm({ name: "", code: "", address: "", contactEmail: "" });
    } catch (e: any) {
      setError(e.message || "Failed to create school");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(school: any) {
    const updated = await adminApi.updateSchool(school.id, { isActive: !school.isActive });
    setSchools((prev) => prev.map((s) => (s.id === school.id ? { ...s, ...updated } : s)));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, margin: 0 }}>Schools</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
        >
          + Add School
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{
          background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ color: "#e0e0ff", marginTop: 0, marginBottom: 16 }}>New School</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="School Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
              <input placeholder="Code (e.g. DPS-HYD) *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
              <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
            </div>
            {error && <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schools table */}
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Name</th>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Code</th>
              <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Teachers</th>
              <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Students</th>
              <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Status</th>
              <th style={{ padding: "10px 14px", textAlign: "right", color: "#888" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1f1f3a", cursor: "pointer" }}
                onClick={() => navigate(`/admin/schools/${s.id}`)}>
                <td style={{ padding: "12px 14px", fontWeight: 500 }}>{s.name}</td>
                <td style={{ padding: "12px 14px", color: "#6366f1" }}>{s.code}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>{s.teacherCount}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>{s.studentCount}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={{
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: s.isActive ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)",
                    color: s.isActive ? "#22c55e" : "#f43f5e",
                  }}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleActive(s)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 11 }}>
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "30px 14px", textAlign: "center", color: "#555" }}>No schools yet. Click "Add School" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
