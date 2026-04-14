import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { adminApi, getAdminToken, setAdminToken, clearAdminToken } from "@/lib/adminApi";

interface AdminState {
  isLoggedIn: boolean;
  name: string;
  username: string;
  loading: boolean;
  authError: string | null;
}

interface AdminStore extends AdminState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>({
    isLoggedIn: false, name: "", username: "", loading: true, authError: null,
  });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const token = getAdminToken();
    if (!token) { setState((p) => ({ ...p, loading: false })); return; }

    adminApi.getMe()
      .then((me) => setState({ isLoggedIn: true, name: me.name, username: me.username, loading: false, authError: null }))
      .catch(() => { clearAdminToken(); setState((p) => ({ ...p, loading: false })); });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState((p) => ({ ...p, loading: true, authError: null }));
    try {
      const res = await adminApi.login(username, password);
      setAdminToken(res.token);
      setState({ isLoggedIn: true, name: res.admin.name, username: res.admin.username, loading: false, authError: null });
    } catch (e: any) {
      const msg = e?.message || "Login failed";
      let errorText = "Invalid credentials";
      const match = msg.match(/API \d+: (.*)/);
      if (match) { try { errorText = JSON.parse(match[1]).error || errorText; } catch { errorText = match[1] || errorText; } }
      setState((p) => ({ ...p, loading: false, authError: errorText }));
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setState({ isLoggedIn: false, name: "", username: "", loading: false, authError: null });
  }, []);

  return <Ctx.Provider value={{ ...state, login, logout }}>{children}</Ctx.Provider>;
}

export function useAdminStore(): AdminStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be inside AdminStoreProvider");
  return ctx;
}
