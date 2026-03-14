import { createContext, useContext, type ReactNode } from "react";
import { useUserStore, type UserStore } from "@/hooks/useUserStore";

const Ctx = createContext<UserStore | null>(null);

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const store = useUserStore();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): UserStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be inside UserStoreProvider");
  return ctx;
}
