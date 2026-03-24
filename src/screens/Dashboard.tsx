import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import { CHALLENGES } from "@/constants";
import { useStore } from "@/context/UserStoreContext";
import { greeting, relativeDate, type Attempt, type UserStore } from "@/hooks/useUserStore";
import Sparkline from "@/components/Sparkline";
import type { BadgeVariant, Challenge, ChallengeTier } from "@/types";
import type { NavigateFunction } from "react-router-dom";

function scoreColor(score: number) {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

function isExpired(deadline?: string): boolean {
  if (!deadline) return false;
  try {
    return new Date(deadline).getTime() < Date.now();
  } catch {
    return false;
  }
}

type ChallengeStatusResult = BadgeVariant | "exhausted";

function challengeStatus(
  id: string,
  _idx: number,
  completedIds: string[],
  challengeAttempts: Attempt[],
  maxAttempts: number,
  deadline?: string,
): ChallengeStatusResult {
  if (completedIds.includes(id)) return "completed";
  if (isExpired(deadline)) return "locked"; // expired = locked
  // All challenges unlocked for testing — no sequential gate
  if (challengeAttempts.length >= maxAttempts) return "exhausted";
  return "active";
}

const TIER_STYLES: Record<ChallengeTier, { bg: string; color: string; border: string }> = {
  "Beginner": { bg: "#22D37A11", color: "#22D37A", border: "#22D37A44" },
  "Intermediate": { bg: "#7C5CFC11", color: "#7C5CFC", border: "#7C5CFC44" },
  "Advanced": { bg: "#FFB83011", color: "#FFB830", border: "#FFB83044" },
};

const STREAK_MILESTONES = [
  { days: 30, label: "Month Master", icon: "🏅" },
  { days: 7, label: "Week Warrior", icon: "🔥" },
  { days: 3, label: "On a Roll", icon: "⚡" },
];

function StreakBadge({ streak }: { streak: number }) {
  const milestone = STREAK_MILESTONES.find((m) => streak >= m.days);
  if (!milestone) return null;
  return (
    <div
      className="border rounded-[10px] px-2.5 py-1 flex items-center gap-1.5"
      style={{ background: "#FF4D6A11", borderColor: "#FF4D6A33" }}
    >
      <span className="text-[14px]">{milestone.icon}</span>
      <div>
        <div className="text-[10px] font-bold" style={{ color: "#FF4D6A" }}>
          {streak} DAY STREAK
        </div>
        <div className="text-[9px]" style={{ color: "#FF4D6A88" }}>
          {milestone.label}
        </div>
      </div>
    </div>
  );
}

function ActiveChallengeCard({
  challenge,
  store,
  navigate,
}: {
  challenge: (Omit<Challenge, "status"> & { status: ChallengeStatusResult }) | undefined;
  store: UserStore;
  navigate: NavigateFunction;
}) {
  if (!challenge) {
    return (
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
    );
  }

  const challengeAttempts = store.getAttemptsForChallenge(challenge.id);
  const isExhausted = challenge.status === "exhausted";
  const attemptNum = challengeAttempts.length + 1;
  const resetInProgress = useRef(false);

  if (isExhausted) {
    const best = challengeAttempts.length > 0 ? Math.max(...challengeAttempts.map((a) => a.score)) : 0;
    return (
      <div
        className="border rounded-[22px] p-5 mb-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1A1D2E,#13151C)", borderColor: "#FF4D6A44" }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span
              className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "#FF4D6A22", borderColor: "#FF4D6A44", color: "#FF4D6A" }}
            >
              🔒 LOCKED
            </span>
            {challenge.tier && (
              <span
                className="border rounded-[6px] px-2 py-0.5 text-[10px] font-bold"
                style={{
                  background: TIER_STYLES[challenge.tier].bg,
                  color: TIER_STYLES[challenge.tier].color,
                  borderColor: TIER_STYLES[challenge.tier].border,
                }}
              >
                {challenge.tier}
              </span>
            )}
          </div>
          <span
            className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold"
            style={{ background: "#FF4D6A11", borderColor: "#FF4D6A33", color: "#FF4D6A" }}
          >
            {challengeAttempts.length}/{challenge.maxAttempts} Attempts Used
          </span>
        </div>
        <div className="text-[20px] font-extrabold mb-1.5">{challenge.title}</div>
        <div className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--muted-soft)" }}>
          All attempts used. Review your preparation strategy, then try again.
        </div>
        <div
          className="border rounded-[10px] px-3 py-2 mb-3.5 flex items-center gap-2 text-[12px]"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span>📊</span>
          <span style={{ color: "var(--muted)" }}>Best score:</span>
          <span className="font-bold" style={{ color: scoreColor(best) }}>{best}/100</span>
          <span style={{ color: "var(--muted)" }}>· Need {challenge.passingScore} to pass</span>
        </div>
        <div className="flex gap-2.5">
          <Button
            onClick={() => {
              const lastAttempt = challengeAttempts[0];
              if (lastAttempt) navigate(`/report/${lastAttempt.id}`);
            }}
          >
            📋 View Prep Strategy
          </Button>
          <button
            onClick={() => {
              if (resetInProgress.current) return;
              resetInProgress.current = true;
              store.resetChallengeAttempts(challenge.id);
              setTimeout(() => { resetInProgress.current = false; }, 2000);
            }}
            className="border rounded-[12px] px-4 py-2.5 text-[13px] font-bold cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            🔄 Reset Attempts
          </button>
        </div>
      </div>
    );
  }

  const best = challengeAttempts.length > 0 ? Math.max(...challengeAttempts.map((a) => a.score)) : null;

  return (
    <div
      className="border rounded-[22px] p-5 mb-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1A1D2E,#13151C)", borderColor: "#7C5CFC44" }}
    >
      <div
        className="absolute"
        style={{ top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(40px)" }}
      />
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="active">ACTIVE</Badge>
          {challenge.tier && (
            <span
              className="border rounded-[6px] px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: TIER_STYLES[challenge.tier].bg,
                color: TIER_STYLES[challenge.tier].color,
                borderColor: TIER_STYLES[challenge.tier].border,
              }}
            >
              {challenge.tier}
            </span>
          )}
          {challengeAttempts.length > 0 && (
            <span
              className="border rounded-[6px] px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "#FFB83011", borderColor: "#FFB83033", color: "#FFB830" }}
            >
              Attempt {attemptNum}/{challenge.maxAttempts}
            </span>
          )}
        </div>
        <div
          className="border rounded-[8px] px-2.5 py-1 text-[12px] font-bold"
          style={{ background: "#FFB83022", color: "#FFB830", borderColor: "#FFB83044" }}
        >
          ⚡ {challenge.xp} XP
        </div>
      </div>
      <div className="text-[20px] font-extrabold mb-1.5">{challenge.title}</div>
      <div className="text-[13px] leading-relaxed mb-2" style={{ color: "var(--muted-soft)" }}>
        {challenge.description}
      </div>
      <div className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>
        Score {challenge.passingScore}+ to pass
      </div>
      {challenge.deadline && (
        <div className="text-[12px] font-semibold mb-4" style={{ color: "#FFB830" }}>
          🗓 {challenge.deadline}
        </div>
      )}
      {best !== null && (
        <div
          className="border rounded-[10px] px-3 py-2 mb-3.5 flex items-center gap-2 text-[12px]"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span>🔁</span>
          <span style={{ color: "var(--muted)" }}>Best attempt:</span>
          <span className="font-bold" style={{ color: scoreColor(best) }}>{best}/100</span>
          <span style={{ color: "var(--muted)" }}>· {challengeAttempts.length} {challengeAttempts.length === 1 ? "try" : "tries"}</span>
        </div>
      )}
      <Button onClick={() => navigate("/audiocheck")}>
        {challengeAttempts.length > 0 ? "🔄 Try Again →" : "Start Challenge →"}
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const store = useStore();
  const { seconds, start } = useCountdown(87600);
  const [xpBarWidth, setXpBarWidth] = useState(0);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    const t = setTimeout(() => setXpBarWidth(store.xpProgress), 300);
    return () => clearTimeout(t);
  }, [store.xpProgress]);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const challenges = CHALLENGES.map((c, i) => ({
    ...c,
    status: challengeStatus(
      c.id,
      i,
      store.completedChallengeIds,
      store.getAttemptsForChallenge(c.id),
      c.maxAttempts,
      c.deadline,
    ),
  }));
  const activeChallenge = challenges.find((c) => c.status === "active") ?? challenges.find((c) => c.status === "exhausted");
  const otherChallenges = challenges.filter((c) => c.id !== activeChallenge?.id);

  // Skill velocity: compare latest two attempts
  const latestTwo = store.attempts.slice(0, 2);
  const skillVelocity: { skill: string; delta: number }[] = [];
  if (latestTwo.length === 2 && latestTwo[0].skills && latestTwo[1].skills) {
    for (const skill of Object.keys(latestTwo[0].skills)) {
      const delta = (latestTwo[0].skills[skill] ?? 0) - (latestTwo[1].skills[skill] ?? 0);
      if (Math.abs(delta) >= 5) skillVelocity.push({ skill, delta });
    }
    skillVelocity.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  // Sparkline: scores oldest → newest (max 6)
  const sparkData = [...store.attempts].reverse().slice(-6).map((a) => a.score);

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
          {store.streak > 0 && <StreakBadge streak={store.streak} />}
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

      {/* Skill velocity callout */}
      {skillVelocity.length > 0 && (
        <div
          className="border rounded-[14px] p-3 mb-4 flex items-center gap-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <span className="text-[20px]">📈</span>
          <div className="flex-1">
            <div className="text-[12px] font-bold mb-1">Since your last attempt</div>
            <div className="flex gap-2 flex-wrap">
              {skillVelocity.slice(0, 3).map(({ skill, delta }) => (
                <span
                  key={skill}
                  className="border rounded-[6px] px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    background: delta > 0 ? "#22D37A11" : "#FF4D6A11",
                    borderColor: delta > 0 ? "#22D37A44" : "#FF4D6A44",
                    color: delta > 0 ? "#22D37A" : "#FF4D6A",
                  }}
                >
                  {skill} {delta > 0 ? "+" : ""}{delta}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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
      <div className="lg:grid lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px] lg:gap-6">
        {/* LEFT: Active challenge */}
        <div>
          <div className="flex justify-between items-center mb-3.5">
            <div>
              <div className="text-[11px] font-semibold tracking-[1.5px] mb-0.5" style={{ color: "var(--muted)" }}>
                WEEKLY CHALLENGE
              </div>
              <div className="text-[16px] font-extrabold">
                Week {(challenges.findIndex((c) => c.status === "active" || c.status === "exhausted") + 1) || "—"}
              </div>
            </div>
            <div className="lg:hidden">{countdownEl}</div>
          </div>

          <ActiveChallengeCard
            challenge={activeChallenge}
            store={store}
            navigate={navigate}
          />

          {/* Past Attempts with Sparkline */}
          {store.attempts.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <div className="text-[13px] font-extrabold" style={{ color: "var(--muted)" }}>
                    📈 RECENT ATTEMPTS
                  </div>
                  {store.attempts.length > 3 && (
                    <button
                      onClick={() => navigate("/history")}
                      className="text-[11px] font-bold border-none cursor-pointer"
                      style={{ background: "transparent", color: "var(--accent)" }}
                    >
                      View All →
                    </button>
                  )}
                </div>
                {sparkData.length >= 2 && (
                  <div className="flex items-center gap-2">
                    <Sparkline data={sparkData} width={64} height={22} />
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        color:
                          sparkData[sparkData.length - 1] > sparkData[0]
                            ? "#22D37A"
                            : sparkData[sparkData.length - 1] < sparkData[0]
                            ? "#FF4D6A"
                            : "var(--muted)",
                      }}
                    >
                      {sparkData[sparkData.length - 1] > sparkData[0] ? "↑ Improving" : sparkData[sparkData.length - 1] < sparkData[0] ? "↓ Declining" : "→ Steady"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {store.attempts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/report/${a.id}`)}
                    className="border rounded-[14px] p-3.5 flex items-center gap-3 w-full text-left cursor-pointer transition-all"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#7C5CFC44";
                      (e.currentTarget as HTMLButtonElement).style.background = "#7C5CFC08";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--card)";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
                      style={{ background: `${scoreColor(a.score)}22`, color: scoreColor(a.score) }}
                    >
                      {a.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold truncate">{a.challengeTitle}</div>
                      <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                        {relativeDate(a.date)}
                      </div>
                    </div>
                    <div
                      className="border rounded-[8px] px-2 py-0.5 text-[11px] font-bold flex-shrink-0"
                      style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}
                    >
                      +{a.xpEarned} XP
                    </div>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--muted)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="flex-shrink-0"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
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
                opacity: ch.status === "locked" ? 0.5 : ch.status === "exhausted" ? 0.7 : 1,
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
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="text-[15px] font-bold">{ch.title}</div>
                  {ch.tier && (
                    <span
                      className="border rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        background: TIER_STYLES[ch.tier].bg,
                        color: TIER_STYLES[ch.tier].color,
                        borderColor: TIER_STYLES[ch.tier].border,
                      }}
                    >
                      {ch.tier}
                    </span>
                  )}
                </div>
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
              {ch.status === "completed" ? (
                <button
                  onClick={() => {
                    const attempt = store.attempts.find((a) => a.challengeId === ch.id);
                    if (attempt) navigate(`/report/${attempt.id}`);
                    else navigate("/history");
                  }}
                  className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer flex-shrink-0"
                  style={{ background: "#22D37A22", color: "#22D37A" }}
                >
                  View Results
                </button>
              ) : ch.status === "exhausted" ? (
                <span
                  className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold flex-shrink-0"
                  style={{ background: "#FF4D6A22", borderColor: "#FF4D6A44", color: "#FF4D6A" }}
                >
                  🔒 LOCKED
                </span>
              ) : (
                <Badge variant={ch.status as BadgeVariant}>{ch.status.toUpperCase()}</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
