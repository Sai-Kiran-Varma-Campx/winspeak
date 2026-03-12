import { useEffect } from "react";
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
  const navigate = useNavigate();
  const location = useLocation();

  // Add class to body so .phone-shell can subtract nav height
  useEffect(() => {
    document.body.classList.add("has-dev-nav");
    return () => document.body.classList.remove("has-dev-nav");
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <nav className="screen-nav">
      <span
        className="text-[11px] font-bold mr-1.5 whitespace-nowrap"
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
            className="whitespace-nowrap rounded-lg px-3 py-1 text-[11px] font-bold border transition-all cursor-pointer"
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
    </nav>
  );
}
