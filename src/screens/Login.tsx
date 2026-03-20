import { useState } from "react";
import { useStore } from "@/context/UserStoreContext";
import Spinner from "@/components/Spinner";

const FEATURES = [
  { icon: "🎯", text: "Complete weekly speaking challenges" },
  { icon: "🤖", text: "Get real-time AI feedback from Gemini" },
  { icon: "📈", text: "Track XP, levels & streak" },
];

export default function Login() {
  const store = useStore();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  function switchMode(m: "login" | "signup" | "reset") {
    setMode(m);
    setError("");
    setResetSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResetSuccess(false);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError("Please enter a username.");
      return;
    }
    if (trimmedUser.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    if (mode === "login") {
      await store.login(trimmedUser, password);
    } else if (mode === "signup") {
      const name = displayName.trim() || trimmedUser;
      await store.signup(trimmedUser, password, name);
    } else {
      await store.resetPassword(trimmedUser, password);
      if (!store.authError) {
        setResetSuccess(true);
        setPassword("");
      }
    }
    setLoading(false);
  }

  const serverError = store.authError;
  const hasError = !!(error || serverError);

  const buttonLabel =
    mode === "login" ? "Sign In" :
    mode === "signup" ? "Create Account" :
    "Reset Password";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* Background glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%", left: "50%", transform: "translateX(-50%)",
          width: 400, height: 400, borderRadius: "50%",
          background: "var(--accent-glow)", filter: "blur(80px)", opacity: 0.6,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "10%", left: "20%",
          width: 200, height: 200, borderRadius: "50%",
          background: "#22D37A22", filter: "blur(60px)",
        }}
      />

      {/* Card */}
      <div
        className="border rounded-[28px] p-8 w-full max-w-sm relative z-10"
        style={{
          background: "linear-gradient(135deg,#13151C,#1A1D2E)",
          borderColor: "#7C5CFC44",
          boxShadow: "0 24px 80px #7C5CFC22",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center text-[30px] font-black mb-4"
            style={{
              background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
              boxShadow: "0 8px 32px var(--accent-glow)",
              color: "#fff",
            }}
          >
            W
          </div>
          <h1 className="text-[26px] font-extrabold">WinSpeak</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--muted)" }}>
            {mode === "reset" ? "Reset your password" : "Your AI speaking coach"}
          </p>
        </div>

        {/* Feature list — hide on reset */}
        {mode !== "reset" && (
          <>
            <div className="flex flex-col gap-2.5 mb-8">
              {FEATURES.map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[15px] flex-shrink-0"
                    style={{ background: "var(--surface)" }}
                  >
                    {icon}
                  </div>
                  <span className="text-[13px]" style={{ color: "var(--muted)" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-px mb-6" style={{ background: "var(--border)" }} />
          </>
        )}

        {/* Success message for reset */}
        {resetSuccess && (
          <div
            className="rounded-[12px] px-4 py-3 mb-4 text-[13px] font-medium"
            style={{ background: "#22D37A18", color: "#22D37A", border: "1px solid #22D37A33" }}
          >
            Password reset successfully! You can now sign in.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label
            className="block text-[12px] font-semibold mb-2"
            style={{ color: "var(--muted)" }}
          >
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
            className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-semibold outline-none border transition-colors mb-3"
            style={{
              background: "var(--surface)",
              borderColor: hasError ? "#FF4D6A88" : username ? "var(--accent)" : "var(--border)",
              color: "var(--text)",
              fontFamily: "DM Sans, sans-serif",
            }}
          />

          <label
            className="block text-[12px] font-semibold mb-2"
            style={{ color: "var(--muted)" }}
          >
            {mode === "reset" ? "NEW PASSWORD" : "PASSWORD"}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder={mode === "reset" ? "Enter new password..." : "Enter password..."}
            maxLength={128}
            autoComplete={mode === "signup" || mode === "reset" ? "new-password" : "current-password"}
            className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-semibold outline-none border transition-colors mb-3"
            style={{
              background: "var(--surface)",
              borderColor: hasError ? "#FF4D6A88" : password ? "var(--accent)" : "var(--border)",
              color: "var(--text)",
              fontFamily: "DM Sans, sans-serif",
            }}
          />

          {mode === "signup" && (
            <>
              <label
                className="block text-[12px] font-semibold mb-2"
                style={{ color: "var(--muted)" }}
              >
                DISPLAY NAME (OPTIONAL)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should we call you?"
                maxLength={100}
                className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-semibold outline-none border transition-colors mb-3"
                style={{
                  background: "var(--surface)",
                  borderColor: displayName ? "var(--accent)" : "var(--border)",
                  color: "var(--text)",
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
            </>
          )}

          {hasError && (
            <p className="text-[11px] mb-3" style={{ color: "#FF4D6A" }}>
              {error || serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[14px] py-3.5 text-[15px] font-extrabold transition-all mt-2 disabled:opacity-60"
            style={{
              background: loading
                ? "var(--surface)"
                : "linear-gradient(135deg,#7C5CFC,#C084FC)",
              color: "#fff",
              border: "none",
              boxShadow: loading ? "none" : "0 6px 24px var(--accent-glow)",
              cursor: loading ? "default" : "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Spinner size={18} color="#fff" />
              </span>
            ) : (
              buttonLabel
            )}
          </button>
        </form>

        {/* Forgot password link (login mode only) */}
        {mode === "login" && (
          <p className="text-center text-[11px] mt-3" style={{ color: "var(--muted)" }}>
            <button
              type="button"
              onClick={() => switchMode("reset")}
              className="font-medium"
              style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              Forgot password?
            </button>
          </p>
        )}

        {/* Toggle links */}
        <p className="text-center text-[12px] mt-3" style={{ color: "var(--muted)" }}>
          {mode === "login" && (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-semibold underline"
                style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
              >
                Create an account
              </button>
            </>
          )}
          {mode === "signup" && (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold underline"
                style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
              >
                Sign in
              </button>
            </>
          )}
          {mode === "reset" && (
            <>
              Back to{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold underline"
                style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
