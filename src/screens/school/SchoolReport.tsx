import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { synthesizeSpeech, synthesizeSpeechCached, stopAudioPlayback } from "@/services/gemini";
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

const SKILL_CARDS: { key: keyof SchoolAttemptRow; title: string; icon: React.ReactNode; friendly: string; parentTip: string }[] = [
  { key: "skillClarity",    title: "Clarity",    icon: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="16" fill="#C4B5FD" opacity="0.3"/>
      {/* Megaphone shape */}
      <path d="M12 17h3l8-5v16l-8-5h-3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z" fill="#7C3AED"/>
      {/* Sound waves */}
      <path d="M27 16c2 2 2 6 0 8" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" fill="none">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </path>
      <path d="M30 13c3 3.5 3 10.5 0 14" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" fill="none">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
      </path>
    </svg>
  ), friendly: "Clear Words", parentTip: "How clearly the student spoke — includes pronunciation, word clarity, voice modulation, and voice projection. Practice by having them describe objects around the house in full, clear sentences." },
  { key: "skillFluency",    title: "Fluency",    icon: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <path d="M6 24c4-6 8-6 12 0s8 6 12 0" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M6 24c4-6 8-6 12 0s8 6 12 0;M6 20c4 6 8 6 12 0s8-6 12 0;M6 24c4-6 8-6 12 0s8 6 12 0" dur="3s" repeatCount="indefinite"/>
      </path>
      <path d="M6 18c4-6 8-6 12 0s8 6 12 0" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M6 18c4-6 8-6 12 0s8 6 12 0;M6 14c4 6 8 6 12 0s8-6 12 0;M6 18c4-6 8-6 12 0s8 6 12 0" dur="3s" repeatCount="indefinite" begin="0.3s"/>
      </path>
      <path d="M6 30c4-6 8-6 12 0s8 6 12 0" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" fill="none">
        <animate attributeName="d" values="M6 30c4-6 8-6 12 0s8 6 12 0;M6 26c4 6 8 6 12 0s8-6 12 0;M6 30c4-6 8-6 12 0s8 6 12 0" dur="3s" repeatCount="indefinite" begin="0.6s"/>
      </path>
    </svg>
  ), friendly: "Good Flow", parentTip: "How smoothly the student spoke without long pauses or hesitation. Encourage reading aloud at home for 5 minutes daily — it builds natural flow over time." },
  { key: "skillGrammar",    title: "Grammar",    icon: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect x="8" y="6" width="24" height="28" rx="3" fill="#C4B5FD" opacity="0.3"/>
      <rect x="10" y="8" width="20" height="24" rx="2" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M14 15h12M14 20h8M14 25h10" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="30" cy="28" r="6" fill="#7C3AED"/>
      <path d="M28 28l1.5 1.5 3-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ), friendly: "Word Builder", parentTip: "How correctly the student used grammar — tenses, sentence construction, and word agreement. When you notice a mistake in conversation, gently model the correct version rather than correcting directly." },
  { key: "skillRelevancy",  title: "Relevancy",  icon: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="14" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
      <circle cx="20" cy="20" r="10" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="20" r="6" stroke="#7C3AED" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="20" r="3" fill="#7C3AED"/>
      <path d="M30 10l2-2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ), friendly: "On Topic", parentTip: "How well the student stayed on topic and addressed the question asked. Practice by giving a topic and asking them to talk about it for 30 seconds without going off track." },
  { key: "skillStructure",  title: "Structure",  icon: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="24" width="10" height="10" rx="2" fill="#C4B5FD"/>
      <rect x="15" y="16" width="10" height="18" rx="2" fill="#A78BFA"/>
      <rect x="24" y="8" width="10" height="26" rx="2" fill="#7C3AED"/>
      <path d="M11 22l9-7 9-5" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ), friendly: "Strong Shape", parentTip: "How well organised the student's response was — did it have a clear beginning, middle, and end? Teach them to start with 'First...', 'Then...', 'Finally...' to build structure." },
  { key: "skillVocabulary",  title: "Vocabulary", icon: (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect x="6" y="8" width="18" height="24" rx="2" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5"/>
      <rect x="16" y="12" width="18" height="24" rx="2" fill="#C4B5FD" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M20 20h10M20 25h7M20 30h9" stroke="#4C1D95" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="12" y="24" fill="#7C3AED" fontSize="14" fontWeight="800" fontFamily="serif" textAnchor="middle">A</text>
    </svg>
  ), friendly: "Big Words", parentTip: "How varied and age-appropriate the student's word choices were. Introduce one new word a day at dinner and have them use it in a sentence — this builds vocabulary naturally." },
];

