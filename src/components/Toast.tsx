import { useToast, type ToastType } from "@/context/ToastContext";

const STYLE: Record<ToastType, { bg: string; border: string; color: string }> = {
  error:   { bg: "#FF4D6A18", border: "#FF4D6A66", color: "#FF7A8E" },
  success: { bg: "#22D37A18", border: "#22D37A66", color: "#4DEBA0" },
  info:    { bg: "#7C5CFC18", border: "#7C5CFC66", color: "#A78BFA" },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "min(90vw, 400px)",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const s = STYLE[t.type];
        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 14,
              padding: "12px 16px",
              color: s.color,
              fontSize: 13,
              fontWeight: 600,
              pointerEvents: "auto",
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              animation: "fadeSlideIn 0.3s ease",
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
