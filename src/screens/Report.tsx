import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { synthesizeSpeech } from "@/services/gemini";
import { CHALLENGES } from "@/constants";

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

export default function Report() {
  const navigate = useNavigate();
  const session = useSession();
  const store = useStore();
  const result = session.analysisResult;
  const savedRef = useRef(false);
  const [xpSaved, setXpSaved] = useState(false);

  // Save attempt to localStorage once when result is available
  useEffect(() => {
    if (!result || savedRef.current) return;
    savedRef.current = true;

    const activeChallenge = CHALLENGES.find((c, i) => {
      if (store.completedChallengeIds.includes(c.id)) return false;
      return CHALLENGES.slice(0, i).every((ch) =>
        store.completedChallengeIds.includes(ch.id)
      );
    }) ?? CHALLENGES[1];

    store.addAttempt({
      challengeId: activeChallenge.id,
      challengeTitle: activeChallenge.title,
      score: result.overallScore,
      xpEarned: result.xpEarned,
      skills: Object.fromEntries(
        Object.entries(result.skills).map(([k, v]) => [k, v.score])
      ),
    });

    setTimeout(() => setXpSaved(true), 600);
    setTimeout(() => setXpSaved(false), 4000);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if no real result (e.g. navigated directly to /report)
  useEffect(() => {
    if (!result) navigate("/", { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const overallScore = result.overallScore;
  const xpEarned = result.xpEarned;
  const skills = result.skills;
  const grammarIssues = result.grammarIssues;
  const fillerWords = result.fillerWords;
  const pauseAnalysis = result.pauseAnalysis;
  const winSpeakAnalysis = result.winSpeakAnalysis;
  const strengths = result.strengths;
  const improvements = result.improvements;
  const idealResponse = result.idealResponse;

  const [isSpeakingIdeal, setIsSpeakingIdeal] = useState(false);
  const [idealLoadingTTS, setIdealLoadingTTS] = useState(false);

  async function handleIdealPlay() {
    if (isSpeakingIdeal || idealLoadingTTS) return;
    setIdealLoadingTTS(true);
    setIsSpeakingIdeal(false);
    try {
      await synthesizeSpeech(idealResponse, () => {
        setIdealLoadingTTS(false);
        setIsSpeakingIdeal(true);
      });
    } finally {
      setIsSpeakingIdeal(false);
      setIdealLoadingTTS(false);
    }
  }

  return (
    <div style={{ padding: "20px 20px 40px" }}>
      {/* XP saved toast */}
      {xpSaved && (
        <div
          className="border rounded-[14px] p-3.5 mb-4 flex items-center gap-3"
          style={{
            background: "#22D37A11",
            borderColor: "#22D37A44",
            animation: "fadeSlideIn 0.4s ease",
          }}
        >
          <span className="text-[22px]">⚡</span>
          <div>
            <div className="text-[13px] font-extrabold" style={{ color: "#22D37A" }}>
              +{xpEarned} XP saved to your profile!
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
            CHALLENGE COMPLETE
          </div>
          <div className="text-[20px] font-extrabold">Your Report 📊</div>
        </div>
        <Badge variant="completed">COMPLETED</Badge>
      </div>

      {/* Desktop 2-col grid */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* LEFT COLUMN: Score card + Skill breakdown */}
        <div>
          {/* Score Card */}
          <div
            className="border rounded-[24px] p-6 text-center mb-5 relative overflow-hidden"
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
              className="text-[11px] font-semibold tracking-[1.5px] mb-3"
              style={{ color: "var(--muted)" }}
            >
              OVERALL SCORE
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-[72px] font-black leading-none" style={{ color: "var(--accent)" }}>
                {overallScore}
              </span>
              <span className="text-[24px] font-bold" style={{ color: "var(--muted)" }}>
                /100
              </span>
            </div>
            <div className="text-[14px] font-bold" style={{ color: "#FFB830" }}>
              ⚡ +{xpEarned} XP Earned!
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-[18px]" style={{ opacity: i <= Math.round(overallScore / 20) ? 1 : 0.2 }}>
                  ⭐
                </span>
              ))}
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
          <div className="border rounded-[20px] p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[15px] font-extrabold mb-3.5">⏸ Pause Analysis</div>
            <div className="flex gap-2.5">
              {[
                { value: pauseAnalysis.status, label: "Status" },
                { value: String(pauseAnalysis.count), label: "Count" },
                { value: pauseAnalysis.avgDuration, label: "Avg Duration" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 rounded-[12px] p-3 text-center" style={{ background: "var(--surface)" }}>
                  <div className="text-[16px] font-extrabold" style={{ color: "var(--accent)" }}>{value}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-[10px] p-2.5 text-[12px] leading-relaxed" style={{ background: "var(--surface)", color: "var(--muted)" }}>
              💡 {pauseAnalysis.suggestion}
            </div>
          </div>

          {/* Grammar Issues */}
          <div className="border rounded-[20px] p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex justify-between items-center mb-3.5">
              <div className="text-[15px] font-extrabold">📝 Grammar Issues</div>
              <span className="rounded-[8px] px-2.5 py-1 text-[12px] font-bold" style={{ background: "#FF4D6A22", color: "#FF4D6A" }}>
                {grammarIssues.length} found
              </span>
            </div>
            {grammarIssues.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--green)" }}>✓ No grammar issues detected!</div>
            ) : grammarIssues.map((issue, i) => (
              <div key={i} className="rounded-[12px] p-2.5 mb-2 last:mb-0" style={{ background: "var(--surface)" }}>
                <div className="text-[12px] line-through mb-0.5" style={{ color: "#FF4D6A" }}>{issue.wrong}</div>
                <div className="text-[12px] font-bold" style={{ color: "#22D37A" }}>→ {issue.correct}</div>
              </div>
            ))}
          </div>

          {/* Filler Words */}
          <div className="border rounded-[20px] p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="text-[15px] font-extrabold mb-3">🗣 Filler Words</div>
            {fillerWords.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--green)" }}>✓ No filler words detected!</div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {fillerWords.map((fw) => (
                  <div key={fw.word} className="border rounded-[8px] px-3 py-1.5 text-[12px] font-semibold" style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}>
                    "{fw.word}" ×{fw.count}
                  </div>
                ))}
              </div>
            )}
            {fillerWords.length > 0 && (
              <div className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>
                💡 Try replacing filler words with a brief pause.
              </div>
            )}
          </div>

          {/* WinSpeak Analysis */}
          <div className="border rounded-[20px] p-5 mb-4" style={{ background: "linear-gradient(135deg,#7C5CFC11,#1A1D2E)", borderColor: "#7C5CFC44" }}>
            <div className="text-[15px] font-extrabold mb-3">✨ WinSpeak Analysis</div>
            <div className="text-[13px] leading-[1.7]" style={{ color: "var(--muted)" }}>
              {winSpeakAnalysis}
            </div>
          </div>

          {/* Strengths & Improve */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 border rounded-[18px] p-4" style={{ background: "#22D37A11", borderColor: "#22D37A33" }}>
              <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "#22D37A" }}>💪 Strengths</div>
              {strengths.map((s) => (
                <div key={s} className="text-[11px] mb-1.5 flex gap-1.5" style={{ color: "var(--text)" }}>
                  <span style={{ color: "#22D37A" }}>✓</span>{s}
                </div>
              ))}
            </div>
            <div className="flex-1 border rounded-[18px] p-4" style={{ background: "#FF4D6A11", borderColor: "#FF4D6A33" }}>
              <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "#FF4D6A" }}>🎯 Improve</div>
              {improvements.map((s) => (
                <div key={s} className="text-[11px] mb-1.5 flex gap-1.5" style={{ color: "var(--text)" }}>
                  <span style={{ color: "#FF4D6A" }}>→</span>{s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FULL-WIDTH BOTTOM: Ideal Response + Back */}
        <div className="lg:col-span-2">
          <div
            className="border rounded-[20px] p-5 mb-5"
            style={{ background: "linear-gradient(135deg,#FFB83008,#1A1D2E)", borderColor: "#FFB83044" }}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="text-[15px] font-extrabold">✨ Ideal Response</div>
              <div className="border rounded-[8px] px-2.5 py-1 text-[10px] font-bold" style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}>
                AI Generated
              </div>
            </div>
            <div className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>
              Tap play to hear it spoken aloud
            </div>

            {/* TTS Play button */}
            <div className="border rounded-[16px] p-3.5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleIdealPlay}
                  disabled={isSpeakingIdeal || idealLoadingTTS}
                  className="w-[46px] h-[46px] rounded-full border-none flex items-center justify-center text-[18px] cursor-pointer flex-shrink-0 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg,#FFB830,#FF8C00)",
                    color: "#000",
                    boxShadow: "0 4px 12px #FFB83044",
                  }}
                >
                  {idealLoadingTTS ? (
                    <span
                      className="w-5 h-5 rounded-full border-2 border-t-transparent block"
                      style={{ borderColor: "#000", animation: "spin 0.8s linear infinite" }}
                    />
                  ) : isSpeakingIdeal ? (
                    <span className="flex items-end gap-0.5">
                      {[3, 5, 4, 6, 3].map((h, i) => (
                        <span
                          key={i}
                          className="w-[2px] rounded-full block"
                          style={{
                            height: h * 2.5,
                            background: "#000",
                            animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                          }}
                        />
                      ))}
                    </span>
                  ) : (
                    "▶"
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold flex items-center gap-2">
                    {idealLoadingTTS ? (
                      <>Fetching voice from Gemini...</>
                    ) : isSpeakingIdeal ? (
                      <>
                        <span className="flex items-end gap-0.5">
                          {[2, 4, 3, 5, 2].map((h, i) => (
                            <span
                              key={i}
                              className="w-[3px] rounded-full block"
                              style={{
                                height: h * 3,
                                background: "#FFB830",
                                animation: `soundwave 0.8s ${i * 0.1}s ease-in-out infinite alternate`,
                              }}
                            />
                          ))}
                        </span>
                        Playing ideal response...
                      </>
                    ) : (
                      "Tap to play ideal response"
                    )}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                    Powered by Gemini TTS · Charon voice
                  </div>
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="rounded-[14px] p-3.5" style={{ background: "var(--surface)", borderLeft: "3px solid #FFB830" }}>
              <div className="text-[10px] font-bold tracking-[1px] mb-2.5" style={{ color: "var(--muted)" }}>
                TRANSCRIPT
              </div>
              <p className="text-[12px] leading-[1.8] whitespace-pre-line" style={{ color: "var(--text)" }}>
                {idealResponse}
              </p>
            </div>
          </div>

          <Button onClick={() => { session.reset(); navigate("/"); }}>← Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
