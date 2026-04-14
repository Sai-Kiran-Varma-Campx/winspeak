import { useState } from "react";
import { useStore } from "@/context/UserStoreContext";
import Spinner from "@/components/Spinner";
import CloudsBg from "@/components/CloudsBg";
import SchoolBgDecorations from "@/components/SchoolBgDecorations";

export default function Login() {
  const store = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");

    const trimmedUser = username.trim();
    if (!trimmedUser) { setError("Please enter a username."); return; }
    if (trimmedUser.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    await store.login(trimmedUser, password);
    setLoading(false);
  }

  const serverError = store.authError;
  const hasError = !!(error || serverError);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: "linear-gradient(165deg, #EDE9FE, #F3EEFF, #DDD6FE, #EDE9FE)", position: "relative", overflow: "hidden" }}
    >
      {/* Override decorations' sidebar offset on login (no sidebar here) */}
      <style>{`.school-decorations { left: 0 !important; }`}</style>
      <CloudsBg />
      <SchoolBgDecorations />

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 10,
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid rgba(124,58,237,0.15)",
        borderRadius: 28, padding: "36px 32px",
        width: "100%", maxWidth: 400,
        boxShadow: "0 24px 80px rgba(124,58,237,0.1)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.png" alt="WINNIFY" style={{ width: 220, margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontSize: 14, color: "#6E5E8A", fontWeight: 500, marginTop: 0 }}>
            Teacher Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6E5E8A", marginBottom: 6 }}>
            USERNAME
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="Enter username..."
            autoFocus
            maxLength={30}
            autoComplete="username"
            disabled={loading}
            style={{
              width: "100%", borderRadius: 14, padding: "14px 16px",
              fontSize: 15, fontWeight: 500, outline: "none",
              border: `1.5px solid ${hasError ? "rgba(244,63,94,0.5)" : username ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.12)"}`,
              background: "rgba(255,255,255,0.6)",
              color: "#4C1D95",
              fontFamily: "'Poppins', sans-serif",
              marginBottom: 14,
            }}
          />

          <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6E5E8A", marginBottom: 6 }}>
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter password..."
            maxLength={128}
            autoComplete="current-password"
            disabled={loading}
            style={{
              width: "100%", borderRadius: 14, padding: "14px 16px",
              fontSize: 15, fontWeight: 500, outline: "none",
              border: `1.5px solid ${hasError ? "rgba(244,63,94,0.5)" : password ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.12)"}`,
              background: "rgba(255,255,255,0.6)",
              color: "#4C1D95",
              fontFamily: "'Poppins', sans-serif",
              marginBottom: 14,
            }}
          />

          {hasError && (
            <p style={{ fontSize: 12, color: "#F43F5E", marginBottom: 12, fontWeight: 600 }}>
              {error || serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", borderRadius: 14, padding: "14px 0",
              fontSize: 16, fontWeight: 500, border: "none",
              background: loading ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7C3AED, #A78BFA)",
              color: "#fff", cursor: loading ? "default" : "pointer",
              fontFamily: "'Fredoka', 'Sora', sans-serif",
              boxShadow: loading ? "none" : "0 6px 24px rgba(124,58,237,0.3)",
              marginTop: 4,
            }}
          >
            {loading ? <Spinner size={18} color="#fff" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
