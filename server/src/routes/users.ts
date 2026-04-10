import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import { db } from "../db/index.js";
import { users, attempts, type User } from "../db/schema.js";
import { resolveUser } from "../middleware/auth.js";
import { computeLevel } from "../lib/xp.js";

const app = new Hono<{ Variables: { user: User } }>();

// --- Password hashing with PBKDF2 (Web Crypto, zero deps) ---

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const hash = new Uint8Array(bits);
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const computed = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === hashHex;
}

// --- JWT helper ---

async function createToken(userId: string): Promise<string> {
  const secret = process.env.JWT_SECRET!;
  return sign(
    { sub: userId, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 },
    secret
  );
}

// --- Routes ---

const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(100).optional(),
  grades: z.array(z.number().int().min(1).max(4)).max(4).optional(),
});

app.post("/signup", async (c) => {
  const body = signupSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const { username, password, name, grades } = body.data;

  // Check if username taken
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing) return c.json({ error: "Username already taken" }, 409);

  // Dedupe + sort grades for consistent storage
  const normalizedGrades = grades ? [...new Set(grades)].sort((a, b) => a - b) : [];

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({
      username,
      passwordHash,
      name: (name ?? username).trim(),
      hasOnboarded: true,
      grades: normalizedGrades,
    })
    .returning();

  const token = await createToken(created.id);
  return c.json({ token, user: { id: created.id, name: created.name, grades: created.grades } }, 201);
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

app.post("/login", async (c) => {
  const body = loginSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const { username, password } = body.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!user) return c.json({ error: "Invalid username or password" }, 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return c.json({ error: "Invalid username or password" }, 401);

  const token = await createToken(user.id);
  return c.json({ token, user: { id: user.id, name: user.name } });
});

// POST /api/users/reset-password — reset password by username
const resetSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6).max(128),
});

app.post("/reset-password", async (c) => {
  const body = resetSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const { username, password } = body.data;

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (!user) return c.json({ error: "Username not found" }, 404);

  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return c.json({ ok: true });
});

// GET /api/users/me — get profile + computed fields
app.get("/me", resolveUser, async (c) => {
  const user = c.get("user");
  const { level, xpInLevel, xpToNext, xpProgress } = computeLevel(user.totalXp);

  // Get completed challenge IDs (distinct challenges where user passed)
  const allAttempts = await db
    .select()
    .from(attempts)
    .where(eq(attempts.userId, user.id));

  const completedChallengeIds = [
    ...new Set(
      allAttempts.filter((a) => a.passed).map((a) => a.challengeId)
    ),
  ];

  const { passwordHash: _, ...safeUser } = user;
  return c.json({
    ...safeUser,
    level,
    xpInLevel,
    xpToNext,
    xpProgress,
    completedChallengeIds,
  });
});

// PATCH /api/users/me — update user name
const updateSchema = z.object({
  name: z.string().min(1).max(100),
});

app.patch("/me", resolveUser, async (c) => {
  const user = c.get("user");
  const body = updateSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [updated] = await db
    .update(users)
    .set({ name: body.data.name.trim(), updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .returning();
  const { passwordHash: _pw, ...safeUpdated } = updated;
  return c.json(safeUpdated);
});

export default app;
