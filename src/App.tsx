import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { SessionProvider } from "@/context/SessionContext";
import { UserStoreProvider } from "@/context/UserStoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { SchoolSessionProvider } from "@/context/SchoolSessionContext";
import { AdminStoreProvider, useAdminStore } from "@/context/AdminStoreContext";
import ToastContainer from "@/components/Toast";
import OfflineBanner from "@/components/OfflineBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useStore } from "@/context/UserStoreContext";
import { syncModeClass } from "@/hooks/useMode";
import SchoolTopNav from "@/components/SchoolTopNav";
import CloudsBg from "@/components/CloudsBg";
import SchoolBgDecorations from "@/components/SchoolBgDecorations";
import Login from "@/screens/Login";
import AdminLogin from "@/screens/admin/AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
// School screens
import TeacherHome from "@/screens/school/TeacherHome";
import ChallengeStep1Category from "@/screens/school/ChallengeStep1Category";
import ChallengeStep2GradeQuestion from "@/screens/school/ChallengeStep2GradeQuestion";
import ChallengeStep3Administer from "@/screens/school/ChallengeStep3Administer";
import SchoolRecording from "@/screens/school/SchoolRecording";
import SchoolReport from "@/screens/school/SchoolReport";
import StudentsList from "@/screens/school/StudentsList";
import ReportsList from "@/screens/school/ReportsList";
import ClassReport from "@/screens/school/ClassReport";
import CustomChallenges from "@/screens/school/CustomChallenges";

function SchoolRoutes() {
  const location = useLocation();
  if (location.pathname === "/") {
    return <Navigate to="/school" replace />;
  }
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/school" replace />} />
        <Route path="/school" element={<TeacherHome />} />
        <Route path="/school/students" element={<StudentsList />} />
        <Route path="/school/custom-challenges" element={<CustomChallenges />} />
        <Route path="/school/administer" element={<ChallengeStep1Category />} />
        <Route path="/school/administer/grade" element={<ChallengeStep2GradeQuestion />} />
        <Route path="/school/administer/run" element={<ChallengeStep3Administer />} />
        <Route path="/school/recording" element={<SchoolRecording />} />
        <Route path="/school/reports" element={<ReportsList />} />
        <Route path="/school/report/:id" element={<SchoolReport />} />
        <Route path="/school/class-report/:grade/:questionId" element={<ClassReport />} />
        {/* Catch all → home */}
        <Route path="*" element={<Navigate to="/school" replace />} />
      </Routes>
    </div>
  );
}

function AdminApp() {
  const admin = useAdminStore();

  if (admin.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f0f23" }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (!admin.isLoggedIn) {
    return <AdminLogin />;
  }

  return <AdminLayout />;
}

function SchoolApp() {
  const store = useStore();

  useEffect(() => {
    syncModeClass("school");
  }, []);

  if (store.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!store.hasOnboarded) {
    return <Login />;
  }

  return (
    <div className="school-layout">
      <CloudsBg />
      <SchoolBgDecorations />
      <SchoolTopNav />
      <div className="school-body">
        <div className="school-content">
          <SchoolRoutes />
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <AdminStoreProvider>
        <AdminApp />
      </AdminStoreProvider>
    );
  }

  return (
    <UserStoreProvider>
      <SessionProvider>
        <SchoolSessionProvider>
          <SchoolApp />
        </SchoolSessionProvider>
      </SessionProvider>
    </UserStoreProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <OfflineBanner />
        <AppRouter />
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
