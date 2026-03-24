import { useState, useRef, useCallback, useEffect } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stoppedRef = useRef(false);

  // Cleanup mic on unmount
  useEffect(() => {
    return () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      try {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch {}
    };
  }, []);

  const startRecording = useCallback(async () => {
    chunksRef.current = [];
    stoppedRef.current = false;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // Safari only supports mp4/aac — try that before webm/opus
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/mp4")
      ? "audio/mp4"
      : "";

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      resolveRef.current?.(blob);
      resolveRef.current = null;
    };

    recorder.start(250); // collect chunks every 250ms
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback((): Promise<Blob> => {
    // Double-stop guard
    if (stoppedRef.current) {
      return new Promise((resolve) => {
        // Return whatever chunks we have
        const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || "" });
        resolve(blob);
      });
    }
    stoppedRef.current = true;

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // MediaRecorder already stopped — resolve with available chunks
        const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || "" });
        resolve(blob);
      }
      setIsRecording(false);
    });
  }, []);

  return { startRecording, stopRecording, isRecording };
}
