import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/context/UserStoreContext";
import type { ReactNode } from "react";

function HomeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <rect x="12" y="24" width="24" height="18" rx="2" fill="#A78BFA" />
      <path d="M6 26L24 10L42 26" fill="#7C3AED" stroke="#6D28D9" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="20" y="30" width="8" height="12" rx="1.5" fill="#4C1D95" />
      <circle cx="26" cy="37" r="1" fill="#DDD6FE" />
      <rect x="14" y="28" width="5" height="5" rx="1" fill="#EDE9FE" />
      <circle cx="34" cy="14" r="2" fill="#C4B5FD" opacity="0.6">
        <animate attributeName="cy" values="14;10;14" dur="2s" repeatCount="indefinite" />
      </circle>
      <rect x="32" y="16" width="5" height="8" rx="1" fill="#5B21B6" />
    </svg>
  );
}

function StudentsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      <circle cx="16" cy="16" r="8" fill="#DDD6FE" />
      <circle cx="13.5" cy="15" r="1.2" fill="#4C1D95" />
      <circle cx="18.5" cy="15" r="1.2" fill="#4C1D95" />
      <path d="M13.5 19 Q16 21.5 18.5 19" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M10 32 Q10 25 16 25 Q22 25 22 32 L23 40 L9 40Z" fill="#7C3AED" />
      <circle cx="34" cy="16" r="8" fill="#C4B5FD" />
      <circle cx="31.5" cy="15" r="1.2" fill="#4C1D95" />
      <circle cx="36.5" cy="15" r="1.2" fill="#4C1D95" />
      <path d="M31.5 19 Q34 21.5 36.5 19" stroke="#4C1D95" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M28 32 Q28 25 34 25 Q40 25 40 32 L41 40 L27 40Z" fill="#8B5CF6" />
      <circle cx="28" cy="10" r="2.5" fill="#A78BFA" />
      <circle cx="40" cy="10" r="2.5" fill="#A78BFA" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      {/* Clipboard body */}
      <rect x="10" y="10" width="28" height="34" rx="4" fill="#DDD6FE" />
      <rect x="10" y="10" width="28" height="34" rx="4" stroke="#A78BFA" strokeWidth="1.5" />
      {/* Clipboard clip */}
      <rect x="18" y="6" width="12" height="8" rx="3" fill="#7C3AED" />
      <rect x="21" y="8" width="6" height="4" rx="2" fill="#5B21B6" />
      {/* Star */}
      <path d="M24 19 L25.5 23 L30 23.3 L26.8 26 L28 30 L24 27.5 L20 30 L21.2 26 L18 23.3 L22.5 23Z" fill="#A78BFA" />
      {/* Lines */}
      <line x1="15" y1="34" x2="33" y2="34" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="15" y1="38" x2="27" y2="38" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CustomChallengesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
      {/* Magic wand stick */}
      <rect x="6" y="32" width="24" height="5" rx="2" fill="#A78BFA" transform="rotate(-45 18 34)" />
      <rect x="6" y="32" width="8" height="5" rx="2" fill="#7C3AED" transform="rotate(-45 18 34)" />
      {/* Wand tip star */}
      <path d="M33 10 L35 15 L40 15.5 L36.5 18.5 L37.5 23 L33 20.5 L28.5 23 L29.5 18.5 L26 15.5 L31 15Z" fill="#C4B5FD" stroke="#7C3AED" strokeWidth="1.2" />
      {/* Sparkles */}
      <circle cx="22" cy="12" r="2" fill="#DDD6FE">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="40" cy="8" r="1.5" fill="#8B5CF6">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="38" cy="26" r="1.5" fill="#DDD6FE">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

const MENU_ITEMS: { path: string; label: string; icon: ReactNode; exact?: boolean; prefix?: string }[] = [
  { path: "/school", label: "Home", icon: <HomeIcon />, exact: true },
  { path: "/school/students", label: "Students", icon: <StudentsIcon />, prefix: "/school/students" },
  { path: "/school/custom-challenges", label: "My Challenges", icon: <CustomChallengesIcon />, prefix: "/school/custom-challenges" },
  { path: "/school/reports", label: "Reports", icon: <ReportsIcon />, prefix: "/school/report" },
];

export default function SchoolTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const [showLogout, setShowLogout] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showLogout) return;
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowLogout(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showLogout]);

  const initial = (store.name || "T").charAt(0).toUpperCase();

  return (
    <>
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo logo-blend">
          <img src="/logo.png" alt="WINNIFY" />
        </div>
        {MENU_ITEMS.map(({ path, label, icon, exact, prefix }) => {
          const isActive = exact
            ? location.pathname === path
            : location.pathname === path || (prefix ? location.pathname.startsWith(prefix) : false);
          return (
            <div
              key={path}
              className={`menu-item${isActive ? " active" : ""}`}
              onClick={() => navigate(path)}
            >
              {icon}
              <span>{label}</span>
            </div>
          );
        })}

        {/* Profile section at bottom */}
        <div ref={profileRef} style={{ marginTop: "auto", position: "relative" }}>
          <div
            onClick={() => setShowLogout((p) => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 14, cursor: "pointer",
              background: showLogout ? "rgba(124,58,237,0.12)" : "transparent",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 500, fontSize: 20,
              fontFamily: "'Fredoka', 'Sora', sans-serif",
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 16, fontWeight: 500, color: "#4C1D95",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                fontFamily: "'Fredoka', 'Sora', sans-serif",
              }}>
                {store.name || "Teacher"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#6E5E8A" }}>
                Teacher
              </div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6E5E8A" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showLogout ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Logout dropdown */}
          {showLogout && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0,
              marginBottom: 6, padding: 4,
              background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid rgba(124,58,237,0.15)",
              borderRadius: 12, boxShadow: "0 4px 20px rgba(124,58,237,0.15)",
            }}>
              <button
                onClick={() => { setShowLogout(false); store.logout(); }}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  border: "none", background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 500, color: "#4C1D95",
                  fontFamily: "'Fredoka', 'Sora', sans-serif",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124,58,237,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
