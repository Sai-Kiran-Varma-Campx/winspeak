import { Hono } from "hono";
import { desc, gt, eq, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, attempts } from "../db/schema.js";

const app = new Hono();

// GET /api/leaderboard
app.get("/", async (c) => {

  const rows = await db
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
    .orderBy(desc(users.totalXp));

  const ranked = rows.map((u, i) => ({ ...u, rank: i + 1 }));

  return c.json(ranked);
});

export default app;
