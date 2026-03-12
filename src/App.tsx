import { Routes, Route, useLocation } from "react-router-dom";
import ScreenNav from "@/components/ScreenNav";
import PhoneFrame from "@/components/PhoneFrame";
import Dashboard from "@/screens/Dashboard";
import AudioCheck from "@/screens/AudioCheck";
import Question from "@/screens/Question";
import Recording from "@/screens/Recording";
import Analysing from "@/screens/Analysing";
import Report from "@/screens/Report";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter h-full">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/audiocheck" element={<AudioCheck />} />
        <Route path="/question" element={<Question />} />
        <Route path="/recording" element={<Recording />} />
        <Route path="/analysing" element={<Analysing />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <ScreenNav />

      {/* ── Desktop atmospheric background ── */}
      <div className="desktop-bg" aria-hidden="true">
        <div className="glow-blob glow-blob-tl" />
        <div className="glow-blob glow-blob-br" />
        <div className="glow-blob glow-blob-mid" />
      </div>

      {/* ── Phone / App shell ── */}
      <div className="phone-shell">
        <PhoneFrame>
          <AnimatedRoutes />
        </PhoneFrame>

        {/* Desktop-only branding label below phone */}
        <p className="desktop-brand">WINSPEAK · AI SPEAKING COACH</p>
      </div>
    </div>
  );
}
