import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, count } from "drizzle-orm";
import { sign } from "hono/jwt";
import { db } from "../db/index.js";
import {
  admins,
  schools,
  users,
  students,
  studentAttempts,
  schoolQuestions,
  type Admin,
} from "../db/schema.js";
import { resolveAdmin } from "../middleware/adminAuth.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

const app = new Hono<{ Variables: { admin: Admin } }>();

// ── Auth (no middleware) ──────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

app.post("/login", async (c) => {
  const body = loginSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, body.data.username))
    .limit(1);
  if (!admin) return c.json({ error: "Invalid credentials" }, 401);

  const valid = await verifyPassword(body.data.password, admin.passwordHash);
  if (!valid) return c.json({ error: "Invalid credentials" }, 401);

  const secret = process.env.JWT_SECRET!;
  const token = await sign(
    { sub: admin.id, role: "admin", exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 },
    secret
  );

  return c.json({
    token,
    admin: { id: admin.id, name: admin.name, username: admin.username },
  });
});

// ── All routes below require admin auth ───────────────────────────────────
app.use("/*", resolveAdmin);

app.get("/me", (c) => {
  const admin = c.get("admin");
  return c.json({ id: admin.id, name: admin.name, username: admin.username });
});

// ── Schools CRUD ──────────────────────────────────────────────────────────

const createSchoolSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(30).regex(/^[A-Za-z0-9_-]+$/),
  address: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable(),
});

app.get("/schools", async (c) => {
  const rows = await db.select().from(schools).orderBy(desc(schools.createdAt));

  const teacherCounts = await db
    .select({ schoolId: users.schoolId, count: count() })
    .from(users)
    .where(eq(users.role, "teacher"))
    .groupBy(users.schoolId);

  const studentCounts = await db
    .select({ schoolId: students.schoolId, count: count() })
    .from(students)
    .groupBy(students.schoolId);

  const tMap: Record<string, number> = {};
  for (const r of teacherCounts) if (r.schoolId) tMap[r.schoolId] = r.count;
  const sMap: Record<string, number> = {};
  for (const r of studentCounts) if (r.schoolId) sMap[r.schoolId] = r.count;

  return c.json(rows.map((s) => ({ ...s, teacherCount: tMap[s.id] ?? 0, studentCount: sMap[s.id] ?? 0 })));
});

app.post("/schools", async (c) => {
  const body = createSchoolSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [existing] = await db.select({ id: schools.id }).from(schools).where(eq(schools.code, body.data.code)).limit(1);
  if (existing) return c.json({ error: "School code already taken" }, 409);

  const [created] = await db.insert(schools).values({
    name: body.data.name.trim(),
    code: body.data.code.trim().toUpperCase(),
    address: body.data.address ?? null,
    contactEmail: body.data.contactEmail ?? null,
  }).returning();

  return c.json(created, 201);
});

const updateSchoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().max(500).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable(),
  isActive: z.boolean().optional(),
});

app.patch("/schools/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateSchoolSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const updates: Record<string, any> = {};
  if (body.data.name !== undefined) updates.name = body.data.name.trim();
  if (body.data.address !== undefined) updates.address = body.data.address;
  if (body.data.contactEmail !== undefined) updates.contactEmail = body.data.contactEmail;
  if (body.data.isActive !== undefined) updates.isActive = body.data.isActive;

  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(schools).set(updates).where(eq(schools.id, id)).returning();
  if (!updated) return c.json({ error: "School not found" }, 404);
  return c.json(updated);
});

app.delete("/schools/:id", async (c) => {
  const id = c.req.param("id");
  const [updated] = await db.update(schools).set({ isActive: false }).where(eq(schools.id, id)).returning();
  if (!updated) return c.json({ error: "School not found" }, 404);
  return c.json({ ok: true });
});

// ── Teachers for a school ─────────────────────────────────────────────────

app.get("/schools/:id/teachers", async (c) => {
  const schoolId = c.req.param("id");

  const rows = await db
    .select({ id: users.id, username: users.username, name: users.name, grades: users.grades, createdAt: users.createdAt })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")))
    .orderBy(desc(users.createdAt));

  const studentCounts = await db
    .select({ teacherId: students.teacherId, count: count() })
    .from(students)
    .where(eq(students.schoolId, schoolId))
    .groupBy(students.teacherId);

  const scMap: Record<string, number> = {};
  for (const r of studentCounts) scMap[r.teacherId] = r.count;

  return c.json(rows.map((t) => ({ ...t, studentCount: scMap[t.id] ?? 0 })));
});

const createTeacherSchema = z.object({
  name: z.string().min(1).max(120),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(128),
  grades: z.array(z.number().int().min(1).max(10)).max(10).optional(),
});

app.post("/schools/:id/teachers", async (c) => {
  const schoolId = c.req.param("id");

  const [school] = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).limit(1);
  if (!school) return c.json({ error: "School not found" }, 404);

  const body = createTeacherSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, body.data.username)).limit(1);
  if (existing) return c.json({ error: "Username already taken" }, 409);

  const passwordHash = await hashPassword(body.data.password);
  const normalizedGrades = body.data.grades ? [...new Set(body.data.grades)].sort((a, b) => a - b) : [];

  const [created] = await db.insert(users).values({
    username: body.data.username,
    passwordHash,
    name: body.data.name.trim(),
    hasOnboarded: true,
    grades: normalizedGrades,
    schoolId,
    role: "teacher",
  }).returning();

  const { passwordHash: _, ...safe } = created;
  return c.json(safe, 201);
});

// ── Bulk import teachers ──────────────────────────────────────────────────

