const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "winspeak_jwt";
const REQUEST_TIMEOUT_MS = 30_000;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// --- 401 Unauthorized handler ---
let _onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

export function unregisterUnauthorizedHandler() {
  _onUnauthorized = null;
}

// --- API error handler (for toast notifications) ---
let _onApiError: ((message: string) => void) | null = null;

export function registerApiErrorHandler(handler: (message: string) => void) {
  _onApiError = handler;
}

export function unregisterApiErrorHandler() {
  _onApiError = null;
}

export function reportApiError(message: string) {
  if (_onApiError) {
    _onApiError(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // AbortController with 30s timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      throw new Error(`Request to ${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    clearToken();
    _onUnauthorized?.();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  // Auth
  signup(username: string, password: string, name?: string, grades?: number[]) {
    return request<{ token: string; user: { id: string; name: string; grades: number[] } }>("/users/signup", {
      method: "POST",
      body: JSON.stringify({ username, password, name, grades }),
    });
  },

  login(username: string, password: string) {
    return request<{ token: string; user: { id: string; name: string } }>("/users/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  resetPassword(username: string, password: string) {
    return request<{ ok: boolean }>("/users/reset-password", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  // Users
  getMe() {
    return request<any>("/users/me");
  },

  updateName(name: string) {
    return request<any>("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
  },

  // Attempts
  getAttempts(params?: { challengeId?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.challengeId) qs.set("challengeId", params.challengeId);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<any[]>(`/users/me/attempts${query ? `?${query}` : ""}`);
  },

  createAttempt(data: {
    challengeId: string;
    challengeTitle: string;
    score: number;
    xpEarned: number;
    passed: boolean;
    skills?: Record<string, number>;
    analysisResult?: any;
  }) {
    return request<any>("/users/me/attempts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  resetChallenge(challengeId: string) {
    return request<any>(`/users/me/attempts?challengeId=${challengeId}`, {
      method: "DELETE",
    });
  },

  // Leaderboard
  getLeaderboard(limit = 20) {
    return request<any[]>(`/leaderboard?limit=${limit}`);
  },

  // ── School POC ──
  listStudents(grade?: number) {
    const qs = grade ? `?grade=${grade}` : "";
    return request<any[]>(`/school/students${qs}`);
  },
  createStudent(data: {
    fullName: string;
    studentExternalId?: string | null;
    grade: number;
    section?: string | null;
    parentEmail?: string | null;
  }) {
    return request<any>("/school/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteStudent(id: string) {
    return request<{ ok: boolean }>(`/school/students/${id}`, { method: "DELETE" });
  },
  createSchoolAttempt(data: {
    studentId: string;
    categoryId: string;
    questionId: string;
    questionTitle: string;
    grade: number;
    score: number;
    skills?: Record<string, number>;
    confidenceScore?: number;
    analysisResult?: any;
  }) {
    return request<any>("/school/attempts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  listSchoolAttempts(params?: { studentId?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.studentId) qs.set("studentId", params.studentId);
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return request<any[]>(`/school/attempts${query ? `?${query}` : ""}`);
  },
  getSchoolAttempt(id: string) {
    return request<any>(`/school/attempts/${id}`);
  },
};
