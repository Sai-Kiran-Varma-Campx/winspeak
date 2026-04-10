import { useEffect, useState } from "react";

const KEY = "winspeak_mode";
export type AppMode = "default" | "school";

function readInitial(): AppMode {
  if (typeof window === "undefined") return "default";

  // 1. ?mode=school|default in the URL — highest priority, persists into localStorage
  try {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("mode");
    if (q === "school" || q === "default") {
      localStorage.setItem(KEY, q);
      return q;
    }
  } catch {}

  // 2. Existing localStorage value (set by a previous URL flag)
  const stored = localStorage.getItem(KEY);
  if (stored === "school" || stored === "default") return stored;

  // 3. Fallback
  return "default";
}

let _mode: AppMode = readInitial();
const _listeners = new Set<(m: AppMode) => void>();

export function getMode(): AppMode {
  return _mode;
}

export function setMode(m: AppMode) {
  _mode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {}
  _listeners.forEach((fn) => fn(m));
}

export function isSchool(): boolean {
  return _mode === "school";
}

/** React hook — re-renders when mode changes anywhere in the app. */
export function useMode(): [AppMode, (m: AppMode) => void] {
  const [mode, setLocal] = useState<AppMode>(_mode);
  useEffect(() => {
    const fn = (m: AppMode) => setLocal(m);
    _listeners.add(fn);
    return () => {
      _listeners.delete(fn);
    };
  }, []);
  return [mode, setMode];
}

/** Apply mode → root html className so CSS can target `.mode-school`. */
export function syncModeClass(mode: AppMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("mode-school", mode === "school");
  document.documentElement.classList.toggle("mode-default", mode !== "school");
}
