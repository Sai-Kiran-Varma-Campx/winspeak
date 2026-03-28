import StepProgress from "@/components/StepProgress";
import { Button } from "@/components/ui/button";
import { CHALLENGES } from "@/constants";
import { useSession } from "@/context/SessionContext";
import { useStore } from "@/context/UserStoreContext";
import { useInterval } from "@/hooks/useInterval";
import { playCoachVoice, stopAudioPlayback } from "@/services/gemini";
import type { ChallengeTier } from "@/types";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  { label: "Audio Check", status: "completed" as const },
  { label: "Rules & Question", status: "active" as const },
  { label: "Record", status: "pending" as const },
];

const TIER_STYLES: Record<
  ChallengeTier,
  { bg: string; color: string; border: string }
> = {
  Beginner: { bg: "#22D37A11", color: "#22D37A", border: "#22D37A44" },
  Intermediate: { bg: "#7C5CFC11", color: "#7C5CFC", border: "#7C5CFC44" },
  Advanced: { bg: "#FFB83011", color: "#FFB830", border: "#FFB83044" },
};

export default function Question() {
  const navigate = useNavigate();
  const store = useStore();
  const session = useSession();

  // Use session-selected challenge, fall back to first uncompleted
  const challenge =
    (session.challengeId
      ? CHALLENGES.find((c) => c.id === session.challengeId)
      : null) ??
    CHALLENGES.find((c) => !store.completedChallengeIds.includes(c.id)) ??
    CHALLENGES[0];

  const coachScript = `${challenge.week}: ${challenge.title}. ${challenge.scenario} Your task: ${challenge.prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!`;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);
  const [loadingTTS, setLoadingTTS] = useState(false);
  const [ttsError, setTtsError] = useState(false);
  const didSpeak = useRef(false);

  useInterval(
    () => setProgress((p) => Math.min(p + 1.5, 95)),
    isSpeaking ? 300 : null,
  );

  // Stop audio when leaving this page
  useEffect(() => {
    return () => stopAudioPlayback();
  }, []);

  useEffect(() => {
    if (didSpeak.current) return;
    didSpeak.current = true;
    speak();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function speak() {
    setLoadingTTS(true);
    setIsSpeaking(false);
    setTtsError(false);

    try {
      await playCoachVoice(challenge.id, coachScript, () => {
        setLoadingTTS(false);
        setIsSpeaking(true);
      });
    } catch {
      setTtsError(true);
    } finally {
      setIsSpeaking(false);
      setProgress(100);
      setVideoComplete(true);
      setLoadingTTS(false);
    }
  }

  async function handleReplay() {
    if (isSpeaking || loadingTTS) return;
    setProgress(0);
    setVideoComplete(false);
    await speak();
  }

  const tierStyle = challenge.tier ? TIER_STYLES[challenge.tier] : null;

  return (
    <div className="p-5 pb-8">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate("/")}
          className="rounded-[10px] px-3.5 py-2 text-[18px] cursor-pointer border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          ←
        </button>
        <div>
          <div
            className="text-[11px] font-semibold tracking-[1px]"
            style={{ color: "var(--muted)" }}
          >
            STEP 2 OF 3
          </div>
          <div className="text-[18px] font-extrabold">Rules & Question</div>
        </div>
      </div>

      <div className="mb-5">
        <StepProgress steps={STEPS} />
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* LEFT: AI Coach TTS panel */}
        <div>
          <div
            className="border rounded-[22px] flex flex-col items-center justify-center gap-2.5 relative overflow-hidden max-h-[200px] sm:max-h-none"
            style={{
              background: "linear-gradient(135deg,#1A1D2E,#0F1018)",
              borderColor: "var(--border)",
              aspectRatio: "16/9",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 40% 50%, #22D37A22, transparent 60%)",
              }}
            />
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[28px]"
              style={{ background: "linear-gradient(135deg,#22D37A,#7C5CFC)" }}
            >
              🤖
            </div>
            <div className="text-[13px] font-semibold flex items-center gap-2">
              {loadingTTS ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-t-transparent inline-block flex-shrink-0"
                    style={{
                      borderColor: "#22D37A",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Fetching voice...
                </>
              ) : isSpeaking ? (
                <>
                  <span className="flex items-end gap-0.5 flex-shrink-0">
                    {[3, 5, 4, 6, 3].map((h, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full block"
                        style={{
                          height: h * 3,
                          background: "#22D37A",
                          animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                        }}
                      />
                    ))}
                  </span>
                  Coach speaking...
                </>
              ) : ttsError ? (
                <span style={{ color: "#FF4D6A" }}>
                  Issue fetching audio. Please read the instructions to
                  continue.
                </span>
              ) : videoComplete ? (
                "Instructions complete ✓"
              ) : (
                "Preparing..."
              )}
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: ttsError
                    ? "#FF4D6A"
                    : "linear-gradient(90deg,var(--accent),#22D37A)",
                }}
              />
            </div>
          </div>

          <button
            onClick={handleReplay}
            disabled={isSpeaking || loadingTTS}
            className="border rounded-[12px] p-3 text-[13px] cursor-pointer w-full mt-3 disabled:opacity-40"
            style={{
              background: "transparent",
              borderColor: "var(--border)",
              color: "var(--muted)",
            }}
          >
            {ttsError ? "🔄 Retry Voice" : "🔊 Replay Instructions"}
          </button>
        </div>

        {/* RIGHT: Challenge card + submit */}
        <div className="flex flex-col gap-5">
          <div
            className="border rounded-[20px] p-5 relative overflow-hidden"
            style={{ background: "var(--card)", borderColor: "#7C5CFC44" }}
          >
            <div
              className="absolute"
              style={{
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "var(--accent-glow)",
                filter: "blur(30px)",
              }}
            />

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="text-[10px] font-semibold tracking-[1px]"
                style={{ color: "var(--muted)" }}
              >
                {challenge.week} · ACTIVE CHALLENGE
              </div>
              {tierStyle && challenge.tier && (
                <span
                  className="border rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    background: tierStyle.bg,
                    color: tierStyle.color,
                    borderColor: tierStyle.border,
                  }}
                >
                  {challenge.tier}
                </span>
              )}
            </div>

            <div className="text-[18px] font-extrabold mb-3 leading-snug">
              {challenge.title}
            </div>

            {/* Scenario */}
            <div
              className="rounded-[12px] p-3.5 mb-3"
              style={{
                background: "var(--surface)",
                borderLeft: "3px solid #FFB830",
              }}
            >
              <div
                className="text-[10px] font-bold tracking-[1px] mb-1.5"
                style={{ color: "#FFB830" }}
              >
                THE SITUATION
              </div>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: "#C8CCEC" }}
              >
                {challenge.scenario}
              </p>
            </div>

            {/* Prompt */}
            <div
              className="rounded-[12px] p-3.5 mb-4"
              style={{
                background: "var(--surface)",
                borderLeft: "3px solid var(--accent)",
              }}
            >
              <div
                className="text-[10px] font-bold tracking-[1px] mb-1.5"
                style={{ color: "var(--muted)" }}
              >
                YOUR TASK
              </div>
              <p className="text-[13px] leading-relaxed font-medium">
                {challenge.prompt}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-2.5">
              {[
                { value: "60s", label: "Max Time", color: "var(--accent)" },
                { value: "2", label: "Retries", color: "#22D37A" },
                {
                  value: `${challenge.xp}`,
                  label: "XP Reward",
                  color: "#FFB830",
                },
              ].map(({ value, label, color }) => (
                <div
                  key={label}
                  className="flex-1 rounded-[10px] p-2.5 text-center"
                  style={{ background: "var(--surface)" }}
                >
                  <div className="text-[18px] font-extrabold" style={{ color }}>
                    {value}
                  </div>
                  <div
                    className="text-[10px]"
                    style={{ color: "var(--muted)" }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            disabled={!videoComplete}
            onClick={() => navigate("/recording")}
          >
            {videoComplete
              ? "🎙 Start Recording →"
              : loadingTTS
                ? "Loading coach voice..."
                : "Listen to instructions first..."}
          </Button>
        </div>
      </div>
    </div>
  );
}
