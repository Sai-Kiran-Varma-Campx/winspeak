import { useState, useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/context/UserStoreContext";
import { useSession } from "@/context/SessionContext";
import { CHALLENGES } from "@/constants";

/* ── SVG Icons (stroke-based, 20x20) ── */

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
      <path d="M9 22V12h6v10" stroke={active ? "var(--card)" : "currentColor"} fill="none" />
    </svg>
  );
}

function IconMic({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconClock({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" stroke={active ? "var(--card)" : "currentColor"} fill="none" />
    </svg>
  );
}

function IconTrophy({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" fill="none" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" fill="none" />
      <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
      <path d="M9 21h6" fill="none" />
      <path d="M12 16v5" fill="none" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

/* ── Drawer nav icons (18x18, outline only) ── */

function DrawerIconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DrawerIconMic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function DrawerIconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DrawerIconLeaderboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
      <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
      <path d="M9 21h6" />
      <path d="M12 16v5" />
    </svg>
  );
}

const DRAWER_NAV_ITEMS: { path: string; label: string; icon: ReactNode }[] = [
  { path: "/", label: "Home", icon: <DrawerIconHome /> },
  { path: "/question", label: "Practice", icon: <DrawerIconMic /> },
  { path: "/history", label: "History", icon: <DrawerIconClock /> },
  { path: "/leaderboard", label: "Leaderboard", icon: <DrawerIconLeaderboard /> },
];

const HIDDEN_PATHS = ["/recording", "/analysing"];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const session = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null;

  const activeChallenge = (session.challengeId
    ? CHALLENGES.find((c) => c.id === session.challengeId)
    : null) ?? CHALLENGES.find((c) => !store.completedChallengeIds.includes(c.id)) ?? null;
  const completedCount = store.completedChallengeIds.length;
  const totalChallenges = CHALLENGES.length;

  const tabs: { path: string; label: string; icon: (active: boolean) => ReactNode }[] = [
    { path: "/", label: "Home", icon: (a) => <IconHome active={a} /> },
    { path: "/question", label: "Practice", icon: (a) => <IconMic active={a} /> },
    { path: "/history", label: "History", icon: (a) => <IconClock active={a} /> },
    { path: "/leaderboard", label: "Rank", icon: (a) => <IconTrophy active={a} /> },
  ];

  return (
    <>
      {/* ── Bottom Nav Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden flex items-center justify-around border-t"
        style={{
          height: "calc(64px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          background: "rgba(19,21,28,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: "var(--border)",
        }}
      >
        {tabs.map(({ path, label, icon }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 border-none cursor-pointer flex-1 py-2"
              style={{
                background: "transparent",
                color: isActive ? "var(--accent)" : "var(--muted)",
              }}
            >
              {icon(isActive)}
              <span
                className="text-[10px] font-semibold"
                style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}
              >
                {label}
              </span>
            </button>
          );
        })}

        {/* Hamburger / Menu tab */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 border-none cursor-pointer flex-1 py-2"
          style={{ background: "transparent", color: drawerOpen ? "var(--accent)" : "var(--muted)" }}
        >
          <IconMenu />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {/* ── Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] lg:hidden"
          onClick={() => setDrawerOpen(false)}
          style={{ background: "rgba(0,0,0,0.55)" }}
        />
      )}

      {/* ── Drawer Panel (slides from right) ── */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[70] lg:hidden flex flex-col overflow-y-auto"
        style={{
          width: "min(280px, 85vw)",
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[15px] font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7C5CFC,#C084FC)", color: "#fff" }}
            >
              W
            </div>
            <span className="text-[16px] font-extrabold tracking-tight">WinSpeak</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center border-none cursor-pointer"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "0 20px" }} />

        {/* User profile card */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-extrabold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7C5CFC,#C084FC)", color: "#fff" }}
            >
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold truncate">{store.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "#7C5CFC22", color: "#A78BFA" }}
                >
                  Lv {store.level}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: "#FFB830" }}>
                  {store.totalXp.toLocaleString()} XP
                </span>
                {store.streak > 0 && (
                  <span className="text-[11px] font-semibold" style={{ color: "#FF4D6A" }}>
                    {store.streak}d streak
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "0 20px" }} />

        {/* Nav links with icons */}
        <nav className="px-3 pt-3 flex flex-col gap-0.5">
          {DRAWER_NAV_ITEMS.map(({ path, label, icon }) => {
            const isActive = location.pathname === path
              || (path === "/history" && location.pathname.startsWith("/report/"));
            return (
              <button
                key={path}
                onClick={() => { navigate(path); setDrawerOpen(false); }}
                className="flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-[14px] font-medium w-full border-none cursor-pointer"
                style={{
                  background: isActive ? "#7C5CFC18" : "transparent",
                  color: isActive ? "#A78BFA" : "var(--text-secondary)",
                  borderLeft: isActive ? "2px solid #7C5CFC" : "2px solid transparent",
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Practice Now CTA */}
        <div className="px-4 mt-4">
          <button
            onClick={() => { navigate("/question"); setDrawerOpen(false); }}
            className="w-full rounded-[12px] py-3 text-[14px] font-bold border-none cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg,#7C5CFC,#9B7BFF)",
              color: "#fff",
              boxShadow: "0 4px 16px #7C5CFC33",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            Practice Now
          </button>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "16px 20px 0" }} />

        {/* Speaking Journey */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold tracking-[1.2px]" style={{ color: "var(--muted)" }}>
              SPEAKING JOURNEY
            </span>
            <span className="text-[10px] font-bold" style={{ color: "var(--accent)" }}>
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
                    background: done ? "var(--accent)" : isNext ? "#7C5CFC44" : "var(--border)",
                    boxShadow: done ? "0 0 6px #7C5CFC66" : "none",
                  }}
                />
              );
            })}
          </div>

          {activeChallenge && (
            <button
              onClick={() => { navigate("/question"); setDrawerOpen(false); }}
              className="rounded-[10px] px-3 py-2.5 flex items-center gap-2.5 w-full border-none cursor-pointer text-left"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                style={{ background: "#7C5CFC22", color: "var(--accent)" }}
              >
                {activeChallenge.week}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold truncate" style={{ color: "var(--text)" }}>
                  {activeChallenge.title}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                  Up next · {activeChallenge.xp} XP
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout */}
        <div className="px-4 py-4 border-t mt-4" style={{ borderColor: "var(--border)", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={() => {
              if (window.confirm("Log out?")) {
                store.logout();
                setDrawerOpen(false);
              }
            }}
            className="w-full rounded-[12px] py-3 text-[13px] font-bold border cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: "transparent",
              borderColor: "#FF4D6A33",
              color: "#FF4D6A",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
