import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useInterval } from "@/hooks/useInterval";
import {
  SKILL_DATA,
  GRAMMAR_ISSUES,
  FILLER_WORDS,
  IDEAL_TRANSCRIPT,
} from "@/constants";

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
  const [idealPlaying, setIdealPlaying] = useState(false);
  const [idealProgress, setIdealProgress] = useState(0);

  useInterval(
    () => {
      setIdealProgress((p) => {
        if (p >= 100) {
          setIdealPlaying(false);
          return 100;
        }
        return p + 1.67;
      });
    },
    idealPlaying ? 1000 : null
  );

  function handleIdealPlay() {
    if (idealPlaying) {
      setIdealPlaying(false);
    } else {
      if (idealProgress >= 100) setIdealProgress(0);
      setIdealPlaying(true);
    }
  }

  const idealTimeSecs = Math.floor((idealProgress / 100) * 60);

  return (
    <div style={{ padding: "20px 20px 40px" }}>
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
            top: -40,
            right: -40,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "var(--accent-glow)",
            filter: "blur(50px)",
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
            80
          </span>
          <span className="text-[24px] font-bold" style={{ color: "var(--muted)" }}>
            /100
          </span>
        </div>
        <div className="text-[14px] font-bold" style={{ color: "#FFB830" }}>
          ⚡ +1000 XP Earned!
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="text-[18px]" style={{ opacity: i <= 4 ? 1 : 0.2 }}>
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
          {(Object.entries(SKILL_DATA) as [string, { score: number; feedback: string }][]).map(
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
                        style={{
                          background: `${color}22`,
                          color,
                          borderColor: `${color}44`,
                        }}
                      >
                        {label}
                      </span>
                      <span className="font-black text-[14px] min-w-[36px] text-right" style={{ color }}>
                        {score}
                      </span>
                    </div>
                  </AccordionTrigger>
                  {/* Score bar inside trigger area */}
                  <div className="px-5 pb-1 -mt-2">
                    <div
                      className="h-[5px] rounded-full overflow-hidden"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${score}%`,
                          background: `linear-gradient(90deg,${color},${color}cc)`,
                          boxShadow: `0 0 8px ${color}88`,
                        }}
                      />
                    </div>
                  </div>
                  <AccordionContent className="px-5">
                    <div
                      className="rounded-[12px] p-3 mt-1"
                      style={{ background: "var(--surface)" }}
                    >
                      <div
                        className="text-[10px] font-bold tracking-[1px] mb-1.5"
                        style={{ color: "var(--muted)" }}
                      >
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

      {/* Pause Analysis */}
      <div
        className="border rounded-[20px] p-5 mb-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="text-[15px] font-extrabold mb-3.5">⏸ Pause Analysis</div>
        <div className="flex gap-2.5">
          {[
            { value: "Good", label: "Status" },
            { value: "3", label: "Count" },
            { value: "1.2s", label: "Avg Duration" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex-1 rounded-[12px] p-3 text-center"
              style={{ background: "var(--surface)" }}
            >
              <div className="text-[16px] font-extrabold" style={{ color: "var(--accent)" }}>
                {value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-3 rounded-[10px] p-2.5 text-[12px] leading-relaxed"
          style={{ background: "var(--surface)", color: "var(--muted)" }}
        >
          💡 Suggestion: Your pauses are natural and well-timed. Consider pausing slightly
          longer after key points.
        </div>
      </div>

      {/* Grammar Issues */}
      <div
        className="border rounded-[20px] p-5 mb-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex justify-between items-center mb-3.5">
          <div className="text-[15px] font-extrabold">📝 Grammar Issues</div>
          <span
            className="rounded-[8px] px-2.5 py-1 text-[12px] font-bold"
            style={{ background: "#FF4D6A22", color: "#FF4D6A" }}
          >
            {GRAMMAR_ISSUES.length} found
          </span>
        </div>
        {GRAMMAR_ISSUES.map((issue, i) => (
          <div
            key={i}
            className="rounded-[12px] p-2.5 mb-2 last:mb-0"
            style={{ background: "var(--surface)" }}
          >
            <div className="text-[12px] line-through mb-0.5" style={{ color: "#FF4D6A" }}>
              {issue.wrong}
            </div>
            <div className="text-[12px] font-bold" style={{ color: "#22D37A" }}>
              → {issue.correct}
            </div>
          </div>
        ))}
      </div>

      {/* Filler Words */}
      <div
        className="border rounded-[20px] p-5 mb-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="text-[15px] font-extrabold mb-3">🗣 Filler Words</div>
        <div className="flex gap-2 flex-wrap">
          {FILLER_WORDS.map((fw) => (
            <div
              key={fw.word}
              className="border rounded-[8px] px-3 py-1.5 text-[12px] font-semibold"
              style={{
                background: "#FFB83022",
                borderColor: "#FFB83044",
                color: "#FFB830",
              }}
            >
              "{fw.word}" ×{fw.count}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[12px]" style={{ color: "var(--muted)" }}>
          💡 Try replacing "um" with a brief pause.
        </div>
      </div>

      {/* WinSpeak Analysis */}
      <div
        className="border rounded-[20px] p-5 mb-4"
        style={{
          background: "linear-gradient(135deg,#7C5CFC11,#1A1D2E)",
          borderColor: "#7C5CFC44",
        }}
      >
        <div className="text-[15px] font-extrabold mb-3">✨ WinSpeak Analysis</div>
        <div className="text-[13px] leading-[1.7]" style={{ color: "var(--muted)" }}>
          Your delivery showed strong conviction and clear structure. The opening hook was
          compelling, and your use of specific metrics added credibility. To take your pitch
          to the next level, focus on reducing filler words and adding a stronger
          call-to-action at the close.
        </div>
      </div>

      {/* Strengths & Improve */}
      <div className="flex gap-3 mb-5">
        <div
          className="flex-1 border rounded-[18px] p-4"
          style={{ background: "#22D37A11", borderColor: "#22D37A33" }}
        >
          <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "#22D37A" }}>
            💪 Strengths
          </div>
          {["High relevancy score", "Clear structure", "Strong vocabulary"].map((s) => (
            <div key={s} className="text-[11px] mb-1.5 flex gap-1.5" style={{ color: "var(--text)" }}>
              <span style={{ color: "#22D37A" }}>✓</span>
              {s}
            </div>
          ))}
        </div>
        <div
          className="flex-1 border rounded-[18px] p-4"
          style={{ background: "#FF4D6A11", borderColor: "#FF4D6A33" }}
        >
          <div className="text-[13px] font-extrabold mb-2.5" style={{ color: "#FF4D6A" }}>
            🎯 Improve
          </div>
          {["Reduce filler words", "Stronger structure", "Fewer grammar slips"].map((s) => (
            <div key={s} className="text-[11px] mb-1.5 flex gap-1.5" style={{ color: "var(--text)" }}>
              <span style={{ color: "#FF4D6A" }}>→</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Ideal Response */}
      <div
        className="border rounded-[20px] p-5 mb-5"
        style={{
          background: "linear-gradient(135deg,#FFB83008,#1A1D2E)",
          borderColor: "#FFB83044",
        }}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="text-[15px] font-extrabold">✨ Ideal Response</div>
          <div
            className="border rounded-[8px] px-2.5 py-1 text-[10px] font-bold"
            style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}
          >
            Andhra English
          </div>
        </div>
        <div className="text-[11px] mb-4" style={{ color: "var(--muted)" }}>
          121 words · ~60 sec speaking time
        </div>

        {/* Player */}
        <div
          className="border rounded-[16px] p-3.5 mb-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleIdealPlay}
              className="w-[46px] h-[46px] rounded-full border-none flex items-center justify-center text-[18px] cursor-pointer flex-shrink-0"
              style={{
                background: "linear-gradient(135deg,#FFB830,#FF8C00)",
                color: "#000",
                boxShadow: "0 4px 12px #FFB83044",
              }}
            >
              {idealPlaying ? "⏸" : "▶"}
            </button>
            <div className="flex-1">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(idealProgress, 100)}%`,
                    background: "linear-gradient(90deg,#FFB830,#FFB830cc)",
                    boxShadow: "0 0 8px #FFB83088",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  0:{String(idealTimeSecs).padStart(2, "0")}
                </span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  1:00
                </span>
              </div>
            </div>
          </div>
          {idealPlaying && (
            <div className="mt-2.5 flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#FFB830" }}
              />
              <span className="text-[10px] font-bold" style={{ color: "#FFB830" }}>
                Playing in Andhra English accent
              </span>
            </div>
          )}
        </div>

        {/* Transcript */}
        <div
          className="rounded-[14px] p-3.5"
          style={{
            background: "var(--surface)",
            borderLeft: "3px solid #FFB830",
          }}
        >
          <div
            className="text-[10px] font-bold tracking-[1px] mb-2.5"
            style={{ color: "var(--muted)" }}
          >
            TRANSCRIPT
          </div>
          <p
            className="text-[12px] leading-[1.8] whitespace-pre-line"
            style={{ color: "var(--text)" }}
          >
            {IDEAL_TRANSCRIPT}
          </p>
        </div>
      </div>

      <Button onClick={() => navigate("/")}>← Back to Home</Button>
    </div>
  );
}
