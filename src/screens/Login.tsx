import { useState } from "react";
import { useStore } from "@/context/UserStoreContext";

const FEATURES = [
  { icon: "🎯", text: "Complete weekly speaking challenges" },
  { icon: "🤖", text: "Get real-time AI feedback from Gemini" },
  { icon: "📈", text: "Track XP, levels & streak" },
];

export default function Login() {
  const store = useStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setLoading(true);
    // Small delay for feel
    setTimeout(() => {
      store.completeOnboarding(trimmed);
    }, 500);
  }

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
            Your AI speaking coach
          </p>
        </div>

        {/* Feature list */}
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

        {/* Divider */}
        <div
          className="h-px mb-6"
          style={{ background: "var(--border)" }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label
            className="block text-[12px] font-semibold mb-2"
            style={{ color: "var(--muted)" }}
          >
            WHAT SHOULD WE CALL YOU?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Enter your name..."
            autoFocus
            maxLength={30}
            className="w-full rounded-[14px] px-4 py-3.5 text-[15px] font-semibold outline-none border transition-colors mb-2"
            style={{
              background: "var(--surface)",
              borderColor: error ? "#FF4D6A88" : name ? "var(--accent)" : "var(--border)",
              color: "var(--text)",
              fontFamily: "DM Sans, sans-serif",
            }}
            onFocus={(e) =>
              !error && ((e.target as HTMLInputElement).style.borderColor = "var(--accent)")
            }
          />

          {error && (
            <p className="text-[11px] mb-3" style={{ color: "#FF4D6A" }}>
              ⚠ {error}
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
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border-2 border-t-transparent inline-block"
                  style={{ borderColor: "var(--accent)", animation: "spin 0.8s linear infinite" }}
                />
                Setting up...
              </span>
            ) : (
              "Get Started →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
