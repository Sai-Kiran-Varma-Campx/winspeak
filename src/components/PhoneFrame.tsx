import { type ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="phone-frame">
      {/* Notch — desktop only, hidden on real mobile */}
      <div className="phone-notch">
        <div className="notch-pill">
          <div className="notch-cam" />
          <div className="notch-bar" />
        </div>
        <span className="notch-time">9:41</span>
      </div>

      {/* Scrollable content */}
      <div className="phone-body">{children}</div>
    </div>
  );
}
