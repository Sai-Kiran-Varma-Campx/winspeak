import { useToast, type ToastType } from "@/context/ToastContext";

const STYLE: Record<ToastType, { bg: string; border: string; color: string }> = {
  error:   { bg: "#CC6B7E18", border: "#CC6B7E66", color: "#C48A96" },
  success: { bg: "#5BAF7E18", border: "#5BAF7E66", color: "#7BC4A0" },
  info:    { bg: "#8B80C018", border: "#8B80C066", color: "#9990B8" },
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
