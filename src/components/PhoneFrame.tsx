import { type ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div
      style={{ background: "#05060A" }}
      className="min-h-screen flex justify-center items-start pt-0 pb-10"
    >
      <div
        className="w-[390px] mt-5 rounded-[44px] overflow-hidden flex flex-col"
        style={{
          background: "var(--bg)",
          boxShadow:
            "0 0 0 1px #ffffff18, 0 40px 80px #000, 0 0 60px var(--accent-glow)",
          minHeight: "844px",
        }}
      >
        {/* Notch */}
        <div
          className="h-11 flex items-center justify-center flex-shrink-0 relative z-10"
          style={{ background: "var(--bg)" }}
        >
          <div
            className="flex items-center justify-center gap-1.5"
            style={{
              width: 120,
              height: 30,
              background: "#000",
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#1a1a1a",
                border: "1px solid #333",
              }}
            />
            <div
              style={{
                width: 60,
                height: 6,
                borderRadius: 3,
                background: "#111",
              }}
            />
          </div>
          <span
            className="absolute right-6 top-1/2 -translate-y-1/2 text-[11px] font-semibold"
            style={{ color: "var(--text)" }}
          >
            9:41
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
