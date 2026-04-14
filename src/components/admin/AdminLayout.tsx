import { useLocation, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAdminStore } from "@/context/AdminStoreContext";
import AdminDashboard from "@/screens/admin/AdminDashboard";
import SchoolsList from "@/screens/admin/SchoolsList";
import SchoolDetail from "@/screens/admin/SchoolDetail";
import QuestionsManager from "@/screens/admin/QuestionsManager";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: "\u{1F4CA}", exact: true },
  { path: "/admin/schools", label: "Schools", icon: "\u{1F3EB}", prefix: "/admin/schools" },
  { path: "/admin/questions", label: "Questions", icon: "\u{2753}", prefix: "/admin/questions" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = useAdminStore();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f23" }}>
      <div style={{
        width: 220, background: "#1a1a2e", borderRight: "1px solid #2a2a4a",
        display: "flex", flexDirection: "column", padding: "20px 12px",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e0ff", padding: "0 8px 20px", borderBottom: "1px solid #2a2a4a", marginBottom: 12 }}>
          Winnify Admin
        </div>

        {NAV_ITEMS.map(({ path, label, icon, exact, prefix }) => {
          const isActive = exact
            ? location.pathname === path
            : location.pathname === path || (prefix ? location.pathname.startsWith(prefix) : false);
          return (
            <div key={path} onClick={() => navigate(path)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 8, cursor: "pointer", marginBottom: 2, fontSize: 14,
              background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
              color: isActive ? "#a5b4fc" : "#888", fontWeight: isActive ? 600 : 400,
            }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          );
        })}

        <div style={{ marginTop: "auto", borderTop: "1px solid #2a2a4a", paddingTop: 12 }}>
          <div style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600, padding: "0 8px" }}>
            {admin.name || admin.username}
          </div>
          <button onClick={admin.logout} style={{
            marginTop: 8, width: "100%", padding: "8px 12px", borderRadius: 8,
            border: "1px solid #2a2a4a", background: "transparent", color: "#888",
            cursor: "pointer", fontSize: 13, textAlign: "left",
          }}>Logout</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/schools" element={<SchoolsList />} />
          <Route path="/schools/:id" element={<SchoolDetail />} />
          <Route path="/questions" element={<QuestionsManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
