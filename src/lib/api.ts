const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "winspeak_jwt";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  // Auth
  signup(username: string, password: string, name?: string) {
    return request<{ token: string; user: { id: string; name: string } }>("/users/signup", {
      method: "POST",
      body: JSON.stringify({ username, password, name }),
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
};