/* Purple palette only:
   Dark:   #4C1D95, #5B21B6
   Mid:    #7C3AED, #8B5CF6
   Light:  #A78BFA, #C4B5FD
   Bg:     #EDE9FE, #F5F3FF
   White:  #fff
   Text:   #4C1D95 (heading), #6E5E8A (body)
*/

function LionMeter({ confidence }: { confidence: number }) {
  const c = Math.max(0, Math.min(100, confidence));
  const tier: 0 | 1 | 2 | 3 | 4 =
    c >= 80 ? 4 : c >= 60 ? 3 : c >= 40 ? 2 : c >= 20 ? 1 : 0;
  const label =
    c >= 80 ? "Roaring Brave!" :
    c >= 60 ? "Strong & Steady!" :
    c >= 40 ? "Getting Braver!" :
    c >= 20 ? "Getting Started!" : "Finding Your Voice!";
  const emojiSize = [40, 48, 56, 64, 72][tier];

  return (
    <div style={{
      background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
      borderRadius: 24, padding: 24, marginBottom: 24,
    }}>
      <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 18, fontWeight: 500, color: "#4C1D95", marginBottom: 16 }}>
        How Brave You Sounded! 💪
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          fontSize: emojiSize, lineHeight: 1, userSelect: "none",
          transition: "font-size 600ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>🦁</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Fredoka', 'Sora', sans-serif", fontWeight: 500,
            fontSize: 20, color: "#4C1D95", marginBottom: 4,
          }}>{label}</div>
          <StarRating stars={scoreToStars(c)} size={28} />
        </div>
      </div>
    </div>
  );
}

