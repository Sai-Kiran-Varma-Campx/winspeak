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
      background: "linear-gradient(165deg, #EDE9FE, #F3EEFF, #DDD6FE, #EDE9FE)", padding: 24,
    }}>
      <div style={{
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 28,
        padding: "40px 32px", width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(124,58,237,0.1)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="WINNIFY" style={{ width: 220, margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14, color: "#7C3AED", fontWeight: 600, marginTop: 0, letterSpacing: 1, textTransform: "uppercase" }}>
            Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6E5E8A", marginBottom: 6 }}>USERNAME</label>
          <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="Enter username..." autoFocus autoComplete="username"
            style={{
              width: "100%", borderRadius: 14, padding: "14px 16px", fontSize: 15, fontWeight: 500, outline: "none",
              border: `1.5px solid ${hasError ? "rgba(244,63,94,0.5)" : username ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.12)"}`,
              background: "rgba(255,255,255,0.6)", color: "#4C1D95", fontFamily: "'Poppins', sans-serif", marginBottom: 14,
            }} />

          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6E5E8A", marginBottom: 6 }}>PASSWORD</label>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter password..." autoComplete="current-password"
            style={{
              width: "100%", borderRadius: 14, padding: "14px 16px", fontSize: 15, fontWeight: 500, outline: "none",
              border: `1.5px solid ${hasError ? "rgba(244,63,94,0.5)" : password ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.12)"}`,
              background: "rgba(255,255,255,0.6)", color: "#4C1D95", fontFamily: "'Poppins', sans-serif", marginBottom: 14,
            }} />

          {hasError && <p style={{ fontSize: 12, color: "#F43F5E", marginBottom: 12, fontWeight: 600 }}>{error || admin.authError}</p>}

          <button type="submit" disabled={admin.loading} style={{
            width: "100%", borderRadius: 14, padding: "14px 0", fontSize: 16, fontWeight: 500,
            border: "none", background: admin.loading ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7C3AED, #A78BFA)",
            color: "#fff", cursor: admin.loading ? "default" : "pointer",
            fontFamily: "'Fredoka', 'Sora', sans-serif",
            boxShadow: admin.loading ? "none" : "0 6px 24px rgba(124,58,237,0.3)", marginTop: 4,
          }}>
            {admin.loading ? <Spinner size={18} color="#fff" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
