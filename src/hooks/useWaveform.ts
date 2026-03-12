import { useState, useEffect } from "react";
import { useInterval } from "./useInterval";

function randomBars(count: number): number[] {
  return Array.from({ length: count }, () => Math.random() * 40 + 8);
}

export function useWaveform(barCount: number, active: boolean) {
  const [bars, setBars] = useState<number[]>(() => randomBars(barCount));

  // Re-init when barCount changes
  useEffect(() => {
    setBars(randomBars(barCount));
  }, [barCount]);

  useInterval(
    () => setBars(randomBars(barCount)),
    active ? 100 : null
  );

  return { bars };
}
