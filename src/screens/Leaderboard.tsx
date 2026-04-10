import { useStore } from "@/context/UserStoreContext";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import Spinner from "@/components/Spinner";

interface Leader {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  totalAttempts: number;
  badge: string | null;
  isMe?: boolean;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#7C5CFC,#C084FC)",
  "linear-gradient(135deg,#22D37A,#0EA5E9)",
  "linear-gradient(135deg,#FFB830,#FF8C00)",
  "linear-gradient(135deg,#FF4D6A,#C084FC)",
  "linear-gradient(135deg,#0EA5E9,#7C5CFC)",
  "linear-gradient(135deg,#22D37A,#FFB830)",
  "linear-gradient(135deg,#C084FC,#FF4D6A)",
  "linear-gradient(135deg,#FFB830,#7C5CFC)",
  "linear-gradient(135deg,#FF4D6A,#22D37A)",
];

export default function Leaderboard() {
  const store = useStore();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard(20)
      .then((rows) => {
        const mapped: Leader[] = rows.map((r: any) => ({
          rank: r.rank,
          name: r.name,
          xp: r.totalXp ?? r.total_xp,
          streak: r.streak,
          totalAttempts: r.totalAttempts ?? r.total_attempts ?? 0,
          badge:
            r.rank === 1 ? "\u{1F947}" : r.rank === 2 ? "\u{1F948}" : r.rank === 3 ? "\u{1F949}" : null,
          isMe: r.name === store.name,
        }));
        setLeaders(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [store.name]);

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  const isUser = (l: Leader) => l.isMe === true;

  if (loading) {
    return (
      <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 40px" }}>
      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] font-semibold tracking-[1.5px]" style={{ color: "var(--muted)" }}>
          GLOBAL RANKING
        </div>
        <div className="text-[22px] font-extrabold">Leaderboard</div>
        <div className="text-[13px] mt-1" style={{ color: "var(--muted-soft)" }}>
          Top speakers by total XP
        </div>
      </div>

      {/* Top 3 podium */}
      {topThree.length >= 3 && (
        <div className="flex items-end justify-center gap-2 sm:gap-3 mb-8">
          {/* 2nd place */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-[18px] font-extrabold border-2"
              style={{
                background: AVATAR_COLORS[1],
                borderColor: "#C0C0C066",
                color: "#fff",
              }}
            >
              {isUser(topThree[1]) ? "\u{1F464}" : initials(topThree[1].name)}
            </div>
            <div className="text-[18px]">{"\u{1F948}"}</div>
            <div className="text-[11px] font-bold text-center" style={{ color: "var(--text)" }}>
              {topThree[1].name}{isUser(topThree[1]) ? " (You)" : ""}
            </div>
            <div
              className="rounded-t-[12px] w-full flex flex-col items-center justify-center py-3 text-[12px] font-bold"
              style={{ background: "var(--card)", borderColor: "var(--border)", minHeight: 64 }}
            >
              <div>{"\u26A1"} {topThree[1].xp.toLocaleString()}</div>
              <div className="text-[9px] font-medium" style={{ color: "var(--muted)" }}>{topThree[1].totalAttempts} attempts</div>
            </div>
          </div>

          {/* 1st place */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="text-[22px] mb-1"
              style={{ filter: "drop-shadow(0 0 8px #FFB83088)" }}
            >
              {"\u{1F451}"}
            </div>
            <div
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-[20px] font-extrabold border-2"
              style={{
                background: AVATAR_COLORS[0],
                borderColor: "#FFD70066",
                boxShadow: "0 0 20px #FFB83044",
                color: "#fff",
              }}
            >
              {isUser(topThree[0]) ? "\u{1F464}" : initials(topThree[0].name)}
            </div>
            <div className="text-[20px]">{"\u{1F947}"}</div>
            <div className="text-[12px] font-extrabold text-center" style={{ color: "var(--text)" }}>
              {topThree[0].name}{isUser(topThree[0]) ? " (You)" : ""}
            </div>
            <div
              className="rounded-t-[12px] w-full flex flex-col items-center justify-center py-4 text-[13px] font-bold"
              style={{
                background: "linear-gradient(135deg,#FFB83022,#1A1D2E)",
                borderTop: "2px solid #FFB83044",
                minHeight: 80,
                color: "#FFB830",
              }}
            >
              <div>{"\u26A1"} {topThree[0].xp.toLocaleString()}</div>
              <div className="text-[9px] font-medium" style={{ color: "var(--muted)" }}>{topThree[0].totalAttempts} attempts</div>
            </div>
          </div>

          {/* 3rd place */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-[18px] font-extrabold border-2"
              style={{
                background: AVATAR_COLORS[2],
                borderColor: "#CD7F3266",
                color: "#fff",
              }}
            >
              {isUser(topThree[2]) ? "\u{1F464}" : initials(topThree[2].name)}
            </div>
            <div className="text-[18px]">{"\u{1F949}"}</div>
            <div className="text-[11px] font-bold text-center" style={{ color: "var(--text)" }}>
              {topThree[2].name}{isUser(topThree[2]) ? " (You)" : ""}
            </div>
            <div
              className="rounded-t-[12px] w-full flex flex-col items-center justify-center py-2 text-[12px] font-bold"
              style={{ background: "var(--card)", minHeight: 48 }}
            >
              <div>{"\u26A1"} {topThree[2].xp.toLocaleString()}</div>
              <div className="text-[9px] font-medium" style={{ color: "var(--muted)" }}>{topThree[2].totalAttempts} attempts</div>
            </div>
          </div>
        </div>
      )}

      {/* Remaining leaderboard */}
      <div className="flex flex-col gap-2">
        {rest.map((leader) => {
          const isMe = isUser(leader);
          const avatarColor = AVATAR_COLORS[(leader.rank - 1) % AVATAR_COLORS.length];
          return (
            <div
              key={leader.rank}
              className="border rounded-[16px] p-3.5 flex items-center gap-3"
              style={{
                background: isMe
                  ? "linear-gradient(135deg,#7C5CFC11,#1A1D2E)"
                  : "var(--card)",
                borderColor: isMe ? "#7C5CFC44" : "var(--border)",
              }}
            >
              {/* Rank */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold flex-shrink-0"
                style={{
                  background: "var(--surface)",
                  color: "var(--muted)",
                }}
              >
                {leader.rank}
              </div>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold flex-shrink-0"
                style={{ background: avatarColor, color: "#fff" }}
              >
                {isMe ? "\u{1F464}" : initials(leader.name)}
              </div>

              {/* Name + streak */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-bold truncate"
                  style={{ color: isMe ? "var(--accent)" : "var(--text)" }}
                >
                  {leader.name}{isMe ? " (You)" : ""}
                </div>
                {leader.streak > 0 && (
                  <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                    {"\u{1F525}"} {leader.streak} day streak
                  </div>
                )}
              </div>

              {/* XP + Attempts */}
              <div className="flex flex-col items-end flex-shrink-0">
                <div
                  className="text-[13px] font-extrabold"
                  style={{ color: isMe ? "var(--accent)" : "#FFB830" }}
                >
                  {"\u26A1"} {leader.xp.toLocaleString()}
                </div>
                <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                  {leader.totalAttempts} {leader.totalAttempts === 1 ? "attempt" : "attempts"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No rankings */}
      {leaders.length === 0 && (
        <div
          className="border rounded-[16px] p-4 mt-4 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-[24px] mb-2">{"\u{1F680}"}</div>
          <div className="text-[13px] font-bold mb-1">No rankings yet</div>
          <div className="text-[12px]" style={{ color: "var(--muted)" }}>
            Complete a challenge to join the leaderboard!
          </div>
        </div>
      )}
    </div>
  );
}
