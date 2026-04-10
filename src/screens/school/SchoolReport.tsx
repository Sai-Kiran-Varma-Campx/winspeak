import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { synthesizeSpeech, stopAudioPlayback } from "@/services/gemini";
import Spinner from "@/components/Spinner";
import StarRating from "@/components/StarRating";
import { scoreToStars } from "@/lib/stars";
import type { AnalysisResult } from "@/types";

interface SchoolAttemptRow {
  id: string;
  studentId: string;
  questionTitle: string;
  categoryId: string;
  grade: number;
  score: number;
  skillFluency?: number; skillGrammar?: number; skillVocabulary?: number;
  skillClarity?: number; skillStructure?: number; skillRelevancy?: number;
  confidenceScore?: number;
  analysisResult?: AnalysisResult;
  createdAt: string;
}

const CARD_COLORS = [
  { bg: "#FCE7F3", bd: "#F9A8D4", icon: "#FDF2F8" },   // Clarity — pink
  { bg: "#CCFBF1", bd: "#5EEAD4", icon: "#F0FDFA" },   // Fluency — teal
  { bg: "#FEF3C7", bd: "#FCD34D", icon: "#FFFBEB" },   // Grammar — amber
  { bg: "#FCE7F3", bd: "#F9A8D4", icon: "#FDF2F8" },   // Relevancy — pink
  { bg: "#CCFBF1", bd: "#5EEAD4", icon: "#F0FDFA" },   // Structure — teal
  { bg: "#FEF3C7", bd: "#FCD34D", icon: "#FFFBEB" },   // Vocabulary — amber
];

const SKILL_CARDS: { key: keyof SchoolAttemptRow; title: string; emoji: string; friendly: string; parentTip: string }[] = [
  { key: "skillClarity",    title: "Clarity",    emoji: "🔊", friendly: "Clear Words",   parentTip: "How clearly the student spoke — includes pronunciation, word clarity, voice modulation, and voice projection. Practice by having them describe objects around the house in full, clear sentences." },
  { key: "skillFluency",    title: "Fluency",    emoji: "🌊", friendly: "Good Flow",     parentTip: "How smoothly the student spoke without long pauses or hesitation. Encourage reading aloud at home for 5 minutes daily — it builds natural flow over time." },
  { key: "skillGrammar",    title: "Grammar",    emoji: "✏️", friendly: "Word Builder",  parentTip: "How correctly the student used grammar — tenses, sentence construction, and word agreement. When you notice a mistake in conversation, gently model the correct version rather than correcting directly." },
  { key: "skillRelevancy",  title: "Relevancy",  emoji: "🎯", friendly: "On Topic",      parentTip: "How well the student stayed on topic and addressed the question asked. Practice by giving a topic and asking them to talk about it for 30 seconds without going off track." },
  { key: "skillStructure",  title: "Structure",  emoji: "🧱", friendly: "Strong Shape",  parentTip: "How well organised the student's response was — did it have a clear beginning, middle, and end? Teach them to start with 'First...', 'Then...', 'Finally...' to build structure." },
  { key: "skillVocabulary",  title: "Vocabulary", emoji: "📚", friendly: "Big Words",    parentTip: "How varied and age-appropriate the student's word choices were. Introduce one new word a day at dinner and have them use it in a sentence — this builds vocabulary naturally." },
];

function LionIllustration({ tier }: { tier: 0 | 1 | 2 | 3 | 4 }) {
  const emojiSize = [56, 64, 72, 84, 96][tier];
  return (
    <span style={{
      fontSize: emojiSize, lineHeight: 1, userSelect: "none",
      transition: "font-size 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      🦁
    </span>
  );
}

function BraveMeter({ confidence }: { confidence: number }) {
  const c = Math.max(0, Math.min(100, confidence));
  const tier: 0 | 1 | 2 | 3 | 4 =
    c >= 80 ? 4 : c >= 60 ? 3 : c >= 40 ? 2 : c >= 20 ? 1 : 0;
  const label =
    c >= 80 ? "Roaring Brave!" :
    c >= 60 ? "Strong & Steady!" :
    c >= 40 ? "Getting Braver!" :
    c >= 20 ? "Getting Started!" : "Finding Your Voice!";

  return (
    <div className="bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] p-6 mb-6 rounded-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)]">
      <div className="text-[12px] font-black tracking-[0.08em] mb-4 text-[#B45309] uppercase">
        HOW BRAVE YOU SOUNDED! 💪
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <LionIllustration tier={tier} />
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: 18, color: "#7C2D12", marginBottom: 2, marginTop: -4,
          }}>
            {label}
          </div>
          <StarRating stars={scoreToStars(c)} size={28} />
        </div>
      </div>
    </div>
  );
}

