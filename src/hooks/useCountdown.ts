import { useState, useCallback } from "react";
import { useInterval } from "./useInterval";

export function useCountdown(initial: number) {
  const [seconds, setSeconds] = useState(initial);
  const [isRunning, setIsRunning] = useState(false);

  useInterval(
    () => {
      setSeconds((s) => {
        if (s <= 0) {
          setIsRunning(false);
          return 0;
        }
        return s - 1;
      });
    },
    isRunning ? 1000 : null
  );

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((value?: number) => {
    setIsRunning(false);
    setSeconds(value ?? initial);
  }, [initial]);

  return { seconds, isRunning, start, pause, reset };
}
