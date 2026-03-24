import { Routes, Route, useLocation } from "react-router-dom";
import Spinner from "@/components/Spinner";
import AppSidebar from "@/components/AppSidebar";
import { SessionProvider } from "@/context/SessionContext";
import { UserStoreProvider } from "@/context/UserStoreContext";
import { useStore } from "@/context/UserStoreContext";
import MobileNav from "@/components/MobileNav";
import Login from "@/screens/Login";
import Dashboard from "@/screens/Dashboard";
import AudioCheck from "@/screens/AudioCheck";
import Question from "@/screens/Question";
import Recording from "@/screens/Recording";
import Analysing from "@/screens/Analysing";
import Report from "@/screens/Report";
import History from "@/screens/History";
import Leaderboard from "@/screens/Leaderboard";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/audiocheck" element={<AudioCheck />} />
        <Route path="/question" element={<Question />} />
        <Route path="/recording" element={<Recording />} />
        <Route path="/analysing" element={<Analysing />} />
        <Route path="/report/:attemptId" element={<Report />} />
        <Route path="/report" element={<Report />} />
        <Route path="/history" element={<History />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </div>
  );
}

function AppContent() {
  const store = useStore();

  if (store.loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!store.hasOnboarded) {
    return <Login />;
  }

  return (
    <div className="app-root">
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
    <UserStoreProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </UserStoreProvider>
  );
}
