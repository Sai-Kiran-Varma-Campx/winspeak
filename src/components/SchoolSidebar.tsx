import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/context/UserStoreContext";
import WinnifyLogo from "@/components/WinnifyLogo";

const NAV_ITEMS = [
  {
    path: "/school",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: "/school/students",
    label: "Students",
    matchPrefix: "/school/students",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: "/school/reports",
    label: "Reports",
    matchPrefix: "/school/report",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export default function SchoolSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();

  return (
    <aside className="school-sidebar">
      {/* ── Top: Brand ── */}
      <div className="school-sidebar-brand">
        <WinnifyLogo height={34} />
      </div>

      <div className="school-sidebar-divider" />

      {/* ── Nav ── */}
      <nav className="school-sidebar-nav">
        {NAV_ITEMS.map(({ path, icon, label, matchPrefix }) => {
          const isActive =
            location.pathname === path ||
            (matchPrefix ? location.pathname.startsWith(matchPrefix) : false);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`school-sidebar-item${isActive ? " active" : ""}`}
            >
              <span className="school-sidebar-icon">{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom: Teacher ── */}
      <div className="school-sidebar-footer">
        <div className="school-sidebar-divider" />
        <div className="school-sidebar-user">
          <div className="school-sidebar-avatar">
            {store.name.charAt(0).toUpperCase()}
          </div>
          <div className="school-sidebar-user-info">
            <div className="school-sidebar-user-name">{store.name}</div>
            <div className="school-sidebar-user-role">Teacher</div>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Log out?")) {
                store.logout();
              }
            }}
            className="school-sidebar-logout"
            title="Log out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
