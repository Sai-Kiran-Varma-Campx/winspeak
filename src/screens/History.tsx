import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/context/UserStoreContext";
import { relativeDate } from "@/hooks/useUserStore";

function scoreColor(score: number) {
  if (score >= 80) return "#22D37A";
  if (score >= 60) return "#FFB830";
  return "#FF4D6A";
}

export default function History() {
  const navigate = useNavigate();
  const store = useStore();
  const attempts = store.attempts; // already newest-first

  return (
    <div className="p-4 sm:p-5 pb-8 sm:pb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[11px] font-semibold tracking-[1px]" style={{ color: "var(--muted)" }}>
            YOUR PROGRESS
          </div>
          <div className="text-[20px] font-extrabold">Analysis History</div>
        </div>
        <div
          className="border rounded-[10px] px-3 py-1.5 text-[12px] font-bold"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
        >
          {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[48px] mb-4">🎯</div>
          <div className="text-[18px] font-extrabold mb-2">No attempts yet</div>
          <div className="text-[13px] mb-6" style={{ color: "var(--muted)" }}>
            Complete a challenge to see your analysis history here.
          </div>
          <Button onClick={() => navigate("/audiocheck")}>Start a Challenge</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {attempts.map((a) => {
            const sc = scoreColor(a.score);
            const hasDetail = !!a.analysisResult;
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/report/${a.id}`)}
                className="border rounded-[16px] p-4 flex items-center gap-3.5 w-full text-left cursor-pointer transition-all"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#7C5CFC44";
                  (e.currentTarget as HTMLButtonElement).style.background = "#7C5CFC08";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--card)";
                }}
              >
                {/* Score badge */}
                <div
                  className="w-12 h-12 rounded-[12px] flex items-center justify-center text-[17px] font-extrabold flex-shrink-0"
                  style={{ background: `${sc}22`, color: sc }}
                >
                  {a.score}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">{a.challengeTitle}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                      {relativeDate(a.date)}
                    </span>
                    {!hasDetail && (
                      <span
                        className="border rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--muted)" }}
                      >
                        Summary only
                      </span>
                    )}
                  </div>
                </div>

                {/* XP badge */}
                <div
                  className="border rounded-[8px] px-2 py-0.5 text-[11px] font-bold flex-shrink-0"
                  style={{ background: "#FFB83022", borderColor: "#FFB83044", color: "#FFB830" }}
                >
                  +{a.xpEarned} XP
                </div>

                {/* Chevron */}
                <svg
                  width="16"
                  height="16"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