function generateUsername(firstName: string): string {
  const base = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const digits = String(Math.floor(Math.random() * 900) + 100);
  return (base || "teacher") + digits;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

const bulkImportSchema = z.object({
  teachers: z.array(z.object({
    name: z.string().min(1).max(120),
    grades: z.string().optional(),
  })).min(1).max(200),
});

app.post("/schools/:id/teachers/bulk", async (c) => {
  const schoolId = c.req.param("id");

  const [school] = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).limit(1);
  if (!school) return c.json({ error: "School not found" }, 404);

  const body = bulkImportSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const existingUsers = await db.select({ username: users.username }).from(users);
  const usedUsernames = new Set(existingUsers.map((u) => u.username));

  const results: { name: string; username: string; password: string }[] = [];

  for (const teacher of body.data.teachers) {
    const firstName = teacher.name.trim().split(/\s+/)[0];
    let username = generateUsername(firstName);
    let retries = 0;
    while (usedUsernames.has(username) && retries < 10) {
      username = generateUsername(firstName);
      retries++;
    }
    if (usedUsernames.has(username)) username = generateUsername(firstName + Date.now());
    usedUsernames.add(username);

    const password = generatePassword();
    const passwordHash = await hashPassword(password);

    const grades = teacher.grades
      ? [...new Set(teacher.grades.split(",").map((g) => parseInt(g.trim())).filter((g) => g >= 1 && g <= 10))].sort((a, b) => a - b)
      : [];

    await db.insert(users).values({
      username, passwordHash, name: teacher.name.trim(),
      hasOnboarded: true, grades, schoolId, role: "teacher",
    });

    results.push({ name: teacher.name.trim(), username, password });
  }

  return c.json({ created: results.length, teachers: results }, 201);
});

app.delete("/teachers/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(users).where(and(eq(users.id, id), eq(users.role, "teacher")));
  return c.json({ ok: true });
});

// ── Dashboard stats ───────────────────────────────────────────────────────

app.get("/stats", async (c) => {
  const [schoolCount] = await db.select({ count: count() }).from(schools).where(eq(schools.isActive, true));
  const [teacherCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "teacher"));
  const [studentCount] = await db.select({ count: count() }).from(students);
  const [attemptCount] = await db.select({ count: count() }).from(studentAttempts);

  const recentTeachers = await db
    .select({ id: users.id, name: users.name, username: users.username, createdAt: users.createdAt, schoolId: users.schoolId })
    .from(users)
    .where(eq(users.role, "teacher"))
    .orderBy(desc(users.createdAt))
    .limit(10);

  const recentSchools = await db.select().from(schools).orderBy(desc(schools.createdAt)).limit(5);

  return c.json({ schools: schoolCount.count, teachers: teacherCount.count, students: studentCount.count, attempts: attemptCount.count, recentTeachers, recentSchools });
});

app.get("/schools/:id/stats", async (c) => {
  const schoolId = c.req.param("id");
  const [teacherCount] = await db.select({ count: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")));
  const [studentCount] = await db.select({ count: count() }).from(students).where(eq(students.schoolId, schoolId));
  const [attemptCount] = await db.select({ count: count() }).from(studentAttempts).where(eq(studentAttempts.schoolId, schoolId));
  return c.json({ teachers: teacherCount.count, students: studentCount.count, attempts: attemptCount.count });
});

// ── Questions management ──────────────────────────────────────────────────

app.get("/questions", async (c) => {
  const rows = await db.select().from(schoolQuestions).orderBy(schoolQuestions.categoryId, schoolQuestions.questionNumber);
  return c.json(rows);
});

const createQuestionSchema = z.object({
  id: z.string().min(1).max(60),
  categoryId: z.string().min(1).max(60),
  questionNumber: z.number().int().min(1),
  title: z.string().min(1).max(300),
  prompt: z.string().min(1).max(2000),
  scenario: z.string().min(1).max(2000),
  durationSecs: z.number().int().min(15).max(300).optional(),
  schoolId: z.string().uuid().optional().nullable(),
});

app.post("/questions", async (c) => {
  const body = createQuestionSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [created] = await db.insert(schoolQuestions).values({
    id: body.data.id, categoryId: body.data.categoryId, questionNumber: body.data.questionNumber,
    title: body.data.title.trim(), prompt: body.data.prompt.trim(), scenario: body.data.scenario.trim(),
    durationSecs: body.data.durationSecs ?? 60, schoolId: body.data.schoolId ?? null,
  }).returning();

  return c.json(created, 201);
});

const updateQuestionSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  prompt: z.string().min(1).max(2000).optional(),
  scenario: z.string().min(1).max(2000).optional(),
  durationSecs: z.number().int().min(15).max(300).optional(),
});

app.patch("/questions/:id", async (c) => {
  const id = c.req.param("id");
  const body = updateQuestionSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const updates: Record<string, any> = {};
  if (body.data.title !== undefined) updates.title = body.data.title.trim();
  if (body.data.prompt !== undefined) updates.prompt = body.data.prompt.trim();
  if (body.data.scenario !== undefined) updates.scenario = body.data.scenario.trim();
  if (body.data.durationSecs !== undefined) updates.durationSecs = body.data.durationSecs;

  if (Object.keys(updates).length === 0) return c.json({ error: "No fields to update" }, 400);

  const [updated] = await db.update(schoolQuestions).set(updates).where(eq(schoolQuestions.id, id)).returning();
  if (!updated) return c.json({ error: "Question not found" }, 404);
  return c.json(updated);
});

app.delete("/questions/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(schoolQuestions).where(eq(schoolQuestions.id, id));
  return c.json({ ok: true });
});

export default app;
