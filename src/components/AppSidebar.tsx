import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/context/UserStoreContext";
import { CHALLENGES } from "@/constants";

function getActiveChallenge(completedIds: string[]) {
  return (
    CHALLENGES.find((c, i) => {
      if (completedIds.includes(c.id)) return false;
      return CHALLENGES.slice(0, i).every((ch) => completedIds.includes(ch.id));
    }) ?? null
  );
}

const NAV_ITEMS = [
  {
    path: "/",
    label: "Home",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    path: "/history",
    label: "History",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    path: "/leaderboard",
    label: "Leaderboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();

  const activeChallenge = getActiveChallenge(store.completedChallengeIds);
  const completedCount = store.completedChallengeIds.length;
  const totalChallenges = CHALLENGES.length;

  return (
    <aside className="app-sidebar" style={{ justifyContent: "space-between" }}>

      {/* ── TOP ── */}
      <div>
        {/* Brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[15px] font-black flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
                color: "#fff",
              }}
            >
              W
            </div>
            <span className="text-[16px] font-extrabold tracking-tight">WinSpeak</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "0 20px" }} />

        {/* Nav items */}
        <nav className="px-3 pt-3 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const isActive = location.pathname === path
              || (path === "/history" && location.pathname.startsWith("/report/"));
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13.5px] font-medium w-full border-none cursor-pointer transition-all"
                style={{
                  background: isActive ? "#7C5CFC18" : "transparent",
                  color: isActive ? "#A78BFA" : "var(--muted)",
                  borderLeft: isActive ? "2px solid #7C5CFC" : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                  }
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.7 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Practice Now CTA */}
        <div className="px-4 mt-5">
          <button
            onClick={() => navigate("/audiocheck")}
            className="w-full rounded-[12px] py-2.5 text-[13px] font-bold border-none cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg,#7C5CFC,#9B7BFF)",
              color: "#fff",
              boxShadow: "0 4px 16px #7C5CFC33",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
            Practice Now
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", margin: "20px 20px 0" }} />

        {/* Journey progress */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span
              className="text-[10px] font-bold tracking-[1.2px]"
              style={{ color: "var(--muted)" }}
            >
              SPEAKING JOURNEY
            </span>
            <span
              className="text-[10px] font-bold"
              style={{ color: "var(--accent)" }}
            >
              {completedCount}/{totalChallenges}
            </span>
          </div>

          {/* Segmented progress bar */}
          <div className="flex gap-[3px] mb-2.5">
            {CHALLENGES.map((c) => {
              const done = store.completedChallengeIds.includes(c.id);
              const isNext = c.id === activeChallenge?.id;
              return (
                <div
                  key={c.id}
                  className="flex-1 rounded-full"
                  style={{
                    height: 4,
                    background: done
                      ? "var(--accent)"
                      : isNext
                      ? "#7C5CFC44"
                      : "var(--border)",
                    boxShadow: done ? "0 0 6px #7C5CFC66" : "none",
                    transition: "background 0.4s ease",
                  }}
                />
              );
            })}
          </div>

          {activeChallenge && (
            <div
              className="rounded-[10px] px-3 py-2.5 flex items-center gap-2.5"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                style={{ background: "#7C5CFC22", color: "var(--accent)" }}
              >
                {activeChallenge.week}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold truncate">
                  {activeChallenge.title}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                  Up next · {activeChallenge.xp} XP
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM: User + Logout ── */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-extrabold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#7C5CFC,#C084FC)", color: "#fff" }}
          >
            {store.name.charAt(0).toUpperCase()}
          </div>

          {/* Name + level */}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">{store.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold"
                style={{ background: "#7C5CFC22", color: "#A78BFA" }}
              >
                Lv {store.level}
              </span>
              {store.streak > 0 && (
                <span className="text-[10px] font-semibold" style={{ color: "#FF4D6A" }}>
                  🔥 {store.streak}
                </span>
              )}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              if (window.confirm("Log out?")) {
                store.logout();
              }
            }}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center border-none cursor-pointer flex-shrink-0"
            style={{ background: "transparent", color: "var(--muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#FF4D6A18";
              (e.currentTarget as HTMLButtonElement).style.color = "#FF4D6A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
            }}
            title="Log out"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