function SkillCard({
  icon, title, friendly, score, expanded, onToggle, feedback, parentTip,
}: {
  icon: React.ReactNode; title: string; friendly: string; score: number | null;
  expanded: boolean; onToggle: () => void; feedback?: string; parentTip: string;
}) {
  const stars = score != null ? scoreToStars(score) : 0;
  return (
    <button
      onClick={onToggle}
      style={{
        alignSelf: "start",
        background: "rgba(237, 233, 254, 0.45)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1.5px solid rgba(196, 181, 253, 0.5)",
        borderRadius: 20, padding: 16, textAlign: "left", cursor: "pointer",
        boxShadow: "0 4px 16px rgba(124,58,237,0.08)",
        transition: "all 0.2s",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          boxShadow: "0 2px 0 rgba(124,58,237,0.06)",
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Fredoka', 'Sora', sans-serif", fontSize: 17, fontWeight: 500, color: "#4C1D95" }}>{title}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6E5E8A" }}>{friendly}</div>
            </div>
            <svg className="print-hide" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E5E8A" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", opacity: 0.5, flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <StarRating stars={stars} size={20} />
      </div>
      {!expanded && (
        <div className="print-hide" data-print-hide style={{ fontSize: 11, color: "#6E5E8A", opacity: 0.5, marginTop: 6, fontWeight: 600 }}>
          Tap for details
        </div>
      )}
      {expanded && (
        <div className="print-hide" data-print-hide style={{ marginTop: 16, paddingTop: 16, borderTop: "1.5px dashed rgba(124,58,237,0.12)" }}>
          {feedback && (
            <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 600, color: "#4C1D95", marginBottom: 12 }}>
              {feedback}
            </div>
          )}
          <div style={{
            background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
            borderRadius: 14, padding: "10px 14px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              📋 For Teacher & Parent
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#6E5E8A", lineHeight: 1.5 }}>
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
  const [loadingSpeech, setLoadingSpeech] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [loadingIdeal, setLoadingIdeal] = useState(false);
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
    return () => { stopAudioPlayback(); };
  }, [id]);

  const ar = row?.analysisResult;
  const confidence = useMemo(() => {
    if (row?.confidenceScore != null) return row.confidenceScore;
    if (ar?.confidenceScore != null) return ar.confidenceScore;
    return row?.score ?? 0;
  }, [row, ar]);

  async function readAloud() {
    if (!ar?.winSpeakAnalysis || speaking || loadingSpeech) return;
    setLoadingSpeech(true);
    try {
      await synthesizeSpeech(ar.winSpeakAnalysis, () => {
        setLoadingSpeech(false);
        setSpeaking(true);
      });
    } catch {} finally {
      setLoadingSpeech(false);
      setSpeaking(false);
    }
  }

  async function readIdealAloud() {
    if (!ar?.idealResponse || playingIdeal || loadingIdeal) return;
    setLoadingIdeal(true);
    try {
      // Use cached version — audio was pre-generated during analysis step 4
      await synthesizeSpeechCached(
        ar.idealResponse,
        `school_ideal_${id}`,
        () => {
          setLoadingIdeal(false);
          setPlayingIdeal(true);
        }
      );
    } catch {} finally {
      setLoadingIdeal(false);
      setPlayingIdeal(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner size={32} /></div>;
  if (error || !row) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#4C1D95" }}>Couldn't load report</div>
        <div style={{ fontSize: 13, marginTop: 4, color: "#6E5E8A" }}>{error || "Not found."}</div>
        <button onClick={() => navigate("/school")}
          style={{ marginTop: 16, borderRadius: 12, padding: "10px 20px", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer", color: "white", background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}>
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
    const originalTitle = document.title;
    const studentLabel = studentName || "Student";
    const dateStr = new Date(row!.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    document.title = `Winnify Jr Report - ${row!.questionTitle} - ${studentLabel} - ${dateStr}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  }

  const reportDate = new Date(row.createdAt).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const cs = { fontFamily: "'Fredoka', 'Sora', sans-serif" };

  return (
    <div className="print-area max-w-[800px] mx-auto px-6 py-8 pb-32">
      {/* Purple background that covers entire printed page — hidden on screen */}
      <div className="print-only print-bg" />
      {/* Print header — only visible in PDF */}
      <div className="print-only print-header">
        <div className="print-header-brand">
          <div className="print-header-logo">W</div>
          <div>
            <div className="print-header-title">{studentName ? `${studentName}'s Report` : "Report Card"}</div>
            <div className="print-header-subtitle">Grade {row.grade} &middot; {row.questionTitle}</div>
          </div>
        </div>
        <div className="print-header-date">{reportDate}<br />Winnify Jr &middot; AI Speaking Coach</div>
      </div>

      {/* ── Header Card — hidden in print, print-header shows instead ── */}
      <div className="no-print" style={{
        background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
        borderRadius: 24, padding: "24px 28px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "white", fontWeight: 700, ...cs, flexShrink: 0,
          }}>
            {(studentName || "S").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <h1 style={{ ...cs, fontSize: 26, fontWeight: 800, color: "#4C1D95", margin: 0, lineHeight: 1.2 }}>
              {studentName ? `${studentName}'s Report` : "Report Card"}
            </h1>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6E5E8A", marginTop: 2 }}>
              Grade {row.grade} | {reportDate}
            </div>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 10 }}>
            <button onClick={handleDownloadPDF} style={{
              padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 700,
              background: "#fff", border: "1.5px solid rgba(124,58,237,0.15)", color: "#4C1D95",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...cs,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v10M7 12l5 5 5-5"/><path d="M5 19h14"/></svg>
              Download PDF
            </button>
            <button onClick={() => { stopAudioPlayback(); navigate("/school/administer/run"); }} style={{
              padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 700,
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)", border: "none", color: "#fff",
              cursor: "pointer", ...cs,
            }}>
              ← Back
            </button>
          </div>
        </div>
        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 14,
          background: "rgba(255,255,255,0.5)", border: "1px solid rgba(124,58,237,0.1)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6E5E8A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Challenge</div>
          <div style={{ ...cs, fontSize: 18, fontWeight: 700, color: "#4C1D95" }}>{row.questionTitle}</div>
        </div>
      </div>

      {/* ── How Brave You Sounded — no numeric % ── */}
      <div className="print-section print-section-keep">
        <LionMeter confidence={confidence} />
      </div>

      {/* ── How Did You Do? — 2×3 card grid, stars only, tap to expand ── */}
      <div className="print-section">
      <h2 style={{ ...cs, fontSize: 24, fontWeight: 800, color: "#4C1D95", marginBottom: 16 }}>How Did You Do? ⭐</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        {SKILL_CARDS.map((sc) => {
          const score = row[sc.key] as number | undefined;
          const fbObj = ar?.skills?.[sc.title as keyof typeof ar.skills];
          return (
            <SkillCard
              key={sc.title}
              icon={sc.icon}
              title={sc.title}
              friendly={sc.friendly}
              score={score ?? null}
              expanded={!!expanded[sc.title]}
              onToggle={() => setExpanded((p) => ({ ...p, [sc.title]: !p[sc.title] }))}
              feedback={fbObj?.feedback}
              parentTip={sc.parentTip}
            />
          );
        })}
      </div>
      </div>

      {/* ── WinSpeak Says — 2-3 short sentences + Read it to me ── */}
      {ar?.winSpeakAnalysis && (
        <div className="print-section print-section-keep" style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          borderRadius: 24, padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#7C3AED", textTransform: "uppercase", marginBottom: 12 }}>
            WINSPEAK SAYS ✨
          </div>
          <div style={{ ...cs, fontSize: 18, fontWeight: 700, color: "#4C1D95", lineHeight: 1.6 }}>{ar.winSpeakAnalysis}</div>
          <button
            onClick={readAloud}
            disabled={speaking || loadingSpeech}
            className="no-print"
            style={{
              marginTop: 16, borderRadius: 999, padding: "10px 20px",
              fontSize: 13, fontWeight: 800, cursor: speaking || loadingSpeech ? "default" : "pointer",
              background: "rgba(255,255,255,0.6)", border: "1.5px solid #C4B5FD", color: "#7C3AED",
              opacity: speaking || loadingSpeech ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {loadingSpeech ? <><Spinner size={14} /> Generating voice...</> : speaking ? "Playing…" : "Read it to me 🔊"}
          </button>
        </div>
      )}

      {/* ── What You Did Great 🌟 — max 2 strengths ── */}
      {strengths.length > 0 && (
        <div className="print-section" style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          borderRadius: 24, padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#7C3AED", textTransform: "uppercase", marginBottom: 16 }}>
            WHAT YOU DID GREAT 🌟
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {strengths.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, fontWeight: 600 }}>
                <span style={{
                  fontSize: 20, background: "#EDE9FE", borderRadius: "50%", width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  border: "1px solid #C4B5FD",
                }}>👏</span>
                <span style={{ paddingTop: 4, color: "#4C1D95" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Try This Next Time! 💡 — max 1 improvement tip ── */}
      {improvement && (
        <div className="print-page2-start print-section-keep" style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          borderRadius: 24, padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#7C3AED", textTransform: "uppercase", marginBottom: 12 }}>
            TRY THIS NEXT TIME! 💡
          </div>
          <div style={{ ...cs, fontSize: 18, fontWeight: 700, color: "#4C1D95", lineHeight: 1.5 }}>{improvement}</div>
        </div>
      )}

      {/* ── Let's Fix These! ✏️ — purple badge + What you got right above errors ── */}
      <div style={{
        background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
        borderRadius: 24, padding: 24, marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#7C3AED", textTransform: "uppercase" }}>
            LET'S FIX THESE! ✏️
          </div>
          <span style={{
            background: "#FCD34D", borderRadius: 999, padding: "4px 12px",
            fontSize: 12, fontWeight: 800, color: "#92400E",
          }}>
            {grammarIssues.length} to practise
          </span>
        </div>

        {/* What you got right 👍 — always shown above errors */}
        <div style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          borderRadius: 18, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", marginBottom: 6 }}>
            What you got right 👍
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4C1D95", lineHeight: 1.5 }}>
            {whatYouGotRight.length > 0
              ? whatYouGotRight.join(" ")
              : "You spoke up and finished your turn — that's brilliant!"}
          </div>
        </div>

        {grammarIssues.length === 0 ? (
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6E5E8A" }}>
            Nothing to fix today — wonderful work! 🎉
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {grammarIssues.map((g, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.6)", borderRadius: 14, padding: 12,
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#6E5E8A", textDecoration: "line-through" }}>{g.wrong}</span>
                <span style={{ fontSize: 13, color: "#A78BFA" }}>→</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#4C1D95" }}>{g.correct}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1.5px dashed #C4B5FD" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", marginBottom: 12 }}>Pause Words 🤔</div>
          {fillerWords.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {fillerWords.map((f, i) => (
                <span key={i} style={{
                  background: "#EDE9FE", borderRadius: 999, padding: "6px 12px",
                  fontSize: 13, fontWeight: 700, color: "#4C1D95",
                }}>
                  {f.word} <span style={{ opacity: 0.5, marginLeft: 4 }}>×{f.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 700, color: "#6E5E8A" }}>
              No pause words detected — great speaking! 🎉
            </div>
          )}
        </div>
      </div>

      {/* ── A Better Way to Say It 💡 — ideal response + audio + Spot the Difference ── */}
      {idealResponse && (
        <div style={{
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1.5px solid rgba(124,58,237,0.18)", boxShadow: "0 4px 20px rgba(124,58,237,0.08)",
          borderRadius: 24, padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ ...cs, fontSize: 22, fontWeight: 800, color: "#4C1D95" }}>A Better Way to Say It 💡</div>
            <button
              onClick={playingIdeal ? () => { stopAudioPlayback(); setPlayingIdeal(false); } : readIdealAloud}
              disabled={loadingIdeal}
              className="no-print"
              style={{
                minWidth: loadingIdeal ? 140 : 40, height: 40,
                borderRadius: loadingIdeal ? 999 : "50%",
                padding: loadingIdeal ? "0 16px" : 0,
                background: loadingIdeal ? "#EDE9FE" : playingIdeal ? "#7C3AED" : "#fff",
                border: "2px solid #C4B5FD", cursor: loadingIdeal ? "default" : "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: playingIdeal ? "0 0 0 4px rgba(124,58,237,0.15)" : "none",
                transition: "all 0.2s ease",
                fontSize: 12, fontWeight: 700, color: "#7C3AED",
              }}
            >
              {loadingIdeal ? (
                <><Spinner size={14} /> Generating...</>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={playingIdeal ? "#fff" : "#7C3AED"} strokeWidth="2" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={playingIdeal ? "#fff" : "#7C3AED"} />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6E5E8A", marginBottom: 16 }}>
            Here's one way this speech could sound — use it to practise together!
          </div>
          <div style={{
            ...cs, fontSize: 17, fontWeight: 700, lineHeight: 1.6,
            background: "rgba(255,255,255,0.5)", padding: 16, borderRadius: 16,
            border: "1px solid #C4B5FD", color: "#4C1D95",
          }}>
            {idealResponse}
          </div>

          {/* Spot the Difference — hidden in print */}
          <div className="no-print" style={{
            marginTop: 16, background: "rgba(124,58,237,0.06)",
            borderLeft: "3px solid #7C3AED",
            borderRadius: 12, padding: "14px 18px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Spot the Difference
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#4C1D95", lineHeight: 1.6 }}>
              Can you find <span style={{ fontWeight: 800, color: "#7C3AED" }}>2 things</span> that changed from your speech? Ask your teacher!
            </div>
          </div>
        </div>
      )}

      <div className="print-only print-footer">
        Generated by Winnify Jr &middot; AI Speaking Coach for Students &middot; {reportDate}
      </div>
    </div>
  );
}
