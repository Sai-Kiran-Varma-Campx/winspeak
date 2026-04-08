import { Hono } from "hono";
import { desc, gt, eq, count, sum, countDistinct } from "drizzle-orm";
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
      })
      .from(users)
      .leftJoin(attempts, eq(users.id, attempts.userId)),
  ]);

  const ranked = rows.map((u, i) => ({ ...u, rank: i + 1 }));
  const s = statsRows[0];

  return c.json({
    stats: {
      totalRegistered: Number(s.totalRegistered),
      totalWithAttempts: Number(s.totalWithAttempts),
      totalAttempts: Number(s.totalAttempts),
      totalXp: Number(s.totalXp) || 0,
    },
    leaderboard: ranked,
  });
});

export default app;
