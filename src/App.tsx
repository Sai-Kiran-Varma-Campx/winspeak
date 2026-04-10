import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Spinner from "@/components/Spinner";
import AppSidebar from "@/components/AppSidebar";
import { SessionProvider } from "@/context/SessionContext";
import { UserStoreProvider } from "@/context/UserStoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { SchoolSessionProvider } from "@/context/SchoolSessionContext";
import ToastContainer from "@/components/Toast";
import OfflineBanner from "@/components/OfflineBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useStore } from "@/context/UserStoreContext";
import { useMode, syncModeClass } from "@/hooks/useMode";
import MobileNav from "@/components/MobileNav";
import SchoolTopNav from "@/components/SchoolTopNav";
import ModeSwitcher from "@/components/ModeSwitcher";
import Login from "@/screens/Login";
import Dashboard from "@/screens/Dashboard";
import AudioCheck from "@/screens/AudioCheck";
import Question from "@/screens/Question";
import Recording from "@/screens/Recording";
import Analysing from "@/screens/Analysing";
import Report from "@/screens/Report";
import History from "@/screens/History";
import Leaderboard from "@/screens/Leaderboard";
import InterviewPrep from "@/screens/InterviewPrep";
// School POC screens
import TeacherHome from "@/screens/school/TeacherHome";
import TeacherDashboard from "@/screens/school/TeacherDashboard";
import ChallengeStep1Category from "@/screens/school/ChallengeStep1Category";
import ChallengeStep2GradeQuestion from "@/screens/school/ChallengeStep2GradeQuestion";
import ChallengeStep3Administer from "@/screens/school/ChallengeStep3Administer";
import SchoolRecording from "@/screens/school/SchoolRecording";
import SchoolReport from "@/screens/school/SchoolReport";
import StudentsList from "@/screens/school/StudentsList";
import ReportsList from "@/screens/school/ReportsList";

function AnimatedRoutes() {
  const location = useLocation();
  const [mode] = useMode();
  // School mode: bounce root → /school
  if (mode === "school" && location.pathname === "/") {
    return <Navigate to="/school" replace />;
  }
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />
        <Route path="/audiocheck" element={<AudioCheck />} />
        <Route path="/question" element={<Question />} />
        <Route path="/recording" element={<Recording />} />
        <Route path="/analysing" element={<Analysing />} />
        <Route path="/report/:attemptId" element={<Report />} />
        <Route path="/report" element={<Report />} />
        <Route path="/history" element={<History />} />
        <Route path="/leaderboard" element={<Leaderboard />} />

        {/* School POC routes */}
        <Route path="/school" element={<TeacherHome />} />
        <Route path="/school/students" element={<StudentsList />} />
        <Route path="/school/dashboard" element={<TeacherDashboard />} />
        <Route path="/school/administer" element={<ChallengeStep1Category />} />
        <Route path="/school/administer/grade" element={<ChallengeStep2GradeQuestion />} />
        <Route path="/school/administer/run" element={<ChallengeStep3Administer />} />
        <Route path="/school/recording" element={<SchoolRecording />} />
        <Route path="/school/reports" element={<ReportsList />} />
        <Route path="/school/report/:id" element={<SchoolReport />} />
      </Routes>
    </div>
  );
}

function AppContent() {
  const store = useStore();
  const [mode] = useMode();

  // Apply <html> class on mount + whenever mode changes so school styles take effect.
  useEffect(() => {
    syncModeClass(mode);
  }, [mode]);

  if (store.loading) {
    return (
      <>
        <ModeSwitcher />
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}>
          <Spinner size={32} />
        </div>
      </>
    );
  }

  if (!store.hasOnboarded) {
    return (
      <>
        <ModeSwitcher />
        <Login />
      </>
    );
  }

  if (mode === "school") {
    return (
      <div className="school-layout">
        <ModeSwitcher />
        <SchoolTopNav />
        <div className="school-content">
          <AnimatedRoutes />
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <ModeSwitcher />
      <div className="app-body">
        <AppSidebar />
        <main className="app-main">
          <div className="screen-wrapper">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <UserStoreProvider>
          <SessionProvider>
            <SchoolSessionProvider>
              <OfflineBanner />
              <AppContent />
              <ToastContainer />
            </SchoolSessionProvider>
          </SessionProvider>
        </UserStoreProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
