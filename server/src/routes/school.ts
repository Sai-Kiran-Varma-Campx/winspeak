import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { students, studentAttempts, schoolQuestions, type User } from "../db/schema.js";
import { resolveUser } from "../middleware/auth.js";

const app = new Hono<{ Variables: { user: User } }>();

// All routes require auth — teacher's user account
app.use("/*", resolveUser);

// ── Students CRUD ──────────────────────────────────────────────────────────

// GET /api/school/students — class roster for the logged-in teacher
app.get("/students", async (c) => {
  const teacher = c.get("user");
  const grade = c.req.query("grade");

  const conditions = [eq(students.teacherId, teacher.id)];
  if (grade) conditions.push(eq(students.grade, parseInt(grade)));

  const rows = await db
    .select()
    .from(students)
    .where(and(...conditions))
    .orderBy(desc(students.createdAt));

  // Compute "last challenge date" per student
  const ids = rows.map((s) => s.id);
  const lastDates: Record<string, string | null> = {};
  if (ids.length > 0) {
    const recent = await db
      .select()
      .from(studentAttempts)
      .where(eq(studentAttempts.teacherId, teacher.id))
      .orderBy(desc(studentAttempts.createdAt));
    for (const a of recent) {
      if (!lastDates[a.studentId]) {
        lastDates[a.studentId] = a.createdAt as unknown as string;
      }
    }
  }

  return c.json(
    rows.map((s) => ({
      ...s,
      lastChallengeDate: lastDates[s.id] ?? null,
    }))
  );
});

const createStudentSchema = z.object({
  fullName: z.string().min(1).max(120),
  studentExternalId: z.string().max(60).optional().nullable(),
  grade: z.number().int().min(1).max(10),
  section: z.string().max(40).optional().nullable(),
  parentEmail: z.string().email().max(200).optional().nullable(),
});

app.post("/students", async (c) => {
  const teacher = c.get("user");
  const body = createStudentSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  const [created] = await db
    .insert(students)
    .values({
      teacherId: teacher.id,
      fullName: body.data.fullName.trim(),
      studentExternalId: body.data.studentExternalId ?? null,
      grade: body.data.grade,
      section: body.data.section ?? null,
      parentEmail: body.data.parentEmail ?? null,
    })
    .returning();

  return c.json(created, 201);
});

app.delete("/students/:id", async (c) => {
  const teacher = c.get("user");
  const id = c.req.param("id");

  await db
    .delete(students)
    .where(and(eq(students.id, id), eq(students.teacherId, teacher.id)));

  return c.json({ ok: true });
});

// ── School questions ──────────────────────────────────────────────────────

// GET /api/school/questions?categoryId=circletime
app.get("/questions", async (c) => {
  const categoryId = c.req.query("categoryId");

  if (!categoryId) {
    const rows = await db
      .select()
      .from(schoolQuestions)
      .orderBy(schoolQuestions.categoryId, schoolQuestions.questionNumber);
    return c.json(rows);
  }

  const rows = await db
    .select()
    .from(schoolQuestions)
    .where(eq(schoolQuestions.categoryId, categoryId))
    .orderBy(schoolQuestions.questionNumber);

  return c.json(rows);
});

// ── Student attempts (school-mode reports) ────────────────────────────────

const createAttemptSchema = z.object({
  studentId: z.string().uuid(),
  categoryId: z.string().min(1),
  questionId: z.string().min(1),
  questionTitle: z.string().min(1),
  grade: z.number().int().min(1).max(10),
  score: z.number().int(),
  skills: z.record(z.string(), z.number()).optional(),
  confidenceScore: z.number().int().optional(),
  analysisResult: z.any().optional(),
});

app.post("/attempts", async (c) => {
  const teacher = c.get("user");
  const body = createAttemptSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Verify student belongs to this teacher
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, body.data.studentId), eq(students.teacherId, teacher.id)))
    .limit(1);
  if (!student) return c.json({ error: "Student not found" }, 404);

  const skills = body.data.skills ?? {};
  const [created] = await db
    .insert(studentAttempts)
    .values({
      studentId: body.data.studentId,
      teacherId: teacher.id,
      categoryId: body.data.categoryId,
      questionId: body.data.questionId,
      questionTitle: body.data.questionTitle,
      grade: body.data.grade,
      score: body.data.score,
      skillFluency: skills.Fluency ?? null,
      skillGrammar: skills.Grammar ?? null,
      skillVocabulary: skills.Vocabulary ?? null,
      skillClarity: skills.Clarity ?? null,
      skillStructure: skills.Structure ?? null,
      skillRelevancy: skills.Relevancy ?? null,
      confidenceScore: body.data.confidenceScore ?? null,
      analysisResult: body.data.analysisResult ?? null,
    })
    .returning();

  return c.json(created, 201);
});

// GET /api/school/attempts?studentId=…  or  ?limit=…
app.get("/attempts", async (c) => {
  const teacher = c.get("user");
  const studentId = c.req.query("studentId");
  const limit = Math.min(parseInt(c.req.query("limit") || "100"), 200);

  const conditions = [eq(studentAttempts.teacherId, teacher.id)];
  if (studentId) conditions.push(eq(studentAttempts.studentId, studentId));

  const rows = await db
    .select()
    .from(studentAttempts)
    .where(and(...conditions))
    .orderBy(desc(studentAttempts.createdAt))
    .limit(limit);

  return c.json(rows);
});

// GET /api/school/attempts/:id
app.get("/attempts/:id", async (c) => {
  const teacher = c.get("user");
  const id = c.req.param("id");

  const [row] = await db
    .select()
    .from(studentAttempts)
    .where(and(eq(studentAttempts.id, id), eq(studentAttempts.teacherId, teacher.id)))
    .limit(1);

  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

export default app;
