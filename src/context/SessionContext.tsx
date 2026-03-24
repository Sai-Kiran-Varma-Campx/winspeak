import { createContext, useContext, useState, useCallback } from "react";
import type { AnalysisResult } from "@/types";
import { saveAudioBlob, deleteAudioBlob, RECORDING_KEY } from "@/lib/audioStorage";

interface SessionState {
  challengeId: string | null;
  recordingBlob: Blob | null;
  transcript: string;
  analysisResult: AnalysisResult | null;
  setChallengeId: (id: string) => void;
  setRecordingBlob: (blob: Blob) => Promise<void>;
  setTranscript: (t: string) => void;
  setAnalysisResult: (r: AnalysisResult) => void;
  reset: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlobState] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const setRecordingBlob = useCallback(async (blob: Blob) => {
    setRecordingBlobState(blob);
    // Persist to IndexedDB so it survives navigation/refresh
    await saveAudioBlob(RECORDING_KEY, blob);
  }, []);

  const reset = useCallback(() => {
    setChallengeId(null);
    setRecordingBlobState(null);
    setTranscript("");
    setAnalysisResult(null);
    // Clean up stored blob when session is reset
    deleteAudioBlob(RECORDING_KEY).catch(() => {});
  }, []);

  return (
    <SessionContext.Provider
      value={{
        challengeId,
        recordingBlob,
        transcript,
        analysisResult,
        setChallengeId,
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
