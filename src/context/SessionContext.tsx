import { createContext, useContext, useState } from "react";
import type { AnalysisResult } from "@/types";
import { saveAudioBlob, deleteAudioBlob, RECORDING_KEY } from "@/lib/audioStorage";

interface SessionState {
  recordingBlob: Blob | null;
  transcript: string;
  analysisResult: AnalysisResult | null;
  setRecordingBlob: (blob: Blob) => void;
  setTranscript: (t: string) => void;
  setAnalysisResult: (r: AnalysisResult) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [recordingBlob, setRecordingBlobState] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  function setRecordingBlob(blob: Blob) {
    setRecordingBlobState(blob);
    // Persist to IndexedDB so it survives navigation/refresh
    saveAudioBlob(RECORDING_KEY, blob).catch(() => {});
  }

  function reset() {
    setRecordingBlobState(null);
    setTranscript("");
    setAnalysisResult(null);
    // Clean up stored blob when session is reset
    deleteAudioBlob(RECORDING_KEY).catch(() => {});
  }

  return (
    <SessionContext.Provider
      value={{
        recordingBlob,
        transcript,
        analysisResult,
        setRecordingBlob,
        setTranscript,
        setAnalysisResult,
        reset,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
