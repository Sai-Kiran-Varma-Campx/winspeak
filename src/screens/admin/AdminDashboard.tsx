import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

interface Stats {
  schools: number;
  teachers: number;
  students: number;
  attempts: number;
  recentTeachers: any[];
  recentSchools: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((s) => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;
  if (!stats) return <p style={{ color: "#f43f5e" }}>Failed to load stats</p>;

  const cards = [
    { label: "Schools", value: stats.schools, color: "#6366f1" },
    { label: "Teachers", value: stats.teachers, color: "#8b5cf6" },
    { label: "Students", value: stats.students, color: "#a78bfa" },
    { label: "Attempts", value: stats.attempts, color: "#c4b5fd" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: "20px 18px" }}>
            <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, color: "#e0e0ff", fontWeight: 600, marginBottom: 12 }}>Recent Schools</h2>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
          <thead><tr style={{ borderBottom: "1px solid #2a2a4a" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Name</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Code</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Created</th>
          </tr></thead>
          <tbody>
            {stats.recentSchools.map((s: any) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                <td style={{ padding: "10px 14px" }}>{s.name}</td>
                <td style={{ padding: "10px 14px", color: "#6366f1" }}>{s.code}</td>
                <td style={{ padding: "10px 14px", color: "#888" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentSchools.length === 0 && <tr><td colSpan={3} style={{ padding: "20px 14px", textAlign: "center", color: "#555" }}>No schools yet</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, color: "#e0e0ff", fontWeight: 600, marginBottom: 12 }}>Recent Teachers</h2>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
          <thead><tr style={{ borderBottom: "1px solid #2a2a4a" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Name</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Username</th>
            <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Created</th>
          </tr></thead>
          <tbody>
            {stats.recentTeachers.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                <td style={{ padding: "10px 14px" }}>{t.name}</td>
                <td style={{ padding: "10px 14px", color: "#8b5cf6" }}>{t.username}</td>
                <td style={{ padding: "10px 14px", color: "#888" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentTeachers.length === 0 && <tr><td colSpan={3} style={{ padding: "20px 14px", textAlign: "center", color: "#555" }}>No teachers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
