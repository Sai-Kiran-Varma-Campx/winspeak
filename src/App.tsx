import { Routes, Route } from "react-router-dom";
import ScreenNav from "@/components/ScreenNav";
import PhoneFrame from "@/components/PhoneFrame";
import Dashboard from "@/screens/Dashboard";
import AudioCheck from "@/screens/AudioCheck";
import Question from "@/screens/Question";
import Recording from "@/screens/Recording";
import Analysing from "@/screens/Analysing";
import Report from "@/screens/Report";

export default function App() {
  return (
    <>
      <ScreenNav />
      <div style={{ paddingTop: import.meta.env.DEV ? 52 : 0 }}>
        <PhoneFrame>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/audiocheck" element={<AudioCheck />} />
            <Route path="/question" element={<Question />} />
            <Route path="/recording" element={<Recording />} />
            <Route path="/analysing" element={<Analysing />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </PhoneFrame>
      </div>
    </>
  );
}