function SkillCard({
  emoji, title, friendly, score, expanded, onToggle, feedback, parentTip, cardColor,
}: {
  emoji: string;
  title: string;
  friendly: string;
  score: number | null;
  expanded: boolean;
  onToggle: () => void;
  feedback?: string;
  parentTip: string;
  cardColor: { bg: string; bd: string; icon: string };
}) {
  const stars = score != null ? scoreToStars(score) : 0;
  return (
    <button
      onClick={onToggle}
      className="p-4 text-left cursor-pointer rounded-[20px] shadow-[0_2px_0_rgba(42,31,26,0.06)] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_4px_12px_rgba(42,31,26,0.08)]"
      style={{
        gridColumn: expanded ? "1 / -1" : undefined,
        background: cardColor.bg,
        border: `1.5px solid ${cardColor.bd}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center text-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)]" style={{ background: cardColor.icon, border: `1.5px solid ${cardColor.bd}` }}>{emoji}</div>
        <div className="flex-1">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="text-[17px] font-black tracking-[-0.01em] text-[#7C2D12]" style={{ fontFamily: "'Sora', sans-serif" }}>{title}</div>
              <div className="text-[11px] font-bold text-[#A8603C]">{friendly}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8603C" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", opacity: 0.5, flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <StarRating stars={stars} size={20} />
      </div>
      {!expanded && (
        <div style={{ fontSize: 11, color: "#A8603C", opacity: 0.5, marginTop: 6, fontWeight: 600 }}>
          Tap for details
        </div>
      )}
      {expanded && (
        <div className="mt-4 pt-4 border-t-[1.5px] border-dashed border-[rgba(124,45,18,0.12)] animate-in slide-in-from-top-2 duration-300">
          {/* AI feedback */}
          {feedback && (
            <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 600, color: "#7C2D12", marginBottom: 12 }}>
              {feedback}
            </div>
          )}
          {/* Parent/Teacher tip */}
          <div style={{
            background: "#FEF3C7", border: "1.5px solid #FCD34D",
            borderRadius: 14, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              📋 For Teacher & Parent
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#92400E", lineHeight: 1.5 }}>
              {parentTip}
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

export default function SchoolReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [row, setRow] = useState<SchoolAttemptRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [speaking, setSpeaking] = useState(false);
  const [playingIdeal, setPlayingIdeal] = useState(false);

  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [r, students] = await Promise.all([
          api.getSchoolAttempt(id),
          api.listStudents() as Promise<{ id: string; fullName: string }[]>,
        ]);
        setRow(r);
        const match = students.find((s) => s.id === r.studentId);
        if (match) setStudentName(match.fullName);
      } catch (e: any) {
        setError(e?.message || "Could not load report.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      stopAudioPlayback();
    };
  }, [id]);

  const ar = row?.analysisResult;
  const confidence = useMemo(() => {
    if (row?.confidenceScore != null) return row.confidenceScore;
    if (ar?.confidenceScore != null) return ar.confidenceScore;
    return row?.score ?? 0;
  }, [row, ar]);

  async function readAloud() {
    if (!ar?.winSpeakAnalysis || speaking) return;
    setSpeaking(true);
    try {
      await synthesizeSpeech(ar.winSpeakAnalysis);
    } catch {
      // best-effort
    } finally {
      setSpeaking(false);
    }
  }

  async function readIdealAloud() {
    if (!ar?.idealResponse || playingIdeal) return;
    setPlayingIdeal(true);
    try {
      await synthesizeSpeech(ar.idealResponse);
    } catch {
      // best-effort
    } finally {
      setPlayingIdeal(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner size={32} /></div>;
  }
  if (error || !row) {
    return (
      <div className="p-6 text-center">
        <div className="text-[16px] font-extrabold">Couldn't load report</div>
        <div className="text-[13px] mt-1 text-[#A8603C]">{error || "Not found."}</div>
        <button
          onClick={() => navigate("/school")}
          className="mt-4 rounded-[12px] px-5 py-2.5 font-extrabold text-[13px] border-none cursor-pointer text-white"
          style={{ background: "#EA580C" }}
        >
          Back to Teacher Home
        </button>
      </div>
    );
  }

  const strengths = (ar?.strengths ?? []).slice(0, 2);
  const improvement = (ar?.improvements ?? [])[0];
  const grammarIssues = ar?.grammarIssues ?? [];
  const fillerWords = ar?.fillerWords ?? [];
  const whatYouGotRight = ar?.whatYouGotRight ?? [];
  const idealResponse = ar?.idealResponse;

  function handleDownloadPDF() {
    // Set a filename-friendly document title so the browser suggests it for the PDF
    const originalTitle = document.title;
    const studentLabel = studentName || "Student";
    const dateStr = new Date(row.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    document.title = `Winnify Jr Report - ${row.questionTitle} - ${studentLabel} - ${dateStr}`;
    window.print();
    // Restore original title after a short delay (print dialog is async)
    setTimeout(() => { document.title = originalTitle; }, 1000);
  }

  const reportDate = new Date(row.createdAt).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="print-area max-w-[800px] mx-auto px-6 py-8 pb-32">
      {/* ── Print-only branded header ── */}
      <div className="print-only print-header">
        <div className="print-header-brand">
          <div className="print-header-logo">W</div>
          <div>
            <div className="print-header-title">Winnify Jr Report Card</div>
            <div className="print-header-subtitle">AI Speaking Coach &middot; Grade {row.grade}</div>
          </div>
        </div>
        <div className="print-header-date">
          {reportDate}<br />
          Student: {studentName || "—"}
        </div>
      </div>

      {/* Header + actions */}
      <div className="flex justify-between items-center py-4 mb-4 no-print animate-in fade-in slide-in-from-bottom-4 duration-700">
        <button
          onClick={() => navigate(-1)}
          className="text-[13px] font-extrabold text-[#EA580C] border-none bg-transparent flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="w-8 h-8 rounded-[10px] border-[1.5px] border-[#FDBA74] bg-[#FED7AA] inline-flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5.5 8L10 13" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span> Back
        </button>
        <button
          onClick={handleDownloadPDF}
          className="cursor-pointer border-none transition-all hover:translate-y-[-3px] active:translate-y-[1px]"
          style={{
            background: "none", padding: 0,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
          }}
        >
          <svg width="100" height="74" viewBox="0 0 100 74" fill="none" style={{ filter: "drop-shadow(0 4px 0 rgba(13,148,136,0.2)) drop-shadow(0 8px 16px rgba(13,148,136,0.1))" }}>
            <path d="M80 34a18 18 0 0 0-34.5-8A15 15 0 0 0 15 37a15 15 0 0 0 15 15h50a15 15 0 0 0 0-30z" fill="url(#cloudGrad2)" stroke="#5EEAD4" strokeWidth="2"/>
            <defs>
              <linearGradient id="cloudGrad2" x1="0" y1="0" x2="100" y2="74" gradientUnits="userSpaceOnUse">
                <stop stopColor="#CCFBF1"/>
                <stop offset="1" stopColor="#F0FDFA"/>
              </linearGradient>
            </defs>
            <path d="M50 26v16M44 36l6 6 6-6" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: 14, color: "#0D9488", marginTop: 4,
          }}>Download PDF</span>
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[100ms] mb-8">
        <div className="inline-block px-3 py-1 mb-3 rounded-full bg-[#CCFBF1] border-[1.5px] border-[#5EEAD4] text-[11px] font-black tracking-widest text-[#0D9488] uppercase">
          ★ REPORT CARD
        </div>
        <h1 className="font-black text-[38px] leading-[1.1] tracking-[-0.02em] text-[#7C2D12]" style={{ fontFamily: "'Sora', sans-serif" }}>{row.questionTitle}</h1>
        <div className="text-[14px] mt-2 font-bold text-[#A8603C]">
          Grade {row.grade}{studentName ? ` · ${studentName}` : ""}
        </div>
      </div>

      {/* How Brave You Sounded */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[200ms]">
        <BraveMeter confidence={confidence} />
      </div>

      {/* How Did You Do — 2 × 3 cards */}
      <h2 className="text-[24px] font-black mb-4 tracking-[-0.02em] text-[#7C2D12] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[300ms]" style={{ fontFamily: "'Sora', sans-serif" }}>How Did You Do? ⭐</h2>
      <div className="grid grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[350ms]">
        {SKILL_CARDS.map((sc, idx) => {
          const score = row[sc.key] as number | undefined;
          const fbObj = ar?.skills?.[sc.title as keyof typeof ar.skills];
          return (
            <SkillCard
              key={sc.title}
              emoji={sc.emoji}
              title={sc.title}
              friendly={sc.friendly}
              score={score ?? null}
              expanded={!!expanded[sc.title]}
              onToggle={() => setExpanded((p) => ({ ...p, [sc.title]: !p[sc.title] }))}
              feedback={fbObj?.feedback}
              parentTip={sc.parentTip}
              cardColor={CARD_COLORS[idx]}
            />
          );
        })}
      </div>

      {/* WinSpeak Analysis with Read it to me */}
      {ar?.winSpeakAnalysis && (
        <div className="bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] p-6 mb-8 rounded-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)] relative animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms]">
          <div className="text-[12px] font-black tracking-[0.08em] mb-3 text-[#B45309] uppercase">
            WINSPEAK SAYS ✨
          </div>
          <div className="text-[18px] leading-relaxed text-[#7C2D12] font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>{ar.winSpeakAnalysis}</div>
          <button
            onClick={readAloud}
            disabled={speaking}
            className="mt-5 rounded-full px-4 py-2.5 text-[13px] font-black border-[1.5px] border-[#FCD34D] bg-white/60 text-[#B45309] shadow-[0_2px_0_rgba(180,83,9,0.1)] cursor-pointer hover:-translate-y-0.5 transition-all w-fit flex items-center justify-center no-print"
            style={{ opacity: speaking ? 0.6 : 1 }}
          >
            {speaking ? "Playing…" : "Read it to me 🔊"}
          </button>
        </div>
      )}

      {/* Strengths — max 2 */}
      {strengths.length > 0 && (
        <div className="bg-[#CCFBF1] border-[1.5px] border-[#5EEAD4] p-6 mb-6 rounded-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[450ms]">
          <div className="text-[12px] font-black tracking-[0.08em] mb-4 text-[#0D9488] uppercase">
            WHAT YOU DID GREAT 🌟
          </div>
          <ul className="flex flex-col gap-3 m-0 p-0">
            {strengths.map((s, i) => (
              <li key={i} className="text-[15px] font-semibold flex items-start gap-3">
                <span className="text-[20px] bg-white rounded-full w-8 h-8 flex items-center justify-center shrink-0 border-[1px] border-[#5EEAD4]">👏</span>
                <span className="pt-1.5">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Try This Next Time — single tip */}
      {improvement && (
        <div className="bg-[#FCE7F3] border-[1.5px] border-[#F9A8D4] p-6 mb-6 rounded-[24px] shadow-[0_2px_0_rgba(219,39,119,0.1)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms]">
          <div className="absolute -right-4 -top-4 text-[80px] opacity-20 rotate-12 pointer-events-none">💡</div>
          <div className="text-[12px] font-black tracking-[0.08em] mb-3 text-[#DB2777] uppercase">
            TRY THIS NEXT TIME! 💡
          </div>
          <div className="text-[18px] font-bold text-[#7C2D12] leading-snug" style={{ fontFamily: "'Sora', sans-serif" }}>{improvement}</div>
        </div>
      )}

      {/* Let's Fix These! */}
      <div className="bg-[#FEF3C7] border-[1.5px] border-[#FCD34D] p-6 mb-6 rounded-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[550ms]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[12px] font-black tracking-[0.08em] text-[#B45309] uppercase">
            LET'S FIX THESE! ✏️
          </div>
          <span className="bg-white/60 rounded-full px-3 py-1 text-[12px] font-black text-[#B45309]">
            {grammarIssues.length} to practise
          </span>
        </div>

        {/* What you got right */}
        <div className="bg-white/50 border-[1.5px] border-[#FCD34D] rounded-[18px] p-4 mb-4">
          <div className="text-[12px] font-black mb-1.5 uppercase text-[#B45309]">
            What you got right 👍
          </div>
          <div className="text-[14px] font-bold text-[#92400E]" style={{ lineHeight: 1.5 }}>
            {whatYouGotRight.length > 0
              ? whatYouGotRight.join(" ")
              : "You spoke up and finished your turn — that's brilliant!"}
          </div>
        </div>

        {grammarIssues.length === 0 ? (
          <div className="text-[15px] font-bold text-[#B45309]">
            Nothing to fix today — wonderful work! 🎉
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grammarIssues.map((g, i) => (
              <div key={i} className="bg-white/60 rounded-[14px] p-3 flex items-center gap-3 flex-wrap">
                <span className="text-[15px] font-semibold text-[#B45309]">{g.wrong}</span>
                <span className="text-[13px] text-[#FCD34D]">→</span>
                <span className="text-[15px] font-black text-[#92400E]">{g.correct}</span>
              </div>
            ))}
          </div>
        )}

        {fillerWords.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: "1.5px dashed #FCD34D" }}>
            <div className="text-[12px] font-black uppercase mb-3 text-[#B45309]">Pause Words 🤔</div>
            <div className="flex flex-wrap gap-2">
              {fillerWords.map((f, i) => (
                <span key={i} className="bg-white/60 rounded-full px-3 py-1.5 text-[13px] font-bold text-[#B45309]">
                  {f.word} <span className="opacity-50 ml-1">×{f.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* A Better Way to Say It */}
      {idealResponse && (
        <div className="bg-[#CCFBF1] border-[1.5px] border-[#5EEAD4] p-6 mb-6 rounded-[24px] shadow-[0_2px_0_rgba(42,31,26,0.06)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[600ms]">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="text-[22px] font-black tracking-[-0.01em] text-[#0D9488]" style={{ fontFamily: "'Sora', sans-serif" }}>A Better Way to Say It 💡</div>
            <button
              onClick={playingIdeal ? () => { stopAudioPlayback(); setPlayingIdeal(false); } : readIdealAloud}
              className="no-print"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: playingIdeal ? "#0D9488" : "#fff",
                border: "2px solid #5EEAD4",
                cursor: "pointer", flexShrink: 0,
                display: "grid", placeItems: "center",
                boxShadow: playingIdeal ? "0 0 0 4px rgba(13,148,136,0.15)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={playingIdeal ? "#fff" : "#0D9488"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={playingIdeal ? "#fff" : "#0D9488"} />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>
          <div className="text-[13px] font-bold mb-4 text-[#0D9488]">
            Here's one way this speech could sound — use it to practise together!
          </div>
          <div className="text-[17px] leading-relaxed font-bold bg-white/50 p-4 rounded-[16px] border-[1px] border-[#5EEAD4] text-[#7C2D12]" style={{ fontFamily: "'Sora', sans-serif" }}>
            {idealResponse}
          </div>
        </div>
      )}

      {/* Spot the Difference */}
      {idealResponse && (
        <div className="bg-[#FCE7F3] border-[1.5px] border-[#F9A8D4] p-6 mb-6 rounded-[24px] shadow-[0_2px_0_rgba(219,39,119,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[650ms]">
          <div className="text-[12px] font-black tracking-[0.08em] mb-3 text-[#DB2777] uppercase">
            SPOT THE DIFFERENCE 👀
          </div>
          <div style={{
            fontFamily: "'Sora', sans-serif", fontWeight: 700,
            fontSize: 17, color: "#7C2D12", lineHeight: 1.5,
          }}>
            Can you find <span style={{ fontWeight: 800, color: "#DB2777" }}>2 things</span> that changed from your speech? Ask your teacher!
          </div>
        </div>
      )}

      {/* ── Print-only footer ── */}
      <div className="print-only print-footer">
        Generated by Winnify Jr &middot; AI Speaking Coach for Students &middot; {reportDate}
      </div>
    </div>
  );
}
