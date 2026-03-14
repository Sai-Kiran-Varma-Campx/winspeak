const KEY = "winspeak_v1";
const XP_PER_LEVEL = 500;

export interface Attempt {
  id: string;
  challengeId: string;
  challengeTitle: string;
  date: string; // ISO string
  score: number;
  xpEarned: number;
  skills?: Record<string, number>; // per-skill scores from analysis
}

interface StoredData {
  hasOnboarded: boolean;
  name: string;
  totalXp: number;
  streak: number;
  lastActivityDate: string;
  completedChallengeIds: string[];
  attempts: Attempt[];
}

function defaults(): StoredData {
  return {
    hasOnboarded: false,
    name: "",
    totalXp: 0,
    streak: 0,
    lastActivityDate: "",
    completedChallengeIds: [],
    attempts: [],
  };
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

function persist(data: StoredData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function computeLevel(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  return { level, xpInLevel, xpToNext: XP_PER_LEVEL, xpProgress };
}

export function relativeDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

import { useState, useCallback } from "react";

export interface UserStore {
  hasOnboarded: boolean;
  name: string;
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  xpProgress: number;
  streak: number;
  completedChallengeIds: string[];
  attempts: Attempt[];
  addAttempt(a: Omit<Attempt, "id" | "date">): void;
  setName(name: string): void;
  completeOnboarding(name: string): void;
  reset(): void;
}

export function useUserStore(): UserStore {
  const [data, setData] = useState<StoredData>(load);
  const { level, xpInLevel, xpToNext, xpProgress } = computeLevel(data.totalXp);

  const addAttempt = useCallback((a: Omit<Attempt, "id" | "date">) => {
    setData((prev) => {
      const today = new Date().toISOString().split("T")[0];
      let streak = prev.streak;
      if (prev.lastActivityDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];
        streak = prev.lastActivityDate === yStr ? streak + 1 : 1;
      }
      const completedIds = prev.completedChallengeIds.includes(a.challengeId)
        ? prev.completedChallengeIds
        : [...prev.completedChallengeIds, a.challengeId];
      const next: StoredData = {
        ...prev,
        totalXp: prev.totalXp + a.xpEarned,
        streak,
        lastActivityDate: today,
        completedChallengeIds: completedIds,
        attempts: [{ ...a, id: Date.now().toString(), date: new Date().toISOString() }, ...prev.attempts].slice(0, 20),
      };
      persist(next);
      return next;
    });
  }, []);

  const setName = useCallback((name: string) => {
    setData((prev) => {
      const next = { ...prev, name };
      persist(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((name: string) => {
    setData((prev) => {
      const next = { ...prev, name: name.trim(), hasOnboarded: true };
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const d = defaults();
    persist(d);
    setData(d);
  }, []);

  return {
    hasOnboarded: data.hasOnboarded,
    name: data.name,
    totalXp: data.totalXp,
    level,
    xpInLevel,
    xpToNext,
    xpProgress,
    streak: data.streak,
    completedChallengeIds: data.completedChallengeIds,
    attempts: data.attempts,
    addAttempt,
    setName,
    completeOnboarding,
    reset,
  };
}
