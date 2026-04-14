import { useMode, syncModeClass } from "@/hooks/useMode";

/**
 * Floating dev/test toggle to switch between Student app and School POC.
 * Sits in the top-right corner on every screen, in both modes.
 */
export default function ModeSwitcher() {
  const [mode, setMode] = useMode();
  const isSchool = mode === "school";

  function flip() {
    const next = isSchool ? "default" : "school";
    setMode(next);
    syncModeClass(next);
    // Send the user to the natural home of the new mode
    window.location.href = next === "school" ? "/school" : "/";
  }

  return (
    <button
      onClick={flip}
      className="no-print"
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontFamily: "DM Sans, sans-serif",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.3,
        background: isSchool
          ? "linear-gradient(135deg,#5B8DEF,#7CB1FF)"
          : "linear-gradient(135deg,#8B80C0,#B09CD0)",
        color: "#fff",
        boxShadow: isSchool
          ? "0 6px 20px rgba(91,141,239,0.35)"
          : "0 6px 20px rgba(124,92,252,0.4)",
      }}
      title={`Currently in ${isSchool ? "School POC" : "Student App"} — click to switch`}
    >
      <span style={{ fontSize: 14 }}>{isSchool ? "🏫" : "🎓"}</span>
      <span>{isSchool ? "SCHOOL" : "STUDENT"}</span>
      <span style={{ opacity: 0.7, marginLeft: 2 }}>↔</span>
    </button>
  );
}
