import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import { CHALLENGES } from "@/constants";

export default function Dashboard() {
  const navigate = useNavigate();
  const { seconds, start } = useCountdown(87600);

  useEffect(() => {
    start();
  }, [start]);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const activeChallenge = CHALLENGES.find((c) => c.status === "active")!;
  const otherChallenges = CHALLENGES.filter((c) => c.status !== "active");

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="flex justify-between items-center py-4 pb-6">
        <div>
          <div className="text-[12px] font-medium" style={{ color: "var(--muted)" }}>
            GOOD MORNING
          </div>
          <div className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>
            Sameer 👋
          </div>
        </div>
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px]"
          style={{
            background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
            boxShadow: "0 4px 16px var(--accent-glow)",
            color: "#fff",
          }}
        >
          S
        </div>
      </div>

      {/* XP Bar */}
      <div
        className="border rounded-[16px] p-3.5 mb-5 flex items-center gap-3"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="text-2xl">⚡</div>
        <div className="flex-1">
          <div className="flex justify-between mb-1.5">
            <span className="text-[13px] font-bold">Total XP: 3,450</span>
            <span className="text-[12px]" style={{ color: "var(--muted)" }}>
              Level 8
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "72%",
                background: "linear-gradient(90deg,#FFB830,#FFB830cc)",
                boxShadow: "0 0 8px #FFB83088",
              }}
            />
          </div>
        </div>
      </div>

      {/* Weekly Challenge Header */}
      <div className="flex justify-between items-center mb-3.5">
        <div>
          <div
            className="text-[11px] font-semibold tracking-[1.5px] mb-0.5"
            style={{ color: "var(--muted)" }}
          >
            WEEKLY CHALLENGE
          </div>
          <div className="text-[16px] font-extrabold">Week 2</div>
        </div>
        <div
          className="border rounded-[12px] px-3.5 py-2 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="text-[16px] font-extrabold"
            style={{ color: "var(--yellow)" }}
          >
            {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
            remaining
          </div>
        </div>
      </div>

      {/* Active Challenge Card */}
      <div
        className="border rounded-[22px] p-5 mb-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,#1A1D2E,#13151C)",
          borderColor: "#7C5CFC44",
        }}
      >
        {/* Glow blob */}
        <div
          className="absolute"
          style={{
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "var(--accent-glow)",
            filter: "blur(40px)",
          }}
        />
        <div className="flex justify-between items-start mb-3">
          <Badge variant="active">ACTIVE</Badge>
          <div
            className="border rounded-[8px] px-2.5 py-1 text-[12px] font-bold"
            style={{
              background: "#FFB83022",
              color: "#FFB830",
              borderColor: "#FFB83044",
            }}
          >
            ⚡ {activeChallenge.xp} XP
          </div>
        </div>
        <div className="text-[20px] font-extrabold mb-1.5">{activeChallenge.title}</div>
        <div className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
          {activeChallenge.description}
        </div>
        {activeChallenge.deadline && (
          <div className="text-[12px] font-semibold mb-4" style={{ color: "#FFB830" }}>
            🗓 {activeChallenge.deadline}
          </div>
        )}
        <Button onClick={() => navigate("/audiocheck")}>Start Challenge →</Button>
      </div>

      {/* Other challenges */}
      {otherChallenges.map((ch) => (
        <div
          key={ch.id}
          className="border rounded-[18px] p-4 flex items-center gap-3.5 mb-2.5"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            opacity: ch.status === "locked" ? 0.5 : 1,
          }}
        >
          <div
            className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
            style={{ background: "var(--surface)", color: "var(--muted)" }}
          >
            {ch.week}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold">{ch.title}</div>
            <div className="text-[12px]" style={{ color: "var(--muted)" }}>
              {ch.xp} XP
            </div>
          </div>
          <Badge variant={ch.status}>{ch.status.toUpperCase()}</Badge>
        </div>
      ))}

      {/* Bottom tab bar (decorative) */}
      <div
        className="border rounded-[16px] p-3 flex justify-around mt-2"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--accent)" }}>
          🏠 Home
        </div>
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--muted)" }}>
          📊 Stats
        </div>
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--muted)" }}>
          🏆 Leaderboard
        </div>
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--muted)" }}>
          👤 Profile
        </div>
      </div>
    </div>
  );
}
