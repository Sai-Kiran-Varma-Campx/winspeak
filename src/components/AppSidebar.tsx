import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/context/UserStoreContext";
import { relativeDate } from "@/hooks/useUserStore";

const SKILL_ORDER = ["Fluency", "Grammar", "Vocabulary", "Clarity", "Structure", "Relevancy"];

function skillColor(score: number) {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const [xpBarWidth, setXpBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setXpBarWidth(store.xpProgress), 400);
    return () => clearTimeout(t);
  }, [store.xpProgress]);

  const isHome = location.pathname === "/";
  const latest = store.attempts[0] ?? null;

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="p-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[16px] font-black flex-shrink-0"
            style={{
              background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
              boxShadow: "0 4px 16px var(--accent-glow)",
              color: "#fff",
            }}
          >
            W
          </div>
          <span className="text-[17px] font-extrabold">WinSpeak</span>
        </div>
      </div>

      {/* Home nav — only real route */}
      <nav className="px-3 pt-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[14px] font-semibold w-full border-none transition-colors"
          style={{
            background: isHome ? "var(--accent)" : "transparent",
            color: isHome ? "#fff" : "var(--muted)",
            fontFamily: "DM Sans, sans-serif",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            if (!isHome)
              (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
          }}
          onMouseLeave={(e) => {
            if (!isHome)
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <span className="text-[18px]">🏠</span>
          Home
        </button>
      </nav>

      {/* Analysis Progress */}
      <div className="px-4 mt-5 flex-1 overflow-y-auto">
        <div
          className="text-[10px] font-bold tracking-[1.2px] mb-3"
          style={{ color: "var(--muted)" }}
        >
          LAST ANALYSIS
        </div>

        {!latest ? (
          /* Empty state */
          <div
            className="border rounded-[14px] p-4 text-center"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="text-[24px] mb-2">📊</div>
            <div className="text-[12px] font-semibold mb-1">No analysis yet</div>
            <div className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
              Complete a challenge to see your skill breakdown here.
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-[10px] py-2 text-[11px] font-bold border-none cursor-pointer"
              style={{
                background: "var(--accent)",
                color: "#fff",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Start a challenge →
            </button>
          </div>
        ) : (
          /* Latest analysis */
          <div
            className="border rounded-[14px] p-3.5"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[13px] font-extrabold" style={{ color: "var(--accent)" }}>
                  {latest.score}/100
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {relativeDate(latest.date)}
                </span>
              </div>
              <div
                className="text-[11px] truncate"
                style={{ color: "var(--muted)" }}
                title={latest.challengeTitle}
              >
                {latest.challengeTitle}
              </div>
            </div>

            {/* Skill bars */}
            {latest.skills ? (
              <div className="flex flex-col gap-2">
                {SKILL_ORDER.filter((s) => latest.skills![s] !== undefined).map((skill) => {
                  const score = latest.skills![skill];
                  const color = skillColor(score);
                  return (
                    <div key={skill}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                          {skill}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color }}>
                          {score}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--border)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${score}%`,
                            background: `linear-gradient(90deg,${color},${color}bb)`,
                            boxShadow: `0 0 6px ${color}66`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                Score: {latest.score}/100
              </div>
            )}
          </div>
        )}
      </div>

      {/* User card — pinned bottom */}
      <div className="p-4 border-t mt-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7C5CFC,#C084FC)", color: "#fff" }}
          >
            {store.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold truncate">{store.name}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>
              Lv {store.level} · ⚡ {store.totalXp.toLocaleString()} XP
            </div>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${xpBarWidth}%`,
              background: "linear-gradient(90deg,var(--accent),#C084FC)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px]" style={{ color: "var(--muted)" }}>Lv {store.level}</span>
          <span className="text-[9px]" style={{ color: "var(--muted)" }}>
            {store.xpInLevel}/{store.xpToNext} XP → Lv {store.level + 1}
          </span>
        </div>
      </div>
    </aside>
  );
}
