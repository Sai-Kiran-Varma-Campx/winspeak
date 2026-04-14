import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

const card = { background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.12)", borderRadius: 16, padding: "20px 18px" } as const;
const th = { padding: "10px 14px", textAlign: "left" as const, color: "#6E5E8A", fontWeight: 600, fontSize: 12, textTransform: "uppercase" as const, letterSpacing: 0.5 };
const td = { padding: "10px 14px", color: "#4C1D95", fontSize: 13 };
const tdMuted = { ...td, color: "#8B7AA8" };

interface Stats { schools: number; teachers: number; students: number; attempts: number; recentTeachers: any[]; recentSchools: any[] }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminApi.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;
  if (!stats) return <p style={{ color: "#F43F5E" }}>Failed to load stats</p>;

  const cards = [
    { label: "Schools", value: stats.schools, color: "#7C3AED" },
    { label: "Teachers", value: stats.teachers, color: "#8B5CF6" },
    { label: "Students", value: stats.students, color: "#A78BFA" },
    { label: "Attempts", value: stats.attempts, color: "#C4B5FD" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, color: "#4C1D95", fontWeight: 700, marginBottom: 24, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((c) => (
          <div key={c.label} style={card}>
            <div style={{ fontSize: 12, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 16, color: "#4C1D95", fontWeight: 600, marginBottom: 12, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>Recent Schools</h2>
      <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
            <th style={th}>Name</th><th style={th}>Code</th><th style={th}>Created</th>
          </tr></thead>
          <tbody>
            {stats.recentSchools.map((s: any) => (
              <tr key={s.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.06)" }}>
                <td style={td}>{s.name}</td>
                <td style={{ ...td, color: "#7C3AED", fontWeight: 600 }}>{s.code}</td>
                <td style={tdMuted}>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentSchools.length === 0 && <tr><td colSpan={3} style={{ ...tdMuted, textAlign: "center", padding: 24 }}>No schools yet</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, color: "#4C1D95", fontWeight: 600, marginBottom: 12, fontFamily: "'Fredoka', 'Sora', sans-serif" }}>Recent Teachers</h2>
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1.5px solid rgba(124,58,237,0.08)" }}>
            <th style={th}>Name</th><th style={th}>Username</th><th style={th}>Created</th>
          </tr></thead>
          <tbody>
            {stats.recentTeachers.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: "1px solid rgba(124,58,237,0.06)" }}>
                <td style={td}>{t.name}</td>
                <td style={{ ...td, color: "#7C3AED", fontWeight: 600 }}>{t.username}</td>
                <td style={tdMuted}>{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentTeachers.length === 0 && <tr><td colSpan={3} style={{ ...tdMuted, textAlign: "center", padding: 24 }}>No teachers yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
