import { Hono } from "hono";
import { desc, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const app = new Hono();

// GET /api/leaderboard?limit=20
app.get("/", async (c) => {
  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      totalXp: users.totalXp,
      streak: users.streak,
    })
    .from(users)
    .where(gt(users.totalXp, 0))
    .orderBy(desc(users.totalXp))
    .limit(limit);

  const ranked = rows.map((u, i) => ({ ...u, rank: i + 1 }));

  return c.json(ranked);
});

export default app;
