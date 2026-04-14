import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: "#CC6B7E",
        color: "#fff",
        textAlign: "center",
        padding: "6px 12px",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      You're offline. Some features may not work.
    </div>
  );
}
