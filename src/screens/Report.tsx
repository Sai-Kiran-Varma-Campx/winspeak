import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useSession } from "@/context/SessionContext";
import { useStore } from "@/context/UserStoreContext";
import { preRenderSpeech } from "@/services/gemini";
import { loadAudioBlob, IDEAL_RESPONSE_KEY } from "@/lib/audioStorage";
import { CHALLENGES } from "@/constants";
import RadarChart from "@/components/RadarChart";
import type { AnalysisResult } from "@/types";

function scoreColor(score: number) {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Needs work";
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Animated XP counter hook
function useCountUp(target: number, delay = 400, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const startTime = Date.now();
      const step = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay, duration]);
  return value;
}

// Score ring constants
const RING_R = 62;
const RING_C = 2 * Math.PI * RING_R;

const IDEAL_WAVE_BARS = 36;

/** Animated waveform bars for the ideal response player */
function IdealWaveViz({ playing, progress }: { playing: boolean; progress: number }) {
  const bars = Array.from({ length: IDEAL_WAVE_BARS }, (_, i) => {
    const base = Math.sin(i * 0.9) * 0.3 + Math.cos(i * 1.4) * 0.25 + 0.5;
    return Math.max(0.15, Math.min(1, base));
  });

  return (
    <div className="flex items-center gap-[2px] h-9 w-full">
      {bars.map((h, i) => {
        const barPos = i / IDEAL_WAVE_BARS;
        const isPast = barPos < progress;
        return (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${h * 100}%`,
              background: isPast
                ? "linear-gradient(180deg, #FFB830, #FF8C00)"
                : "var(--border)",
              opacity: isPast ? 1 : 0.4,
              animation: playing && isPast
                ? `soundwave 0.6s ${(i % 5) * 0.08}s ease-in-out infinite alternate`
                : "none",
              transition: "background 0.15s, opacity 0.15s",
            }}
          />
        );
      })}
    </div>
  );
}

function generateShareCard(
  name: string,
  score: number,
  xpEarned: number,
  challengeTitle: string,
  skills: Record<string, number>
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0, "#0A0B0F");
  bg.addColorStop(1, "#1A1D2E");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);

  const glow = ctx.createRadialGradient(1100, 100, 0, 1100, 100, 300);
  glow.addColorStop(0, "#7C5CFC33");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 630);

  const cx = 200, cy = 315, r = 110;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#1E2130";
  ctx.lineWidth = 12;
  ctx.stroke();
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (score / 100) * Math.PI * 2;
  const ringColor = score >= 80 ? "#22D37A" : score >= 60 ? "#FFB830" : "#FF4D6A";
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.fillStyle = ringColor;
  ctx.font = "bold 72px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(score), cx, cy + 16);
  ctx.fillStyle = "#6B7194";
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillText("/ 100", cx, cy + 48);

  ctx.textAlign = "left";
  ctx.fillStyle = "#F0F2FF";
  ctx.font = "bold 52px system-ui, sans-serif";
  ctx.fillText(name, 370, 230);
  ctx.fillStyle = "#6B7194";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText(challengeTitle, 370, 285);
  ctx.fillStyle = "#FFB830";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText(`+${xpEarned} XP Earned`, 370, 345);

  const stars = Math.round(score / 20);
  ctx.font = "30px system-ui, sans-serif";
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < stars ? "#FFB830" : "#1E2130";
    ctx.fillText("★", 370 + i * 42, 400);
  }

  const skillNames = Object.keys(skills).slice(0, 6);
  const barX = 370, barStartY = 440, barH = 20, gap = 36, barW = 420;
  ctx.font = "16px system-ui, sans-serif";
  skillNames.forEach((skill, i) => {
    const val = skills[skill] ?? 0;
    const y = barStartY + i * gap;
    const color = val >= 80 ? "#22D37A" : val >= 60 ? "#FFB830" : "#FF4D6A";
    ctx.fillStyle = "#6B7194";
    ctx.fillText(skill, barX, y + 14);
    ctx.fillStyle = "#1E2130";
    ctx.roundRect(barX + 110, y, barW, barH, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.roundRect(barX + 110, y, (val / 100) * barW, barH, 6);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = "right";
    ctx.fillText(String(val), barX + 110 + barW + 40, y + 14);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#7C5CFC";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("WinSpeak", 1160, 600);
  ctx.fillStyle = "#6B7194";
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText("AI Speaking Coach for Students", 1160, 620);

  return canvas.toDataURL("image/png");
}

export default function Report() {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId?: string }>();
  const session = useSession();
  const store = useStore();

  const isHistorical = !!attemptId;
  const historicalAttempt = attemptId ? store.getAttemptById(attemptId) : undefined;

  // Resolve which AnalysisResult to render
  const result: AnalysisResult | null | undefined = isHistorical
    ? historicalAttempt?.analysisResult ?? null
    : session.analysisResult;

  const savedRef = useRef(false);
  const [xpSaved, setXpSaved] = useState(false);
  const [ringProgress, setRingProgress] = useState(0);

  // Ideal response audio player state
  const idealAudioRef = useRef<HTMLAudioElement | null>(null);
  const [idealReady, setIdealReady] = useState(false);
  const [idealLoading, setIdealLoading] = useState(!isHistorical);
  const [idealPlaying, setIdealPlaying] = useState(false);
  const [idealTime, setIdealTime] = useState(0);
  const [idealDuration, setIdealDuration] = useState(0);
  const idealProgress = idealDuration > 0 ? idealTime / idealDuration : 0;

  // Resolve active challenge for live mode
  const activeChallenge = !isHistorical
    ? CHALLENGES.find((c, i) => {
        if (store.completedChallengeIds.includes(c.id)) return false;
        return CHALLENGES.slice(0, i).every((ch) =>
          store.completedChallengeIds.includes(ch.id)
        );
      }) ?? CHALLENGES[0]
    : historicalAttempt
    ? CHALLENGES.find((c) => c.id === historicalAttempt.challengeId)
    : undefined;

  const passed = result && activeChallenge
    ? result.overallScore >= activeChallenge.passingScore
    : false;

  const challengeAttempts = activeChallenge
    ? store.getAttemptsForChallenge(activeChallenge.id)
    : [];
  // +1 for the current attempt (before save completes)
  const attemptCount = isHistorical
    ? challengeAttempts.length
    : challengeAttempts.length + (savedRef.current ? 0 : 1);
  const maxAttempts = activeChallenge?.maxAttempts ?? 3;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptCount);
  const allAttemptsUsed = attemptsRemaining === 0 && !passed;

  // Save attempt once (live mode only)
  useEffect(() => {
    if (isHistorical || !result || savedRef.current || !activeChallenge) return;
    savedRef.current = true;

    const didPass = result.overallScore >= activeChallenge.passingScore;

    store.addAttempt({
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
      score: result.overallScore,
      xpEarned: result.xpEarned,
      passed: didPass,
      skills: Object.fromEntries(
        Object.entries(result.skills).map(([k, v]) => [k, v.score])
      ),
      analysisResult: result,
    });

    setTimeout(() => setXpSaved(true), 600);
    setTimeout(() => setXpSaved(false), 4500);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate score ring
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setRingProgress(result.overallScore), 300);
    return () => clearTimeout(t);
  }, [result]);

  // Load pre-rendered ideal response audio (live mode only)
  useEffect(() => {
    if (isHistorical || !result) return;
    let cancelled = false;
    let attempts = 0;

    async function tryLoad() {
      while (!cancelled && attempts < 20) {
        try {
          const blob = await loadAudioBlob(IDEAL_RESPONSE_KEY);
          if (blob && !cancelled) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            idealAudioRef.current = audio;

            audio.addEventListener("loadedmetadata", () => {
              if (!cancelled) {
                setIdealDuration(audio.duration);
                setIdealReady(true);
                setIdealLoading(false);
              }
            });
            audio.addEventListener("timeupdate", () => {
              if (!cancelled) setIdealTime(audio.currentTime);
            });
            audio.addEventListener("ended", () => {
              if (!cancelled) {
                setIdealPlaying(false);
                setIdealTime(0);
              }
            });
            return;
          }
        } catch { /* retry */ }
        attempts++;
        await new Promise((r) => setTimeout(r, 1500));
      }
      // If still not ready after retries, try generating now
      if (!cancelled) {
        try {
          await preRenderSpeech(result!.idealResponse, IDEAL_RESPONSE_KEY);
          const blob = await loadAudioBlob(IDEAL_RESPONSE_KEY);
          if (blob && !cancelled) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            idealAudioRef.current = audio;
            audio.addEventListener("loadedmetadata", () => {
              if (!cancelled) {
                setIdealDuration(audio.duration);
                setIdealReady(true);
                setIdealLoading(false);
              }
            });
            audio.addEventListener("timeupdate", () => {
              if (!cancelled) setIdealTime(audio.currentTime);
            });
            audio.addEventListener("ended", () => {
              if (!cancelled) {
                setIdealPlaying(false);
                setIdealTime(0);
              }
            });
            return;
          }
        } catch { /* give up */ }
        if (!cancelled) setIdealLoading(false);
      }
    }

    tryLoad();
    return () => {
      cancelled = true;
      if (idealAudioRef.current) {
        idealAudioRef.current.pause();
        idealAudioRef.current.src = "";
      }
    };
  }, [result, isHistorical]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if no result (live mode only)
  useEffect(() => {
    if (!isHistorical && !result) navigate("/", { replace: true });
  }, [isHistorical, result, navigate]);

  const toggleIdealPlay = useCallback(() => {
    const audio = idealAudioRef.current;
    if (!audio || !idealReady) return;
    if (idealPlaying) {
      audio.pause();
      setIdealPlaying(false);
    } else {
      audio.play().catch(() => setIdealPlaying(false));
      setIdealPlaying(true);
    }
  }, [idealPlaying, idealReady]);

  const seekIdeal = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = idealAudioRef.current;
    if (!audio || !idealDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * idealDuration;
    setIdealTime(audio.currentTime);
  }, [idealDuration]);

  // Historical attempt with no analysisResult — show minimal view
  if (isHistorical && !result) {
    if (!historicalAttempt) {
      return (
        <div className="p-4 sm:p-5 pb-8 sm:pb-10">
          <div className="text-center py-16">
            <div className="text-[40px] mb-4">🔍</div>
            <div className="text-[18px] font-extrabold mb-2">Attempt Not Found</div>
            <div className="text-[13px] mb-6" style={{ color: "var(--muted)" }}>
              This attempt may have been removed.
            </div>
            <Button onClick={() => navigate("/history")}>← Back to History</Button>
          </div>
        </div>
      );
    }

    // Legacy attempt — scores only, no full analysis
    const sc = scoreColor(historicalAttempt.score);
    return (
      <div className="p-4 sm:p-5 pb-8 sm:pb-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[11px] font-semibold tracking-[1px]" style={{ color: "var(--muted)" }}>
              PAST REPORT
            </div>
            <div className="text-[20px] font-extrabold">{historicalAttempt.challengeTitle}</div>
          </div>
          <Badge variant="completed">COMPLETED</Badge>
        </div>

        <div
          className="border rounded-[24px] p-5 sm:p-6 text-center mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#1A1D2E,#13151C)", borderColor: "#7C5CFC44" }}
        >
          <div className="text-[11px] font-semibold tracking-[1.5px] mb-4" style={{ color: "var(--muted)" }}>
            OVERALL SCORE
          </div>
          <div className="text-[52px] font-black leading-none mb-1" style={{ color: sc }}>
            {historicalAttempt.score}
          </div>
          <div className="text-[14px] font-bold" style={{ color: "var(--muted)" }}>/ 100</div>
          <div className="text-[15px] font-bold mt-3" style={{ color: "#FFB830" }}>
            +{historicalAttempt.xpEarned} XP Earned
          </div>
        </div>

        {historicalAttempt.skills && (
          <div
            className="border rounded-[20px] p-4 sm:p-5 mb-5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="text-[15px] font-extrabold mb-3">Skill Scores</div>
            <div className="flex flex-col gap-2.5">
              {Object.entries(historicalAttempt.skills).map(([name, score]) => {
                const color = scoreColor(score);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-[13px] font-bold w-24">{name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
                    </div>
                    <span className="text-[13px] font-extrabold min-w-[32px] text-right" style={{ color }}>{score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div
          className="border rounded-[16px] p-4 mb-5 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-[13px]" style={{ color: "var(--muted)" }}>
            Detailed feedback is not available for this attempt.
          </div>
        </div>

        <Button onClick={() => navigate("/history")}>← Back to History</Button>
      </div>
    );
  }

  if (!result) return null;

  const { overallScore, xpEarned, skills, grammarIssues, fillerWords, pauseAnalysis, winSpeakAnalysis, strengths, improvements, idealResponse } = result;

  // Confidence Index
  const totalFillers = fillerWords.reduce((acc, fw) => acc + fw.count, 0);
  const fillerPenalty = Math.min(totalFillers * 5, 25);
  const pauseBonus = pauseAnalysis.status === "Good" ? 10 : pauseAnalysis.status === "Fair" ? 0 : -10;
  const confidenceScore = Math.max(0, Math.min(100, Math.round(
    (skills.Fluency.score * 0.35 + skills.Clarity.score * 0.35 + skills.Vocabulary.score * 0.3) - fillerPenalty + pauseBonus
  )));

  const skillScores = Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, v.score]));
  const displayXp = useCountUp(isHistorical ? 0 : xpEarned, 700);

  // Skill velocity vs previous attempt (live mode only)
  const velocity: { skill: string; delta: number }[] = [];
  if (!isHistorical) {
    const prevAttempt = store.attempts[1] ?? null;
    if (prevAttempt?.skills) {
      for (const [skill, { score }] of Object.entries(skills)) {
        const prev = prevAttempt.skills[skill] ?? 0;
        const delta = score - prev;
        if (Math.abs(delta) >= 3) velocity.push({ skill, delta });
      }
      velocity.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    }
  }

  function handleShare() {
    const dataUrl = generateShareCard(
      store.name,
      overallScore,
      xpEarned,
      historicalAttempt?.challengeTitle ?? (CHALLENGES.find((c) => !store.completedChallengeIds.slice(1).includes(c.id))?.title) ?? "WinSpeak Challenge",
      skillScores
    );
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `winspeak-score-${overallScore}.png`;
    a.click();
  }

  const ringOffset = RING_C * (1 - ringProgress / 100);
  const ringColor = scoreColor(overallScore);

  return (
    <div className="p-4 sm:p-5 pb-8 sm:pb-10">
      {/* XP saved toast (live mode only) */}
      {!isHistorical && xpSaved && (
        <div
          className="border rounded-[14px] p-3.5 mb-4 flex items-center gap-3"
          style={{
            background: "#22D37A11",
            borderColor: "#22D37A44",
            animation: "fadeSlideIn 0.4s ease",
          }}
        >
          <span className="text-[22px]">⚡</span>
          <div className="flex-1">
            <div className="text-[13px] font-extrabold" style={{ color: "#22D37A" }}>
              +{displayXp} XP saved to your profile!
            </div>
            <div className="text-[11px]" style={{ color: "var(--muted)" }}>
              Total XP: {store.totalXp.toLocaleString()} · Level {store.level}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[11px] font-semibold tracking-[1px]" style={{ color: "var(--muted)" }}>
            {isHistorical ? "PAST REPORT" : passed ? "CHALLENGE PASSED" : "CHALLENGE REPORT"}
          </div>
          <div className="text-[20px] font-extrabold">
            {isHistorical ? historicalAttempt?.challengeTitle ?? "Report" : activeChallenge?.title ?? "Your Report"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="border rounded-[10px] px-3 py-2.5 sm:py-1.5 text-[12px] font-bold cursor-pointer"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            Share
          </button>
          {isHistorical ? (
            <Badge variant="completed">COMPLETED</Badge>
          ) : passed ? (
            <Badge variant="completed">PASSED</Badge>
          ) : (
            <span
              className="border rounded-[8px] px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "#FF4D6A22", borderColor: "#FF4D6A44", color: "#FF4D6A" }}
            >
              NOT PASSED
            </span>
          )}
        </div>
      </div>

      {/* Pass/Fail Banner (live mode only) */}
      {!isHistorical && activeChallenge && (
        passed ? (
          <div
            className="border rounded-[16px] p-4 mb-5 flex items-center gap-3"
            style={{ background: "#22D37A11", borderColor: "#22D37A44" }}
          >
            <span className="text-[24px]">🎉</span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold" style={{ color: "#22D37A" }}>
                Challenge Passed!
              </div>
              <div className="text-[12px]" style={{ color: "#22D37Acc" }}>
                You scored {overallScore}/{activeChallenge.passingScore} required. Next challenge unlocked!
              </div>
            </div>
          </div>
        ) : allAttemptsUsed ? (
          <div
            className="border rounded-[16px] p-4 mb-5 flex items-center gap-3"
            style={{ background: "#FF4D6A11", borderColor: "#FF4D6A44" }}
          >
            <span className="text-[24px]">🔒</span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold" style={{ color: "#FF4D6A" }}>
                Challenge Locked — All {maxAttempts} Attempts Used
              </div>
              <div className="text-[12px]" style={{ color: "#FF4D6Acc" }}>
                Review your preparation strategy below to improve before trying again.
              </div>
            </div>
          </div>
        ) : (
          <div
            className="border rounded-[16px] p-4 mb-5 flex items-center gap-3"
            style={{ background: "#FFB83011", borderColor: "#FFB83044" }}
          >
            <span className="text-[24px]">⚠️</span>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold" style={{ color: "#FFB830" }}>
                Not Yet — {attemptsRemaining} {attemptsRemaining === 1 ? "attempt" : "attempts"} remaining
              </div>
              <div className="text-[12px]" style={{ color: "#FFB830cc" }}>
                You need {activeChallenge.passingScore} to pass. You scored {overallScore}.
              </div>
            </div>
          </div>
        )
      )}

      {/* Desktop 2-col grid */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* LEFT COLUMN */}
        <div>
          {/* Score Card with ring */}
          <div
            className="border rounded-[24px] p-5 sm:p-6 text-center mb-4 sm:mb-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#1A1D2E,#13151C)",
              borderColor: "#7C5CFC44",
            }}
          >
            <div
              className="absolute"
              style={{
                top: -40, right: -40, width: 150, height: 150,
                borderRadius: "50%", background: "var(--accent-glow)", filter: "blur(50px)",
              }}
            />
            <div
              className="text-[11px] font-semibold tracking-[1.5px] mb-4"
              style={{ color: "var(--muted)" }}
            >
              OVERALL SCORE
            </div>

            {/* SVG Score Ring */}
            <div className="flex justify-center mb-3">
              <div className="relative flex items-center justify-center" style={{ width: 152, height: 152 }}>
                <svg
                  width={152}
                  height={152}
                  style={{ transform: "rotate(-90deg)", position: "absolute" }}
                >
                  <circle
                    cx={76} cy={76} r={RING_R}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={10}
                  />
                  <circle
                    cx={76} cy={76} r={RING_R}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={ringOffset}
                    style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
                  />
                </svg>
                <div className="relative z-10 flex flex-col items-center">
                  <span
                    className="text-[52px] font-black leading-none"
                    style={{ color: ringColor }}
                  >
                    {overallScore}
                  </span>
                  <span className="text-[14px] font-bold" style={{ color: "var(--muted)" }}>
                    / 100
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[15px] font-bold" style={{ color: "#FFB830" }}>
              +{xpEarned} XP Earned!
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-[18px]" style={{ opacity: i <= Math.round(overallScore / 20) ? 1 : 0.2 }}>
                  ★
                </span>
              ))}
            </div>
          </div>

          {/* Confidence Index */}
          <div
            className="border rounded-[20px] p-4 sm:p-5 mb-4"
            style={{
              background: "linear-gradient(135deg,#7C5CFC0A,#1A1D2E)",
              borderColor: "#7C5CFC33",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[15px] font-extrabold">Confidence Index</div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                  Derived from fluency, clarity, fillers & pauses
                </div>
              </div>
              <div
                className="text-[28px] font-black"
                style={{ color: scoreColor(confidenceScore) }}
              >
                {confidenceScore}
              </div>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${confidenceScore}%`,
                  background: `linear-gradient(90deg,${scoreColor(confidenceScore)},${scoreColor(confidenceScore)}cc)`,
                  boxShadow: `0 0 8px ${scoreColor(confidenceScore)}66`,
                  transition: "width 1.2s ease-out",
                }}
              />
            </div>
            <div className="text-[11px] mt-2" style={{ color: "#C0C6E8" }}>
              {confidenceScore >= 80
                ? "You project strong confidence. Keep it up!"
                : confidenceScore >= 60
                ? "Good presence — reduce fillers to sound more authoritative."
                : "Focus on fewer filler words and deliberate pauses for impact."}
            </div>
          </div>

          {/* Skill velocity vs previous (live mode only) */}
          {!isHistorical && velocity.length > 0 && (
            <div
              className="border rounded-[16px] p-3.5 mb-4 flex items-center gap-3"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <span className="text-[18px]">📈</span>
              <div>
                <div className="text-[11px] font-bold mb-1.5">vs. your previous attempt</div>
                <div className="flex gap-2 flex-wrap">
                  {velocity.slice(0, 4).map(({ skill, delta }) => (
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

          {/* Radar Chart */}
          <div
            className="border rounded-[20px] p-4 sm:p-5 mb-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="text-[15px] font-extrabold mb-1">Skill Radar</div>
            <div className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>
              Your performance shape across all 6 dimensions
            </div>
            <div className="flex justify-center">
              <RadarChart skills={skillScores} size={180} />
            </div>
          </div>

          {/* Skill Breakdown */}
          <div
            className="border rounded-[20px] mb-4 overflow-hidden"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="px-5 pt-4 pb-3.5 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="text-[15px] font-extrabold">Skill Breakdown</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                Tap any skill to see feedback
              </div>
            </div>
            <Accordion type="multiple">
              {(Object.entries(skills) as [string, { score: number; feedback: string }][]).map(
                ([name, { score, feedback }]) => {
                  const color = scoreColor(score);
                  const label = scoreLabel(score);
                  return (
                    <AccordionItem key={name} value={name}>
                      <AccordionTrigger className="hover:no-underline px-5 py-3.5">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <span className="text-[13px] font-bold flex-1" style={{ color: "var(--text)" }}>
                            {name}
                          </span>
                          <span
                            className="border rounded-[6px] px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: `${color}22`, color, borderColor: `${color}44` }}
                          >
                            {label}
                          </span>
                          <span className="font-black text-[14px] min-w-[36px] text-right" style={{ color }}>
                            {score}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <div className="px-5 pb-1 -mt-2">
                        <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${score}%`, background: `linear-gradient(90deg,${color},${color}cc)`, boxShadow: `0 0 8px ${color}88` }}
                          />
                        </div>
                      </div>
                      <AccordionContent className="px-5">
                        <div className="rounded-[12px] p-3 mt-1" style={{ background: "var(--surface)" }}>
                          <div className="text-[10px] font-bold tracking-[1px] mb-1.5" style={{ color: "var(--muted)" }}>
                            FEEDBACK
                          </div>
                          <div className="text-[12px] leading-relaxed" style={{ color: "var(--text)" }}>
                            {feedback}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                }
              )}
            </Accordion>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Pause Analysis */}
          <div className="border rounded-[20px] p-4 sm:p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[15px] font-extrabold mb-3.5">Pause Analysis</div>
            <div className="flex gap-2.5">
              {[
                { value: pauseAnalysis.status, label: "Status" },
                { value: String(pauseAnalysis.count), label: "Count" },
                { value: pauseAnalysis.avgDuration, label: "Avg Duration" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 rounded-[12px] p-2.5 sm:p-3 text-center" style={{ background: "var(--surface)" }}>
                  <div className="text-[14px] sm:text-[16px] font-extrabold" style={{ color: "var(--accent)" }}>{value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-[10px] p-2.5 text-[12px] leading-relaxed" style={{ background: "var(--surface)", color: "var(--muted-soft)" }}>
              {pauseAnalysis.suggestion}
            </div>
          </div>

          {/* Grammar Issues */}
          <div className="border rounded-[20px] p-4 sm:p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-[15px] font-extrabold">Grammar Issues</div>
              <span className="rounded-[8px] px-2.5 py-1 text-[12px] font-bold" style={{ background: "#FF4D6A22", color: "#FF4D6A" }}>
                {grammarIssues.length} found
              </span>
            </div>
            {grammarIssues.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--green)" }}>No grammar issues detected!</div>
            ) : grammarIssues.map((issue, i) => (
              <div key={i} className="rounded-[12px] p-2.5 mb-2 last:mb-0" style={{ background: "var(--surface)" }}>
                <div className="text-[12px] line-through mb-0.5" style={{ color: "#FF4D6A" }}>{issue.wrong}</div>
                <div className="text-[12px] font-bold" style={{ color: "#22D37A" }}>{issue.correct}</div>
              </div>
            ))}
          </div>

          {/* Filler Words */}
          <div className="border rounded-[20px] p-4 sm:p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[15px] font-extrabold mb-3">Filler Words</div>
            {fillerWords.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--green)" }}>No filler words detected!</div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {fillerWords.map((fw) => (
                  <div key={fw.word} className="border rounded-[8px] px-3 py-1.5 text-[12px] font-semibold" style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}>
                    "{fw.word}" x{fw.count}
                  </div>
                ))}
              </div>
            )}
            {fillerWords.length > 0 && (
              <div className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>
                Try replacing filler words with a brief pause.
              </div>
            )}
          </div>

          {/* WinSpeak Analysis */}
          <div className="border rounded-[20px] p-4 sm:p-5 mb-4" style={{ background: "linear-gradient(135deg,#7C5CFC11,#1A1D2E)", borderColor: "#7C5CFC44" }}>
            <div className="text-[15px] font-extrabold mb-3">WinSpeak Analysis</div>
            <div className="text-[13px] leading-[1.7]" style={{ color: "var(--muted-soft)" }}>
              {winSpeakAnalysis}
            </div>
          </div>

          {/* Strengths & Improve */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 border rounded-[18px] p-3.5 sm:p-4" style={{ background: "#22D37A11", borderColor: "#22D37A44" }}>
              <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "#4DEBA0" }}>Strengths</div>
              {strengths.map((s) => (
                <div key={s} className="text-[11px] mb-1.5 flex gap-1.5 items-start" style={{ color: "#D4FAE9" }}>
                  <span className="flex-shrink-0 font-bold" style={{ color: "#4DEBA0" }}>✓</span>{s}
                </div>
              ))}
            </div>
            <div className="flex-1 border rounded-[18px] p-3.5 sm:p-4" style={{ background: "#FF4D6A11", borderColor: "#FF4D6A44" }}>
              <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "#FF7A8E" }}>Improve</div>
              {improvements.map((s) => (
                <div key={s} className="text-[11px] mb-1.5 flex gap-1.5 items-start" style={{ color: "#FFD6DD" }}>
                  <span className="flex-shrink-0 font-bold" style={{ color: "#FF7A8E" }}>→</span>{s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FULL-WIDTH BOTTOM: Ideal Response + Back */}
        <div className="lg:col-span-2">
          <div
            className="border rounded-[20px] p-4 sm:p-5 mb-5"
            style={{
              background: "linear-gradient(135deg,#FFB83008,#1A1D2E)",
              borderColor: idealPlaying ? "#FFB83066" : "#FFB83044",
              transition: "border-color 0.3s",
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <div className="text-[15px] font-extrabold">Ideal Response</div>
              <div className="border rounded-[8px] px-2.5 py-1 text-[10px] font-bold" style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}>
                AI Generated
              </div>
            </div>

            {/* Audio player (live mode only) */}
            {!isHistorical && (
              <>
                <div className="text-[11px] mb-4" style={{ color: "var(--muted-soft)" }}>
                  {idealReady ? "Tap play to hear the ideal spoken response" : idealLoading ? "Preparing audio..." : "Audio unavailable"}
                </div>

                <div
                  className="border rounded-[16px] p-4 sm:p-5 mb-4"
                  style={{
                    background: idealPlaying
                      ? "linear-gradient(135deg, #1A1D2E, #FFB83008)"
                      : "var(--card)",
                    borderColor: idealPlaying ? "#FFB83044" : "var(--border)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Player header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold tracking-[1.2px]" style={{ color: "var(--muted)" }}>
                      LISTEN TO IDEAL ANSWER
                    </div>
                    {idealPlaying && (
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-end gap-[2px]">
                          {[3, 5, 4, 6, 3].map((h, i) => (
                            <span
                              key={i}
                              className="w-[2.5px] rounded-full block"
                              style={{
                                height: h * 2.5,
                                background: "#FFB830",
                                animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                              }}
                            />
                          ))}
                        </span>
                        <span className="text-[10px] font-semibold" style={{ color: "#FFB830" }}>
                          Playing
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Play button + info */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <button
                      onClick={toggleIdealPlay}
                      disabled={!idealReady}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-none flex items-center justify-center cursor-pointer flex-shrink-0 disabled:opacity-40 transition-all"
                      style={{
                        background: idealPlaying
                          ? "linear-gradient(135deg,#FFB830,#FF8C00)"
                          : idealLoading
                          ? "var(--surface)"
                          : "var(--surface)",
                        boxShadow: idealPlaying ? "0 0 24px #FFB83044" : "none",
                        color: idealPlaying ? "#000" : "var(--text)",
                      }}
                    >
                      {idealLoading ? (
                        <span
                          className="w-5 h-5 rounded-full border-2 border-t-transparent block"
                          style={{ borderColor: "var(--muted)", animation: "spin 0.8s linear infinite" }}
                        />
                      ) : idealPlaying ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] sm:text-[14px] font-bold truncate">
                        {idealLoading
                          ? "Generating audio..."
                          : idealPlaying
                          ? "Playing ideal response..."
                          : idealReady
                          ? "Tap to hear ideal answer"
                          : "Audio not available"}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                        {idealReady
                          ? `${formatTime(idealTime)} / ${formatTime(idealDuration)}`
                          : "Powered by Gemini TTS"}
                      </div>
                    </div>
                  </div>

                  {/* Waveform */}
                  <div className="mb-3">
                    <IdealWaveViz playing={idealPlaying} progress={idealProgress} />
                  </div>

                  {/* Seekable progress bar */}
                  <div
                    className="h-[6px] rounded-full cursor-pointer relative group"
                    style={{ background: "var(--border)" }}
                    onClick={seekIdeal}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
                      style={{
                        width: `${idealProgress * 100}%`,
                        background: "linear-gradient(90deg, #FFB830, #FF8C00)",
                        boxShadow: idealPlaying ? "0 0 8px #FFB83044" : "none",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 sm:w-3.5 sm:h-3.5 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      style={{
                        left: `calc(${idealProgress * 100}% - 10px)`,
                        background: "#fff",
                        boxShadow: "0 0 8px #FFB83088",
                      }}
                    />
                  </div>

                  {/* Time labels */}
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--muted)" }}>
                      {formatTime(idealTime)}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums" style={{ color: "var(--muted)" }}>
                      {formatTime(idealDuration)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Transcript (always shown) */}
            <div className="rounded-[14px] p-3.5" style={{ background: "var(--surface)", borderLeft: "3px solid #FFB830" }}>
              <div className="text-[10px] font-bold tracking-[1px] mb-2.5" style={{ color: "var(--muted)" }}>
                TRANSCRIPT
              </div>
              <p className="text-[12px] leading-[1.8] whitespace-pre-line" style={{ color: "var(--text)" }}>
                {idealResponse}
              </p>
            </div>
          </div>

          {/* Preparation Strategy (shown when all attempts used and not passed) */}
          {!isHistorical && allAttemptsUsed && activeChallenge && (() => {
            // Aggregate weakest skills across all failed attempts
            const allSkillScores: Record<string, number[]> = {};
            const allGrammarIssues: string[] = [];
            const allFillerWords: Record<string, number> = {};

            for (const attempt of challengeAttempts) {
              if (attempt.skills) {
                for (const [skill, score] of Object.entries(attempt.skills)) {
                  if (!allSkillScores[skill]) allSkillScores[skill] = [];
                  allSkillScores[skill].push(score);
                }
              }
              if (attempt.analysisResult) {
                for (const gi of attempt.analysisResult.grammarIssues) {
                  if (!allGrammarIssues.includes(gi.wrong)) allGrammarIssues.push(gi.wrong);
                }
                for (const fw of attempt.analysisResult.fillerWords) {
                  allFillerWords[fw.word] = (allFillerWords[fw.word] ?? 0) + fw.count;
                }
              }
            }
            // Also include current attempt data
            for (const gi of grammarIssues) {
              if (!allGrammarIssues.includes(gi.wrong)) allGrammarIssues.push(gi.wrong);
            }
            for (const fw of fillerWords) {
              allFillerWords[fw.word] = (allFillerWords[fw.word] ?? 0) + fw.count;
            }
            for (const [skill, { score }] of Object.entries(skills)) {
              if (!allSkillScores[skill]) allSkillScores[skill] = [];
              allSkillScores[skill].push(score);
            }

            const avgSkills = Object.entries(allSkillScores)
              .map(([skill, scores]) => ({
                skill,
                avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
              }))
              .sort((a, b) => a.avg - b.avg);

            const weakest3 = avgSkills.slice(0, 3);
            const topFillers = Object.entries(allFillerWords)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);

            const SKILL_EXERCISES: Record<string, string> = {
              Fluency: "Record yourself for 60 seconds on any topic daily. Focus on speaking without stopping.",
              Grammar: "Write out your response first, then speak it. Review common grammar mistakes from your reports.",
              Vocabulary: "Learn 3 new expressive words daily. Practice using them in sentences aloud.",
              Clarity: "Practice the 'one idea per sentence' rule. Record and listen back for clarity.",
              Structure: "Use the Point → Evidence → Summary framework. Outline before you speak.",
              Relevancy: "Re-read the challenge scenario 3 times. List the key points the audience cares about.",
            };

            return (
              <div
                className="border rounded-[22px] p-5 sm:p-6 mb-5"
                style={{
                  background: "linear-gradient(135deg, #FF4D6A08, #1A1D2E)",
                  borderColor: "#FF4D6A44",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[22px]">📋</span>
                  <div>
                    <div className="text-[17px] font-extrabold">Preparation Strategy</div>
                    <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                      Personalized plan based on your {challengeAttempts.length + 1} attempts
                    </div>
                  </div>
                </div>

                {/* Focus Areas */}
                <div className="mb-4">
                  <div className="text-[12px] font-bold tracking-[1px] mb-2.5" style={{ color: "#FF7A8E" }}>
                    FOCUS AREAS
                  </div>
                  <div className="flex flex-col gap-2">
                    {weakest3.map(({ skill, avg }) => (
                      <div key={skill} className="flex items-center gap-3">
                        <span className="text-[13px] font-bold w-24">{skill}</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${avg}%`, background: scoreColor(avg) }}
                          />
                        </div>
                        <span
                          className="text-[13px] font-extrabold min-w-[32px] text-right"
                          style={{ color: scoreColor(avg) }}
                        >
                          {avg}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice Exercises */}
                <div className="mb-4">
                  <div className="text-[12px] font-bold tracking-[1px] mb-2.5" style={{ color: "#FFB830" }}>
                    PRACTICE EXERCISES
                  </div>
                  <div className="flex flex-col gap-2">
                    {weakest3.map(({ skill }) => (
                      <div
                        key={skill}
                        className="rounded-[12px] p-3"
                        style={{ background: "var(--surface)" }}
                      >
                        <div className="text-[12px] font-bold mb-1">{skill}</div>
                        <div className="text-[11px] leading-relaxed" style={{ color: "var(--muted-soft)" }}>
                          {SKILL_EXERCISES[skill] ?? "Practice this skill regularly with focused drills."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Mistakes */}
                {(allGrammarIssues.length > 0 || topFillers.length > 0) && (
                  <div className="mb-4">
                    <div className="text-[12px] font-bold tracking-[1px] mb-2.5" style={{ color: "#FF4D6A" }}>
                      KEY MISTAKES TO FIX
                    </div>
                    <div className="rounded-[12px] p-3" style={{ background: "var(--surface)" }}>
                      {allGrammarIssues.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[11px] font-bold mb-1">Recurring grammar issues:</div>
                          <div className="text-[11px] leading-relaxed" style={{ color: "var(--muted-soft)" }}>
                            {allGrammarIssues.slice(0, 5).map((g, i) => (
                              <span key={i} className="inline-block border rounded-[6px] px-2 py-0.5 mr-1.5 mb-1" style={{ background: "#FF4D6A11", borderColor: "#FF4D6A33", color: "#FF7A8E" }}>
                                "{g}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {topFillers.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold mb-1">Top filler words:</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {topFillers.map(([word, count]) => (
                              <span key={word} className="border rounded-[6px] px-2 py-0.5 text-[10px] font-bold" style={{ background: "#FFB83011", borderColor: "#FFB83033", color: "#FFB830" }}>
                                "{word}" x{count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Try Again button */}
                <Button
                  onClick={() => {
                    store.resetChallengeAttempts(activeChallenge.id);
                    session.reset();
                    navigate("/");
                  }}
                >
                  🔄 Reset & Try Again
                </Button>
              </div>
            );
          })()}

          <div className="pb-4">
            {isHistorical ? (
              <Button onClick={() => navigate("/history")}>← Back to History</Button>
            ) : passed ? (
              <Button onClick={() => { session.reset(); navigate("/"); }}>← Continue to Next Challenge</Button>
            ) : !allAttemptsUsed ? (
              <div className="flex gap-3">
                <Button onClick={() => { session.reset(); navigate("/audiocheck"); }}>
                  🔄 Retry Challenge
                </Button>
                <Button
                  onClick={() => { session.reset(); navigate("/"); }}
                >
                  ← Back to Home
                </Button>
              </div>
            ) : (
              <Button onClick={() => { session.reset(); navigate("/"); }}>← Back to Home</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
