import { useNavigate, useLocation } from "react-router-dom";

const SCREENS = [
  { path: "/", label: "🏠 Dashboard" },
  { path: "/audiocheck", label: "🎙 Audio" },
  { path: "/question", label: "📋 Question" },
  { path: "/recording", label: "⏺ Record" },
  { path: "/analysing", label: "⏳ Loading" },
  { path: "/report", label: "📊 Report" },
];

export default function ScreenNav() {
  if (!import.meta.env.DEV) return null;

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-1.5 overflow-x-auto px-4 py-2.5"
      style={{
        background: "#05060A",
        borderBottom: "1px solid var(--border)",
        scrollbarWidth: "none",
      }}
    >
      <span
        className="text-[11px] font-bold mr-1.5 whitespace-nowrap self-center"
        style={{ color: "var(--muted)" }}
      >
        SCREENS:
      </span>
      {SCREENS.map(({ path, label }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold border transition-all cursor-pointer"
            style={{
              background: isActive ? "var(--accent)" : "var(--card)",
              borderColor: isActive ? "var(--accent)" : "var(--border)",
              color: isActive ? "#fff" : "var(--muted)",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
