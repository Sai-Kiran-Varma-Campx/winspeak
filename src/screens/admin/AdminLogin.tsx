import { useState } from "react";
import { useAdminStore } from "@/context/AdminStoreContext";
import Spinner from "@/components/Spinner";

export default function AdminLogin() {
  const admin = useAdminStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (admin.loading) return;
    setError("");
    const trimmed = username.trim();
    if (!trimmed) { setError("Username required"); return; }
    if (!password) { setError("Password required"); return; }
    await admin.login(trimmed, password);
  }

  const hasError = !!(error || admin.authError);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f0f23", padding: 24,
    }}>
      <div style={{
        background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16,
        padding: "40px 32px", width: "100%", maxWidth: 380,
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 600, margin: 0 }}>Winnify Admin</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Platform Administration</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Username</label>
          <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="admin" autoFocus
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, background: "#12122a", border: `1px solid ${hasError ? "#f43f5e" : "#2a2a4a"}`, color: "#e0e0ff", outline: "none", marginBottom: 14 }} />

          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Password</label>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14, background: "#12122a", border: `1px solid ${hasError ? "#f43f5e" : "#2a2a4a"}`, color: "#e0e0ff", outline: "none", marginBottom: 14 }} />

          {hasError && <p style={{ fontSize: 12, color: "#f43f5e", marginBottom: 12, fontWeight: 600 }}>{error || admin.authError}</p>}

          <button type="submit" disabled={admin.loading} style={{
            width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 600,
            border: "none", background: admin.loading ? "#333" : "#6366f1", color: "#fff",
            cursor: admin.loading ? "default" : "pointer",
          }}>
            {admin.loading ? <Spinner size={16} color="#fff" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
