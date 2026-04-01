import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CHALLENGES } from "@/constants";
import { useStore } from "@/context/UserStoreContext";
import { useSession } from "@/context/SessionContext";
import { unlockAudioContext } from "@/services/gemini";
import { scoreColor } from "@/lib/challengeUtils";
import type { ChallengeTier } from "@/types";

const TIER_STYLES: Record<ChallengeTier, { bg: string; color: string; border: string }> = {
  Beginner: { bg: "#22D37A11", color: "#22D37A", border: "#22D37A44" },
  Intermediate: { bg: "#7C5CFC11", color: "#7C5CFC", border: "#7C5CFC44" },
  Advanced: { bg: "#FFB83011", color: "#FFB830", border: "#FFB83044" },
};

type Tab = "hr" | "abap";

export default function InterviewPrep() {
  const navigate = useNavigate();
  const store = useStore();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "abap" ? "abap" : "hr";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const hrChallenges = CHALLENGES.filter((c) => c.category === "hr");
  const abapChallenges = CHALLENGES.filter((c) => c.category === "abap");
  const challenges = activeTab === "hr" ? hrChallenges : abapChallenges;

  const completedHr = hrChallenges.filter((c) => store.completedChallengeIds.includes(c.id)).length;
  const completedAbap = abapChallenges.filter((c) => store.completedChallengeIds.includes(c.id)).length;

  function startChallenge(id: string) {
    unlockAudioContext();
    session.setChallengeId(id);
    navigate("/question");
  }

  return (
    <div style={{ padding: "0 20px 32px" }}>
      {/* Header */}
      <div className="flex items-center gap-3 py-4 pb-5">
        <button
          onClick={() => navigate("/")}
          className="rounded-[10px] px-3.5 py-2 text-[18px] cursor-pointer border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          ←
        </button>
        <div>
          <div className="text-[11px] font-semibold tracking-[1.5px]" style={{ color: "var(--muted)" }}>
            INTERVIEW PREP
          </div>
          <div className="text-[22px] font-extrabold">Practice Questions</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: "hr" as Tab, label: "HR Round", count: hrChallenges.length, completed: completedHr },
          { key: "abap" as Tab, label: "SAP ABAP", count: abapChallenges.length, completed: completedAbap },
        ]).map(({ key, label, count, completed }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex-1 border rounded-[14px] p-3 text-center cursor-pointer transition-all"
            style={{
              background: activeTab === key ? "#7C5CFC18" : "var(--card)",
              borderColor: activeTab === key ? "#7C5CFC66" : "var(--border)",
              color: activeTab === key ? "#A78BFA" : "var(--text)",
            }}
          >
            <div className="text-[14px] font-bold">{label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
              {completed}/{count} completed
            </div>
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div className="flex flex-col gap-2.5">
        {challenges.map((ch) => {
          const isCompleted = store.completedChallengeIds.includes(ch.id);
          const attempts = store.getAttemptsForChallenge(ch.id);
          const best = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
          const tierStyle = ch.tier ? TIER_STYLES[ch.tier] : null;

          return (
            <div
              key={ch.id}
              className="border rounded-[18px] p-4 flex items-center gap-3.5"
              style={{
                background: "var(--card)",
                borderColor: isCompleted ? "#22D37A33" : "var(--border)",
              }}
            >
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[14px] font-extrabold flex-shrink-0"
                style={{
                  background: isCompleted ? "#22D37A22" : "var(--surface)",
                  color: isCompleted ? "#22D37A" : "var(--muted)",
                }}
              >
                {isCompleted ? "✓" : ch.id.replace(/[a-z]/g, "").slice(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="text-[14px] font-bold truncate">{ch.title}</div>
                  {tierStyle && (
                    <span
                      className="border rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold flex-shrink-0"
                      style={{ background: tierStyle.bg, color: tierStyle.color, borderColor: tierStyle.border }}
                    >
                      {ch.tier}
                    </span>
                  )}
                </div>
                <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {ch.xp} XP
                  {best !== null && (
                    <span style={{ color: scoreColor(best) }}> · Best: {best}/100</span>
                  )}
                </div>
              </div>
              {isCompleted ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => startChallenge(ch.id)}
                    className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer"
                    style={{ background: "#7C5CFC22", color: "#A78BFA" }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      const attempt = store.attempts.find((a) => a.challengeId === ch.id);
                      if (attempt) navigate(`/report/${attempt.id}`);
                      else navigate("/history");
                    }}
                    className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer"
                    style={{ background: "#22D37A22", color: "#22D37A" }}
                  >
                    Results
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startChallenge(ch.id)}
                  className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold border-none cursor-pointer flex-shrink-0"
                  style={{ background: "#7C5CFC22", color: "#A78BFA" }}
                >
                  Start →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
