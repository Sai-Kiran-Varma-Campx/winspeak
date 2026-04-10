import type { AnalysisResult } from "@/types";
import { api, getToken, setToken, clearToken, registerUnauthorizedHandler, unregisterUnauthorizedHandler, reportApiError } from "@/lib/api";

const XP_PER_LEVEL = 500;

export interface Attempt {
  id: string;
  challengeId: string;
  challengeTitle: string;
  date: string; // ISO string
  score: number;
  xpEarned: number;
  passed?: boolean;
  skills?: Record<string, number>; // per-skill scores from analysis
  analysisResult?: AnalysisResult;
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

// Map DB attempt row to frontend Attempt shape
function mapAttempt(row: any): Attempt {
  return {
    id: row.id,
    challengeId: row.challengeId ?? row.challenge_id,
    challengeTitle: row.challengeTitle ?? row.challenge_title,
    date: row.createdAt ?? row.created_at ?? row.date,
    score: row.score,
    xpEarned: row.xpEarned ?? row.xp_earned,
    passed: row.passed,
    skills: row.skills ?? buildSkillsFromRow(row),
    analysisResult: row.analysisResult ?? row.analysis_result,
  };
}

function buildSkillsFromRow(row: any): Record<string, number> | undefined {
  const f = row.skillFluency ?? row.skill_fluency;
  if (f == null) return undefined;
  return {
    Fluency: f,
    Grammar: row.skillGrammar ?? row.skill_grammar,
    Vocabulary: row.skillVocabulary ?? row.skill_vocabulary,
    Clarity: row.skillClarity ?? row.skill_clarity,
    Structure: row.skillStructure ?? row.skill_structure,
    Relevancy: row.skillRelevancy ?? row.skill_relevancy,
  };
}

import { useState, useCallback, useEffect, useRef } from "react";

interface StoreState {
  hasOnboarded: boolean;
  name: string;
  totalXp: number;
  streak: number;
  grades: number[];
  completedChallengeIds: string[];
  attempts: Attempt[];
  loading: boolean;
  authError: string | null;
}

function defaults(): StoreState {
  return {
    hasOnboarded: false,
    name: "",
    totalXp: 0,
    streak: 0,
    grades: [],
    completedChallengeIds: [],
    attempts: [],
    loading: true,
    authError: null,
  };
}

export interface UserStore {
  hasOnboarded: boolean;
  name: string;
  totalXp: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  xpProgress: number;
  streak: number;
  grades: number[];
  completedChallengeIds: string[];
  attempts: Attempt[];
  loading: boolean;
  authError: string | null;
  getAttemptById(id: string): Attempt | undefined;
  getAttemptsForChallenge(challengeId: string): Attempt[];
  addAttempt(a: Omit<Attempt, "id" | "date">): void;
  resetChallengeAttempts(challengeId: string): void;
  setName(name: string): void;
  login(username: string, password: string): Promise<void>;
  signup(username: string, password: string, name?: string, grades?: number[]): Promise<void>;
  resetPassword(username: string, newPassword: string): Promise<void>;
  logout(): void;
  reset(): void;
}

export function useUserStore(): UserStore {
  const [data, setData] = useState<StoreState>(defaults);
  const { level, xpInLevel, xpToNext, xpProgress } = computeLevel(data.totalXp);
  const initRef = useRef(false);

  // Register global 401 handler — auto-logout on expired JWT
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setData({ ...defaults(), loading: false });
    });
    return () => unregisterUnauthorizedHandler();
  }, []);

  // Load from API on mount (only if we have a token)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const token = getToken();
    if (!token) {
      // No token — show login immediately
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    (async () => {
      try {
        const me = await api.getMe();
        const attemptsData = await api.getAttempts({ limit: 50 });
        setData({
          hasOnboarded: me.hasOnboarded ?? me.has_onboarded,
          name: me.name,
          totalXp: me.totalXp ?? me.total_xp,
          streak: me.streak,
          grades: me.grades ?? [],
          completedChallengeIds: me.completedChallengeIds ?? me.completed_challenge_ids ?? [],
          attempts: attemptsData.map(mapAttempt),
          loading: false,
          authError: null,
        });
      } catch {
        // Token invalid/expired — clear and show login
        clearToken();
        setData((prev) => ({ ...prev, loading: false }));
      }
    })();
  }, []);

  const getAttemptById = useCallback(
    (id: string) => data.attempts.find((a) => a.id === id),
    [data.attempts]
  );

  const getAttemptsForChallenge = useCallback(
    (challengeId: string) => data.attempts.filter((a) => a.challengeId === challengeId),
    [data.attempts]
  );

  const addAttempt = useCallback((a: Omit<Attempt, "id" | "date">) => {
    // Optimistically update local state
    const tempId = `temp_${Date.now()}`;
    const tempAttempt: Attempt = { ...a, id: tempId, date: new Date().toISOString() };

    setData((prev) => {
      const completedIds =
        a.passed && !prev.completedChallengeIds.includes(a.challengeId)
          ? [...prev.completedChallengeIds, a.challengeId]
          : prev.completedChallengeIds;
      return {
        ...prev,
        totalXp: prev.totalXp + a.xpEarned,
        completedChallengeIds: completedIds,
        attempts: [tempAttempt, ...prev.attempts].slice(0, 50),
      };
    });

    // Fire and forget — server is source of truth on next load
    api
      .createAttempt({
        challengeId: a.challengeId,
        challengeTitle: a.challengeTitle,
        score: a.score,
        xpEarned: a.xpEarned,
        passed: a.passed ?? false,
        skills: a.skills,
        analysisResult: a.analysisResult,
      })
      .then((saved) => {
        // Replace temp with server ID
        setData((prev) => ({
          ...prev,
          attempts: prev.attempts.map((att) =>
            att.id === tempId ? mapAttempt(saved) : att
          ),
        }));
      })
      .catch(() => reportApiError("Failed to save attempt"));
  }, []);

  const resetChallengeAttempts = useCallback((challengeId: string) => {
    setData((prev) => ({
      ...prev,
      attempts: prev.attempts.filter((a) => a.challengeId !== challengeId),
      completedChallengeIds: prev.completedChallengeIds.filter((id) => id !== challengeId),
    }));

    api.resetChallenge(challengeId).then(async () => {
      // Refresh XP from server
      try {
        const me = await api.getMe();
        setData((prev) => ({
          ...prev,
          totalXp: me.totalXp ?? me.total_xp,
        }));
      } catch {}
    }).catch(() => reportApiError("Failed to reset challenge"));
  }, []);

  const setName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, name }));
    api.updateName(name).catch(() => reportApiError("Failed to update name"));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setData((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      const res = await api.login(username, password);
      setToken(res.token);
      // Fetch full profile
      const me = await api.getMe();
      const attemptsData = await api.getAttempts({ limit: 50 });
      setData({
        hasOnboarded: true,
        name: me.name,
        totalXp: me.totalXp ?? me.total_xp,
        streak: me.streak,
        grades: me.grades ?? [],
        completedChallengeIds: me.completedChallengeIds ?? me.completed_challenge_ids ?? [],
        attempts: attemptsData.map(mapAttempt),
        loading: false,
        authError: null,
      });
    } catch (e: any) {
      const msg = e?.message || "Login failed";
      // Extract server error message if possible
      const match = msg.match(/API \d+: (.*)/);
      let errorText = "Invalid username or password";
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          errorText = parsed.error || errorText;
        } catch {
          errorText = match[1] || errorText;
        }
      }
      setData((prev) => ({ ...prev, loading: false, authError: errorText }));
    }
  }, []);

  const signup = useCallback(async (username: string, password: string, name?: string, grades?: number[]) => {
    setData((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      const res = await api.signup(username, password, name, grades);
      setToken(res.token);
      setData({
        hasOnboarded: true,
        name: res.user.name,
        totalXp: 0,
        streak: 0,
        grades: res.user.grades ?? [],
        completedChallengeIds: [],
        attempts: [],
        loading: false,
        authError: null,
      });
    } catch (e: any) {
      const msg = e?.message || "Signup failed";
      const match = msg.match(/API \d+: (.*)/);
      let errorText = "Signup failed";
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          errorText = parsed.error || errorText;
        } catch {
          errorText = match[1] || errorText;
        }
      }
      setData((prev) => ({ ...prev, loading: false, authError: errorText }));
    }
  }, []);

  const resetPassword = useCallback(async (username: string, newPassword: string) => {
    setData((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      await api.resetPassword(username, newPassword);
      setData((prev) => ({ ...prev, loading: false, authError: null }));
    } catch (e: any) {
      const msg = e?.message || "Reset failed";
      const match = msg.match(/API \d+: (.*)/);
      let errorText = "Password reset failed";
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          errorText = parsed.error || errorText;
        } catch {
          errorText = match[1] || errorText;
        }
      }
      setData((prev) => ({ ...prev, loading: false, authError: errorText }));
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setData({ ...defaults(), loading: false });
  }, []);

  const reset = useCallback(() => {
    clearToken();
    setData({ ...defaults(), loading: false });
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
    grades: data.grades,
    completedChallengeIds: data.completedChallengeIds,
    attempts: data.attempts,
    loading: data.loading,
    authError: data.authError,
    getAttemptById,
    getAttemptsForChallenge,
    addAttempt,
    resetChallengeAttempts,
    setName,
    login,
    signup,
    resetPassword,
    logout,
    reset,
  };
}
