import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, attempts, type User } from "../db/schema.js";
import { resolveUser } from "../middleware/auth.js";

const app = new Hono<{ Variables: { user: User } }>();

// All routes require auth
app.use("/*", resolveUser);

// GET /api/users/me/attempts?challengeId=c1&limit=50
app.get("/", async (c) => {
  const user = c.get("user");
  const challengeId = c.req.query("challengeId");
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);

  const conditions = [eq(attempts.userId, user.id)];
  if (challengeId) conditions.push(eq(attempts.challengeId, challengeId));

  const rows = await db
    .select()
    .from(attempts)
    .where(and(...conditions))
    .orderBy(desc(attempts.createdAt))
    .limit(limit);

  return c.json(rows);
});

// POST /api/users/me/attempts — save attempt + update XP & streak atomically
const createSchema = z.object({
  challengeId: z.string().min(1),
  challengeTitle: z.string().min(1),
  score: z.number().int(),
  xpEarned: z.number().int(),
  passed: z.boolean(),
  skills: z.record(z.string(), z.number()).optional(),
  analysisResult: z.any().optional(),
});

app.post("/", async (c) => {
  const user = c.get("user");
  const body = createSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const { challengeId, challengeTitle, score, xpEarned, passed, skills, analysisResult } = body.data;

  // Insert the attempt
  const [attempt] = await db
    .insert(attempts)
    .values({
      userId: user.id,
      challengeId,
      challengeTitle,
      score,
      xpEarned,
      passed,
      skillFluency: skills?.Fluency ?? null,
      skillGrammar: skills?.Grammar ?? null,
      skillVocabulary: skills?.Vocabulary ?? null,
      skillClarity: skills?.Clarity ?? null,
      skillStructure: skills?.Structure ?? null,
      skillRelevancy: skills?.Relevancy ?? null,
      analysisResult: analysisResult ?? null,
    })
    .returning();

  // Update user XP + streak atomically
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];

  // Compute new streak
  let newStreak: number;
  if (user.lastActivityDate === today) {
    newStreak = user.streak;
  } else if (user.lastActivityDate === yStr) {
    newStreak = user.streak + 1;
  } else {
    newStreak = 1;
  }

  await db
    .update(users)
    .set({
      totalXp: user.totalXp + xpEarned,
      streak: newStreak,
      lastActivityDate: today,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return c.json(attempt, 201);
});

// DELETE /api/users/me/attempts?challengeId=c1 — reset challenge attempts
app.delete("/", async (c) => {
  const user = c.get("user");
  const challengeId = c.req.query("challengeId");
  if (!challengeId) return c.json({ error: "challengeId query param required" }, 400);

  // Get XP to subtract
  const toDelete = await db
    .select({ xpEarned: attempts.xpEarned })
    .from(attempts)
    .where(and(eq(attempts.userId, user.id), eq(attempts.challengeId, challengeId)));

  const xpToSubtract = toDelete.reduce((sum, a) => sum + a.xpEarned, 0);

  // Delete attempts
  await db
    .delete(attempts)
    .where(and(eq(attempts.userId, user.id), eq(attempts.challengeId, challengeId)));

  // Update user XP
  await db
    .update(users)
    .set({
      totalXp: Math.max(0, user.totalXp - xpToSubtract),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return c.json({ ok: true });
});

export default app;
