import { Hono } from "hono";
import { desc, gt, eq, count, sum, countDistinct, avg, max, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, attempts } from "../db/schema.js";

const app = new Hono();

// GET /api/leaderboard
app.get("/", async (c) => {
  const [rows, statsRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        totalXp: users.totalXp,
        streak: users.streak,
        totalAttempts: count(attempts.id),
      })
      .from(users)
      .leftJoin(attempts, eq(users.id, attempts.userId))
      .where(gt(users.totalXp, 0))
      .groupBy(users.id, users.name, users.totalXp, users.streak)
      .orderBy(desc(users.totalXp)),
    db
      .select({
        totalRegistered: count(users.id),
        totalWithAttempts: countDistinct(attempts.userId),
        totalAttempts: count(attempts.id),
        totalXp: sum(users.totalXp),
        avgScore: avg(attempts.score),
        totalPassed: sum(sql<number>`case when ${attempts.passed} then 1 else 0 end`),
        bestStreak: max(users.streak),
      })
      .from(users)
      .leftJoin(attempts, eq(users.id, attempts.userId)),
  ]);

  const ranked = rows.map((u, i) => ({ ...u, rank: i + 1 }));
  const s = statsRows[0];
  const totalAttempts = Number(s.totalAttempts);
  const totalPassed = Number(s.totalPassed) || 0;

  return c.json({
    stats: {
      totalRegistered: Number(s.totalRegistered),
      totalWithAttempts: Number(s.totalWithAttempts),
      totalAttempts,
      totalXp: Number(s.totalXp) || 0,
      avgScore: Math.round(Number(s.avgScore) || 0),
      passRate: totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0,
      bestStreak: Number(s.bestStreak) || 0,
    },
    leaderboard: ranked,
  });
});

export default app;
