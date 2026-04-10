import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/context/UserStoreContext";

const NAV_LINKS = [
  { path: "/school", label: "Home", exact: true },
  { path: "/school/dashboard", label: "Dashboard", prefix: "/school/dashboard" },
  { path: "/school/administer", label: "Challenges", prefix: "/school/administer" },
  { path: "/school/reports", label: "Reports", prefix: "/school/report" },
  { path: "/school/students", label: "Students", prefix: "/school/students" },
];

export default function SchoolTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();

  return (
    <nav className="school-navbar">
      <button className="school-navbar-logo" onClick={() => navigate("/school")}>
        <img src="/winnify-logo.png" alt="Winnify" className="school-navbar-logo-img" />
      </button>

      <ul className="school-navbar-links">
        {NAV_LINKS.map(({ path, label, exact, prefix }) => {
          const isActive = exact
            ? location.pathname === path
            : location.pathname === path || (prefix ? location.pathname.startsWith(prefix) : false);
          return (
            <li key={path}>
              <button
                onClick={() => navigate(path)}
                className={`school-navbar-link${isActive ? " active" : ""}`}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="school-navbar-right">
        <button
          onClick={() => { if (window.confirm("Log out?")) store.logout(); }}
          className="school-navbar-avatar"
          title={store.name}
        >
          {store.name.charAt(0).toUpperCase()}
        </button>
      </div>
    </nav>
  );
}
