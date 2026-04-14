import { useLocation, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAdminStore } from "@/context/AdminStoreContext";
import AdminDashboard from "@/screens/admin/AdminDashboard";
import SchoolsList from "@/screens/admin/SchoolsList";
import SchoolDetail from "@/screens/admin/SchoolDetail";
import QuestionsManager from "@/screens/admin/QuestionsManager";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", exact: true },
  { path: "/admin/schools", label: "Schools", prefix: "/admin/schools" },
  { path: "/admin/questions", label: "Questions", prefix: "/admin/questions" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = useAdminStore();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(165deg, #EDE9FE, #F3EEFF, #DDD6FE, #EDE9FE)" }}>
      {/* Sidebar */}
      <div style={{
        width: 230, background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderRight: "1.5px solid rgba(124,58,237,0.12)",
        display: "flex", flexDirection: "column", padding: "20px 12px",
      }}>
        <div style={{ padding: "0 8px 20px", borderBottom: "1.5px solid rgba(124,58,237,0.1)", marginBottom: 12 }}>
          <img src="/logo.png" alt="WINNIFY" style={{ width: 140, display: "block" }} />
          <p style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, margin: "6px 0 0", letterSpacing: 1, textTransform: "uppercase" }}>Admin Panel</p>
        </div>

        {NAV_ITEMS.map(({ path, label, exact, prefix }) => {
          const isActive = exact
            ? location.pathname === path
            : location.pathname === path || (prefix ? location.pathname.startsWith(prefix) : false);
          return (
            <div key={path} onClick={() => navigate(path)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
              borderRadius: 12, cursor: "pointer", marginBottom: 2, fontSize: 14,
              background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
              color: isActive ? "#4C1D95" : "#6E5E8A", fontWeight: isActive ? 600 : 500,
              fontFamily: "'Fredoka', 'Sora', sans-serif",
              transition: "background 0.15s",
            }}>
              <span>{label}</span>
            </div>
          );
        })}

        <div style={{ marginTop: "auto", borderTop: "1.5px solid rgba(124,58,237,0.1)", paddingTop: 12 }}>
          <div style={{ fontSize: 14, color: "#4C1D95", fontWeight: 600, padding: "0 8px", fontFamily: "'Fredoka', 'Sora', sans-serif" }}>
            {admin.name || admin.username}
          </div>
          <button onClick={admin.logout} style={{
            marginTop: 8, width: "100%", padding: "8px 12px", borderRadius: 10,
            border: "1.5px solid rgba(124,58,237,0.15)", background: "transparent", color: "#6E5E8A",
            cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "'Fredoka', 'Sora', sans-serif",
          }}>Logout</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/schools" element={<SchoolsList />} />
          <Route path="/admin/schools/:id" element={<SchoolDetail />} />
          <Route path="/admin/questions" element={<QuestionsManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
