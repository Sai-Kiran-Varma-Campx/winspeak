const API_BASE = import.meta.env.VITE_API_URL || "/api";
const ADMIN_TOKEN_KEY = "winnify_admin_jwt";
const REQUEST_TIMEOUT_MS = 30_000;

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAdminToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") throw new Error(`Request timed out`);
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    clearAdminToken();
    throw new Error("Admin session expired");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const adminApi = {
  login(username: string, password: string) {
    return request<{ token: string; admin: { id: string; name: string; username: string } }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  getMe() {
    return request<{ id: string; name: string; username: string }>("/admin/me");
  },
  listSchools() {
    return request<any[]>("/admin/schools");
  },
  createSchool(data: { name: string; code: string; address?: string; contactEmail?: string }) {
    return request<any>("/admin/schools", { method: "POST", body: JSON.stringify(data) });
  },
  updateSchool(id: string, data: { name?: string; address?: string; contactEmail?: string; isActive?: boolean }) {
    return request<any>(`/admin/schools/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteSchool(id: string) {
    return request<{ ok: boolean }>(`/admin/schools/${id}`, { method: "DELETE" });
  },
  listTeachers(schoolId: string) {
    return request<any[]>(`/admin/schools/${schoolId}/teachers`);
  },
  createTeacher(schoolId: string, data: { name: string; username: string; password: string; grades?: number[] }) {
    return request<any>(`/admin/schools/${schoolId}/teachers`, { method: "POST", body: JSON.stringify(data) });
  },
  bulkImportTeachers(schoolId: string, teachers: { name: string; grades?: string }[]) {
    return request<{ created: number; teachers: { name: string; username: string; password: string }[] }>(
      `/admin/schools/${schoolId}/teachers/bulk`,
      { method: "POST", body: JSON.stringify({ teachers }) }
    );
  },
  deleteTeacher(id: string) {
    return request<{ ok: boolean }>(`/admin/teachers/${id}`, { method: "DELETE" });
  },
  getStats() {
    return request<{ schools: number; teachers: number; students: number; attempts: number; recentTeachers: any[]; recentSchools: any[] }>("/admin/stats");
  },
  getSchoolStats(schoolId: string) {
    return request<{ teachers: number; students: number; attempts: number }>(`/admin/schools/${schoolId}/stats`);
  },
  listQuestions() {
    return request<any[]>("/admin/questions");
  },
  createQuestion(data: { id: string; categoryId: string; questionNumber: number; title: string; prompt: string; scenario: string; durationSecs?: number }) {
    return request<any>("/admin/questions", { method: "POST", body: JSON.stringify(data) });
  },
  updateQuestion(id: string, data: { title?: string; prompt?: string; scenario?: string; durationSecs?: number }) {
    return request<any>(`/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteQuestion(id: string) {
    return request<{ ok: boolean }>(`/admin/questions/${id}`, { method: "DELETE" });
  },
};
