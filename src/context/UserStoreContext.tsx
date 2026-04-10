import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useUserStore, type UserStore } from "@/hooks/useUserStore";
import { registerApiErrorHandler, unregisterApiErrorHandler } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const Ctx = createContext<UserStore | null>(null);

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const store = useUserStore();
  const { addToast } = useToast();

  // Wire API error handler → toast notifications
  useEffect(() => {
    registerApiErrorHandler((msg) => addToast(msg, "error"));
    return () => unregisterApiErrorHandler();
  }, [addToast]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): UserStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be inside UserStoreProvider");
  return ctx;
}
