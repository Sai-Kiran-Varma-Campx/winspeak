import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import { CHALLENGES } from "@/constants";
import { useStore } from "@/context/UserStoreContext";
import { greeting, relativeDate } from "@/hooks/useUserStore";
import type { BadgeVariant } from "@/types";

function scoreColor(score: number) {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

function challengeStatus(
  id: string,
  idx: number,
  completedIds: string[]
): BadgeVariant {
  if (completedIds.includes(id)) return "completed";
  const allPrevDone = CHALLENGES.slice(0, idx).every((c) =>
    completedIds.includes(c.id)
  );
  return allPrevDone ? "active" : "locked";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const store = useStore();
  const { seconds, start } = useCountdown(87600);
  const [xpBarWidth, setXpBarWidth] = useState(0);

  useEffect(() => {
    start();
  }, [start]);

  // Animate XP bar on mount
  useEffect(() => {
    const t = setTimeout(() => setXpBarWidth(store.xpProgress), 300);
    return () => clearTimeout(t);
  }, [store.xpProgress]);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const challenges = CHALLENGES.map((c, i) => ({
    ...c,
    status: challengeStatus(c.id, i, store.completedChallengeIds),
  }));
  const activeChallenge = challenges.find((c) => c.status === "active")!;
  const otherChallenges = challenges.filter((c) => c.id !== activeChallenge?.id);

  const countdownEl = (
    <div
      className="border rounded-[12px] px-3.5 py-2 text-center"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="text-[16px] font-extrabold" style={{ color: "var(--yellow)" }}>
        {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
        remaining
      </div>
    </div>
  );

  const nameInitial = store.name.charAt(0).toUpperCase();

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="flex justify-between items-center py-4 pb-5">
        <div>
          <div className="text-[12px] font-medium" style={{ color: "var(--muted)" }}>
            {greeting().toUpperCase()}
          </div>
          <div className="text-[22px] font-extrabold" style={{ color: "var(--text)" }}>
            {store.name} 👋
          </div>
        </div>
        <div className="flex items-center gap-3">
          {store.streak > 0 && (
            <div
              className="border rounded-[10px] px-3 py-1.5 flex items-center gap-1.5"
              style={{ background: "#FF4D6A11", borderColor: "#FF4D6A33" }}
            >
              <span className="text-[14px]">🔥</span>
              <span className="text-[12px] font-bold" style={{ color: "#FF4D6A" }}>
                {store.streak} day streak
              </span>
            </div>
          )}
          <div
            className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[20px] font-extrabold lg:hidden"
            style={{
              background: "linear-gradient(135deg,#7C5CFC,#C084FC)",
              boxShadow: "0 4px 16px var(--accent-glow)",
              color: "#fff",
            }}
          >
            {nameInitial}
          </div>
        </div>
      </div>

      {/* Stats chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { icon: "⚡", value: store.totalXp.toLocaleString(), label: "Total XP", color: "#FFB830" },
          { icon: "🏆", value: String(store.completedChallengeIds.length), label: "Completed", color: "#22D37A" },
          { icon: "📈", value: `Lv ${store.level}`, label: "Level", color: "var(--accent)" },
        ].map(({ icon, value, label, color }) => (
          <div
            key={label}
            className="flex-1 border rounded-[12px] p-3 text-center min-w-[80px]"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="text-[16px] mb-0.5">{icon}</div>
            <div className="text-[15px] font-extrabold" style={{ color }}>{value}</div>
            <div className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* XP Progress bar */}
      <div
        className="border rounded-[16px] p-3.5 mb-5"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex justify-between mb-2">
          <span className="text-[12px] font-bold">Level {store.level}</span>
          <span className="text-[12px]" style={{ color: "var(--muted)" }}>
            {store.xpInLevel} / {store.xpToNext} XP → Level {store.level + 1}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${xpBarWidth}%`,
              background: "linear-gradient(90deg,#FFB830,#FFB830cc)",
              boxShadow: "0 0 8px #FFB83088",
            }}
          />
        </div>
      </div>

      {/* Desktop 2-col grid */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
        {/* LEFT: Active challenge */}
        <div>
          <div className="flex justify-between items-center mb-3.5">
            <div>
              <div className="text-[11px] font-semibold tracking-[1.5px] mb-0.5" style={{ color: "var(--muted)" }}>
                WEEKLY CHALLENGE
              </div>
              <div className="text-[16px] font-extrabold">
                Week {challenges.findIndex((c) => c.status === "active") + 1 || "—"}
              </div>
            </div>
            <div className="lg:hidden">{countdownEl}</div>
          </div>

          {activeChallenge ? (
            <div
              className="border rounded-[22px] p-5 mb-4 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,#1A1D2E,#13151C)", borderColor: "#7C5CFC44" }}
            >
              <div
                className="absolute"
                style={{ top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(40px)" }}
              />
              <div className="flex justify-between items-start mb-3">
                <Badge variant="active">ACTIVE</Badge>
                <div
                  className="border rounded-[8px] px-2.5 py-1 text-[12px] font-bold"
                  style={{ background: "#FFB83022", color: "#FFB830", borderColor: "#FFB83044" }}
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
              {/* Show best score if already attempted */}
              {(() => {
                const prev = store.attempts.filter((a) => a.challengeId === activeChallenge.id);
                if (!prev.length) return null;
                const best = Math.max(...prev.map((a) => a.score));
                return (
                  <div
                    className="border rounded-[10px] px-3 py-2 mb-3.5 flex items-center gap-2 text-[12px]"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <span>🔁</span>
                    <span style={{ color: "var(--muted)" }}>Best attempt:</span>
                    <span className="font-bold" style={{ color: scoreColor(best) }}>{best}/100</span>
                    <span style={{ color: "var(--muted)" }}>· {prev.length} {prev.length === 1 ? "try" : "tries"}</span>
                  </div>
                );
              })()}
              <Button onClick={() => navigate("/audiocheck")}>
                {store.attempts.some((a) => a.challengeId === activeChallenge.id)
                  ? "🔄 Try Again →"
                  : "Start Challenge →"}
              </Button>
            </div>
          ) : (
            <div
              className="border rounded-[22px] p-5 mb-4 text-center"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="text-[32px] mb-2">🏆</div>
              <div className="font-extrabold text-[17px] mb-1" style={{ color: "#22D37A" }}>
                All challenges completed!
              </div>
              <div className="text-[13px]" style={{ color: "var(--muted)" }}>
                New challenges coming soon.
              </div>
            </div>
          )}

          {/* Past Attempts */}
          {store.attempts.length > 0 && (
            <div className="mb-4">
              <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "var(--muted)" }}>
                📈 RECENT ATTEMPTS
              </div>
              <div className="flex flex-col gap-2">
                {store.attempts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="border rounded-[14px] p-3.5 flex items-center gap-3"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
                      style={{ background: `${scoreColor(a.score)}22`, color: scoreColor(a.score) }}
                    >
                      {a.score}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold">{a.challengeTitle}</div>
                      <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                        {relativeDate(a.date)}
                      </div>
                    </div>
                    <div
                      className="border rounded-[8px] px-2 py-0.5 text-[11px] font-bold"
                      style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}
                    >
                      +{a.xpEarned} XP
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Countdown + other challenges */}
        <div>
          <div className="hidden lg:block mb-4">{countdownEl}</div>
          {otherChallenges.map((ch) => (
            <div
              key={ch.id}
              className="border rounded-[18px] p-4 flex items-center gap-3.5 mb-2.5"
              style={{
                background: "var(--card)",
                borderColor: ch.status === "completed" ? "#22D37A33" : "var(--border)",
                opacity: ch.status === "locked" ? 0.5 : 1,
              }}
            >
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
                style={{
                  background: ch.status === "completed" ? "#22D37A22" : "var(--surface)",
                  color: ch.status === "completed" ? "#22D37A" : "var(--muted)",
                }}
              >
                {ch.status === "completed" ? "✓" : ch.week}
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold">{ch.title}</div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {ch.xp} XP
                  {ch.status === "completed" && (() => {
                    const best = store.attempts.filter((a) => a.challengeId === ch.id);
                    if (!best.length) return null;
                    const top = Math.max(...best.map((a) => a.score));
                    return <span style={{ color: scoreColor(top) }}> · Best: {top}/100</span>;
                  })()}
                </div>
              </div>
              <Badge variant={ch.status}>{ch.status.toUpperCase()}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile tab bar */}
      <div
        className="lg:hidden border rounded-[16px] p-3 flex justify-around mt-2"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--accent)" }}>🏠 Home</div>
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--muted)" }}>📊 Stats</div>
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--muted)" }}>🏆 Leaderboard</div>
        <div className="text-[11px] font-semibold text-center" style={{ color: "var(--muted)" }}>👤 Profile</div>
      </div>
    </div>
  );
}
