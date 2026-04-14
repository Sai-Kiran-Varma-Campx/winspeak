# Winnify-JR Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-tenant admin panel to Winnify-JR for managing schools, onboarding teachers via CSV, viewing analytics, and managing questions.

**Architecture:** Same-app `/admin` route with separate `admins` table for auth. Shared Neon DB with additive-only schema changes (nullable `school_id` + `role` columns on existing tables). Admin JWT stored separately from teacher JWT.

**Tech Stack:** React + TypeScript + Vite (frontend), Hono + Drizzle + Neon Postgres (backend), Zod (validation), PBKDF2 (password hashing)

---

## File Structure

### New Files
```
server/src/routes/admin.ts          — All /api/admin/* routes (auth, schools, teachers, stats, questions)
server/src/middleware/adminAuth.ts   — resolveAdmin middleware
server/src/lib/password.ts          — Extracted password hash/verify (shared by admin + users routes)
scripts/seed-admin.ts               — Seed admin user into DB
src/lib/adminApi.ts                 — Admin API client (uses admin_token key)
src/context/AdminStoreContext.tsx    — Admin auth state + logout
src/screens/admin/AdminLogin.tsx    — Admin login page
src/screens/admin/AdminDashboard.tsx — Stats cards + recent activity
src/screens/admin/SchoolsList.tsx   — Schools table + create modal
src/screens/admin/SchoolDetail.tsx  — School detail with teachers + bulk import
src/screens/admin/QuestionsManager.tsx — Question CRUD grouped by category
src/components/admin/AdminLayout.tsx — Sidebar + content wrapper
src/components/admin/BulkImportModal.tsx — CSV upload + credentials download
```

### Modified Files
```
server/src/db/schema.ts             — Add schools, admins tables + school_id/role columns
server/src/app.ts                   — Mount admin routes
server/src/routes/users.ts          — Extract password functions to shared lib
src/App.tsx                         — Add /admin route tree
```

---

### Task 1: Update Drizzle Schema

**Files:**
- Modify: `server/src/db/schema.ts`

- [ ] **Step 1: Add `schools` and `admins` tables to schema**

Add these after the existing `schoolQuestions` table definition in `server/src/db/schema.ts`:

```typescript
// ── Multi-tenant: schools as tenants ──────────────────────────────────────
export const schools = pgTable(
  "schools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    address: text("address"),
    contactEmail: text("contact_email"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_schools_code").on(t.code)]
);

// ── Platform admins (CampX internal team) ─────────────────────────────────
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Add nullable `schoolId` and `role` columns to existing tables**

Add to the `users` table columns (before the closing `}` of the column object):
```typescript
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
role: text("role"),
```

Add to `users` index array:
```typescript
index("idx_users_school").on(t.schoolId),
```

Add to the `students` table columns:
```typescript
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
```

Add to `students` index array:
```typescript
index("idx_students_school").on(t.schoolId),
```

Add to the `studentAttempts` table columns:
```typescript
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
```

Add to `studentAttempts` index array:
```typescript
index("idx_student_attempts_school").on(t.schoolId),
```

Add to the `schoolQuestions` table columns:
```typescript
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
```

- [ ] **Step 3: Add type exports**

Add at the bottom of the file:
```typescript
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
```

- [ ] **Step 4: Push schema to database**

Run from the `server/` directory:
```bash
cd server && npx drizzle-kit push
```

Expected: Schema synced — new tables created, new columns added. Existing data untouched.

- [ ] **Step 5: Commit**

```bash
git add server/src/db/schema.ts
git commit -m "feat(db): add schools, admins tables and school_id columns for multi-tenancy"
```

---

### Task 2: Extract Password Utils + Admin Auth Middleware

**Files:**
- Create: `server/src/lib/password.ts`
- Create: `server/src/middleware/adminAuth.ts`
- Modify: `server/src/routes/users.ts`

- [ ] **Step 1: Create shared password utility**

Create `server/src/lib/password.ts`:

```typescript
export async function hashPassword(password: string): Promise<string> {
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

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
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
```

- [ ] **Step 2: Update users.ts to import from shared lib**

In `server/src/routes/users.ts`, replace the `hashPassword` and `verifyPassword` function definitions (lines 14-51) with:

```typescript
import { hashPassword, verifyPassword } from "../lib/password.js";
```

Remove the two inline function definitions entirely.

- [ ] **Step 3: Create admin auth middleware**

Create `server/src/middleware/adminAuth.ts`:

```typescript
import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { verify } from "hono/jwt";
import { db } from "../db/index.js";
import { admins, type Admin } from "../db/schema.js";

type Env = { Variables: { admin: Admin } };

export const resolveAdmin = createMiddleware<Env>(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) return c.json({ error: "Server misconfigured" }, 500);

  let payload: { sub?: string; role?: string };
  try {
    payload = (await verify(token, secret, "HS256")) as { sub?: string; role?: string };
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  if (!payload.sub || payload.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, payload.sub))
    .limit(1);
  if (!admin) return c.json({ error: "Admin not found" }, 401);

  c.set("admin", admin);
  await next();
});
```

- [ ] **Step 4: Verify existing teacher login still works**

Start the server and test teacher login hasn't broken:
```bash
cd server && npm run dev
```
Then in another terminal:
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```
Expected: Either valid login response or "Invalid username or password" (not a crash).

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/password.ts server/src/middleware/adminAuth.ts server/src/routes/users.ts
git commit -m "refactor: extract password utils, add admin auth middleware"
```

---

### Task 3: Admin API Routes — Auth + Schools CRUD

**Files:**
- Create: `server/src/routes/admin.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create admin routes file with auth + schools CRUD**

Create `server/src/routes/admin.ts`:

```typescript
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
  const rows = await db
    .select()
    .from(schools)
    .orderBy(desc(schools.createdAt));

  // Get teacher + student counts per school
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

  return c.json(
    rows.map((s) => ({
      ...s,
      teacherCount: tMap[s.id] ?? 0,
      studentCount: sMap[s.id] ?? 0,
    }))
  );
});

app.post("/schools", async (c) => {
  const body = createSchoolSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Check code uniqueness
  const [existing] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.code, body.data.code))
    .limit(1);
  if (existing) return c.json({ error: "School code already taken" }, 409);

  const [created] = await db
    .insert(schools)
    .values({
      name: body.data.name.trim(),
      code: body.data.code.trim().toUpperCase(),
      address: body.data.address ?? null,
      contactEmail: body.data.contactEmail ?? null,
    })
    .returning();

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

  const [updated] = await db
    .update(schools)
    .set(updates)
    .where(eq(schools.id, id))
    .returning();

  if (!updated) return c.json({ error: "School not found" }, 404);
  return c.json(updated);
});

app.delete("/schools/:id", async (c) => {
  const id = c.req.param("id");
  const [updated] = await db
    .update(schools)
    .set({ isActive: false })
    .where(eq(schools.id, id))
    .returning();

  if (!updated) return c.json({ error: "School not found" }, 404);
  return c.json({ ok: true });
});

// ── Teachers for a school ─────────────────────────────────────────────────

app.get("/schools/:id/teachers", async (c) => {
  const schoolId = c.req.param("id");

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      grades: users.grades,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")))
    .orderBy(desc(users.createdAt));

  // Student counts per teacher
  const studentCounts = await db
    .select({ teacherId: students.teacherId, count: count() })
    .from(students)
    .where(eq(students.schoolId, schoolId))
    .groupBy(students.teacherId);

  const scMap: Record<string, number> = {};
  for (const r of studentCounts) scMap[r.teacherId] = r.count;

  return c.json(
    rows.map((t) => ({ ...t, studentCount: scMap[t.id] ?? 0 }))
  );
});

const createTeacherSchema = z.object({
  name: z.string().min(1).max(120),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(128),
  grades: z.array(z.number().int().min(1).max(10)).max(10).optional(),
});

app.post("/schools/:id/teachers", async (c) => {
  const schoolId = c.req.param("id");

  // Verify school exists
  const [school] = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).limit(1);
  if (!school) return c.json({ error: "School not found" }, 404);

  const body = createTeacherSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Check username uniqueness
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, body.data.username))
    .limit(1);
  if (existing) return c.json({ error: "Username already taken" }, 409);

  const passwordHash = await hashPassword(body.data.password);
  const normalizedGrades = body.data.grades
    ? [...new Set(body.data.grades)].sort((a, b) => a - b)
    : [];

  const [created] = await db
    .insert(users)
    .values({
      username: body.data.username,
      passwordHash,
      name: body.data.name.trim(),
      hasOnboarded: true,
      grades: normalizedGrades,
      schoolId,
      role: "teacher",
    })
    .returning();

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
  teachers: z.array(
    z.object({
      name: z.string().min(1).max(120),
      grades: z.string().optional(),
    })
  ).min(1).max(200),
});

app.post("/schools/:id/teachers/bulk", async (c) => {
  const schoolId = c.req.param("id");

  const [school] = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, schoolId)).limit(1);
  if (!school) return c.json({ error: "School not found" }, 404);

  const body = bulkImportSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: body.error.flatten() }, 400);

  // Get all existing usernames for collision check
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
    if (usedUsernames.has(username)) {
      username = generateUsername(firstName + Date.now());
    }
    usedUsernames.add(username);

    const password = generatePassword();
    const passwordHash = await hashPassword(password);

    const grades = teacher.grades
      ? [...new Set(teacher.grades.split(",").map((g) => parseInt(g.trim())).filter((g) => g >= 1 && g <= 10))].sort((a, b) => a - b)
      : [];

    await db.insert(users).values({
      username,
      passwordHash,
      name: teacher.name.trim(),
      hasOnboarded: true,
      grades,
      schoolId,
      role: "teacher",
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

  // Recent teachers (last 10)
  const recentTeachers = await db
    .select({ id: users.id, name: users.name, username: users.username, createdAt: users.createdAt, schoolId: users.schoolId })
    .from(users)
    .where(eq(users.role, "teacher"))
    .orderBy(desc(users.createdAt))
    .limit(10);

  // Recent schools (last 5)
  const recentSchools = await db
    .select()
    .from(schools)
    .orderBy(desc(schools.createdAt))
    .limit(5);

  return c.json({
    schools: schoolCount.count,
    teachers: teacherCount.count,
    students: studentCount.count,
    attempts: attemptCount.count,
    recentTeachers,
    recentSchools,
  });
});

app.get("/schools/:id/stats", async (c) => {
  const schoolId = c.req.param("id");
  const [teacherCount] = await db.select({ count: count() }).from(users).where(and(eq(users.schoolId, schoolId), eq(users.role, "teacher")));
  const [studentCount] = await db.select({ count: count() }).from(students).where(eq(students.schoolId, schoolId));
  const [attemptCount] = await db.select({ count: count() }).from(studentAttempts).where(eq(studentAttempts.schoolId, schoolId));

  return c.json({
    teachers: teacherCount.count,
    students: studentCount.count,
    attempts: attemptCount.count,
  });
});

// ── Questions management ──────────────────────────────────────────────────

app.get("/questions", async (c) => {
  const rows = await db
    .select()
    .from(schoolQuestions)
    .orderBy(schoolQuestions.categoryId, schoolQuestions.questionNumber);
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

  const [created] = await db
    .insert(schoolQuestions)
    .values({
      id: body.data.id,
      categoryId: body.data.categoryId,
      questionNumber: body.data.questionNumber,
      title: body.data.title.trim(),
      prompt: body.data.prompt.trim(),
      scenario: body.data.scenario.trim(),
      durationSecs: body.data.durationSecs ?? 60,
      schoolId: body.data.schoolId ?? null,
    })
    .returning();

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

  const [updated] = await db
    .update(schoolQuestions)
    .set(updates)
    .where(eq(schoolQuestions.id, id))
    .returning();

  if (!updated) return c.json({ error: "Question not found" }, 404);
  return c.json(updated);
});

app.delete("/questions/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(schoolQuestions).where(eq(schoolQuestions.id, id));
  return c.json({ ok: true });
});

export default app;
```

- [ ] **Step 2: Mount admin routes in app.ts**

In `server/src/app.ts`, add the import at the top:
```typescript
import adminRoutes from "./routes/admin.js";
```

Add the route after the existing `app.route("/api/school", schoolRoutes);` line:
```typescript
app.route("/api/admin", adminRoutes);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin.ts server/src/app.ts
git commit -m "feat(api): add admin routes — auth, schools CRUD, teachers, stats, questions"
```

---

### Task 4: Admin Seed Script

**Files:**
- Create: `scripts/seed-admin.ts`

- [ ] **Step 1: Create seed script**

Create `scripts/seed-admin.ts`:

```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { admins } from "../server/src/db/schema.js";

// Re-implement hashPassword inline (scripts can't easily import .ts from server)
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  const hash = new Uint8Array(bits);
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = [...hash].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Super Admin";

  if (!password) {
    console.error("ADMIN_PASSWORD env var is required");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL env var is required");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const passwordHash = await hashPassword(password);

  // Upsert: update if exists, create if not
  const [existing] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.username, username))
    .limit(1);

  if (existing) {
    await db.update(admins).set({ passwordHash, name }).where(eq(admins.id, existing.id));
    console.log(`Updated admin "${username}"`);
  } else {
    await db.insert(admins).values({ username, passwordHash, name });
    console.log(`Created admin "${username}"`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed script**

```bash
cd server && ADMIN_USERNAME=admin ADMIN_PASSWORD=admin123 ADMIN_NAME="CampX Admin" npx tsx ../scripts/seed-admin.ts
```

Expected: `Created admin "admin"`

- [ ] **Step 3: Verify admin login works**

```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: JSON with `token` and `admin` object.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-admin.ts
git commit -m "feat: add admin seed script"
```

---

### Task 5: Admin API Client (Frontend)

**Files:**
- Create: `src/lib/adminApi.ts`

- [ ] **Step 1: Create admin API client**

Create `src/lib/adminApi.ts`:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const ADMIN_TOKEN_KEY = "winnify_admin_jwt";
const REQUEST_TIMEOUT_MS = 30_000;

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = getAdminToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") throw new Error(`Request timed out`);
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 || res.status === 403) {
    clearAdminToken();
    throw new Error("Admin session expired");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const adminApi = {
  // Auth
  login(username: string, password: string) {
    return request<{ token: string; admin: { id: string; name: string; username: string } }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },
  getMe() {
    return request<{ id: string; name: string; username: string }>("/admin/me");
  },

  // Schools
  listSchools() {
    return request<any[]>("/admin/schools");
  },
  createSchool(data: { name: string; code: string; address?: string; contactEmail?: string }) {
    return request<any>("/admin/schools", { method: "POST", body: JSON.stringify(data) });
  },
  updateSchool(id: string, data: { name?: string; address?: string; contactEmail?: string; isActive?: boolean }) {
    return request<any>(`/admin/schools/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteSchool(id: string) {
    return request<{ ok: boolean }>(`/admin/schools/${id}`, { method: "DELETE" });
  },

  // Teachers
  listTeachers(schoolId: string) {
    return request<any[]>(`/admin/schools/${schoolId}/teachers`);
  },
  createTeacher(schoolId: string, data: { name: string; username: string; password: string; grades?: number[] }) {
    return request<any>(`/admin/schools/${schoolId}/teachers`, { method: "POST", body: JSON.stringify(data) });
  },
  bulkImportTeachers(schoolId: string, teachers: { name: string; grades?: string }[]) {
    return request<{ created: number; teachers: { name: string; username: string; password: string }[] }>(
      `/admin/schools/${schoolId}/teachers/bulk`,
      { method: "POST", body: JSON.stringify({ teachers }) }
    );
  },
  deleteTeacher(id: string) {
    return request<{ ok: boolean }>(`/admin/teachers/${id}`, { method: "DELETE" });
  },

  // Stats
  getStats() {
    return request<{ schools: number; teachers: number; students: number; attempts: number; recentTeachers: any[]; recentSchools: any[] }>("/admin/stats");
  },
  getSchoolStats(schoolId: string) {
    return request<{ teachers: number; students: number; attempts: number }>(`/admin/schools/${schoolId}/stats`);
  },

  // Questions
  listQuestions() {
    return request<any[]>("/admin/questions");
  },
  createQuestion(data: { id: string; categoryId: string; questionNumber: number; title: string; prompt: string; scenario: string; durationSecs?: number }) {
    return request<any>("/admin/questions", { method: "POST", body: JSON.stringify(data) });
  },
  updateQuestion(id: string, data: { title?: string; prompt?: string; scenario?: string; durationSecs?: number }) {
    return request<any>(`/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
  },
  deleteQuestion(id: string) {
    return request<{ ok: boolean }>(`/admin/questions/${id}`, { method: "DELETE" });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/adminApi.ts
git commit -m "feat: add admin API client"
```

---

### Task 6: Admin Store Context + Login Screen

**Files:**
- Create: `src/context/AdminStoreContext.tsx`
- Create: `src/screens/admin/AdminLogin.tsx`

- [ ] **Step 1: Create admin store context**

Create `src/context/AdminStoreContext.tsx`:

```typescript
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { adminApi, getAdminToken, setAdminToken, clearAdminToken } from "@/lib/adminApi";

interface AdminState {
  isLoggedIn: boolean;
  name: string;
  username: string;
  loading: boolean;
  authError: string | null;
}

interface AdminStore extends AdminState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>({
    isLoggedIn: false,
    name: "",
    username: "",
    loading: true,
    authError: null,
  });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const token = getAdminToken();
    if (!token) {
      setState((p) => ({ ...p, loading: false }));
      return;
    }

    adminApi
      .getMe()
      .then((me) => {
        setState({ isLoggedIn: true, name: me.name, username: me.username, loading: false, authError: null });
      })
      .catch(() => {
        clearAdminToken();
        setState((p) => ({ ...p, loading: false }));
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setState((p) => ({ ...p, loading: true, authError: null }));
    try {
      const res = await adminApi.login(username, password);
      setAdminToken(res.token);
      setState({ isLoggedIn: true, name: res.admin.name, username: res.admin.username, loading: false, authError: null });
    } catch (e: any) {
      const msg = e?.message || "Login failed";
      let errorText = "Invalid credentials";
      const match = msg.match(/API \d+: (.*)/);
      if (match) {
        try { errorText = JSON.parse(match[1]).error || errorText; } catch { errorText = match[1] || errorText; }
      }
      setState((p) => ({ ...p, loading: false, authError: errorText }));
    }
  }, []);

  const logout = useCallback(() => {
    clearAdminToken();
    setState({ isLoggedIn: false, name: "", username: "", loading: false, authError: null });
  }, []);

  const store: AdminStore = { ...state, login, logout };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useAdminStore(): AdminStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStore must be inside AdminStoreProvider");
  return ctx;
}
```

- [ ] **Step 2: Create admin login screen**

Create `src/screens/admin/AdminLogin.tsx`:

```typescript
import { useState } from "react";
import { useAdminStore } from "@/context/AdminStoreContext";
import Spinner from "@/components/Spinner";

export default function AdminLogin() {
  const admin = useAdminStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (admin.loading) return;
    setError("");
    const trimmed = username.trim();
    if (!trimmed) { setError("Username required"); return; }
    if (!password) { setError("Password required"); return; }
    await admin.login(trimmed, password);
  }

  const hasError = !!(error || admin.authError);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f0f23", padding: 24,
    }}>
      <div style={{
        background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16,
        padding: "40px 32px", width: "100%", maxWidth: 380,
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 600, margin: 0 }}>Winnify Admin</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Platform Administration</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            Username
          </label>
          <input
            type="text" value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="admin" autoFocus
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
              background: "#12122a", border: `1px solid ${hasError ? "#f43f5e" : "#2a2a4a"}`,
              color: "#e0e0ff", outline: "none", marginBottom: 14,
            }}
          />

          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            Password
          </label>
          <input
            type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            placeholder="••••••••"
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
              background: "#12122a", border: `1px solid ${hasError ? "#f43f5e" : "#2a2a4a"}`,
              color: "#e0e0ff", outline: "none", marginBottom: 14,
            }}
          />

          {hasError && (
            <p style={{ fontSize: 12, color: "#f43f5e", marginBottom: 12, fontWeight: 600 }}>
              {error || admin.authError}
            </p>
          )}

          <button type="submit" disabled={admin.loading} style={{
            width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 15, fontWeight: 600,
            border: "none", background: admin.loading ? "#333" : "#6366f1", color: "#fff",
            cursor: admin.loading ? "default" : "pointer",
          }}>
            {admin.loading ? <Spinner size={16} color="#fff" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/context/AdminStoreContext.tsx src/screens/admin/AdminLogin.tsx
git commit -m "feat: add admin store context and login screen"
```

---

### Task 7: Admin Layout + Sidebar

**Files:**
- Create: `src/components/admin/AdminLayout.tsx`

- [ ] **Step 1: Create admin layout with sidebar**

Create `src/components/admin/AdminLayout.tsx`:

```typescript
import { useLocation, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAdminStore } from "@/context/AdminStoreContext";
import AdminDashboard from "@/screens/admin/AdminDashboard";
import SchoolsList from "@/screens/admin/SchoolsList";
import SchoolDetail from "@/screens/admin/SchoolDetail";
import QuestionsManager from "@/screens/admin/QuestionsManager";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { path: "/admin/schools", label: "Schools", icon: "🏫", prefix: "/admin/schools" },
  { path: "/admin/questions", label: "Questions", icon: "❓", prefix: "/admin/questions" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = useAdminStore();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0f23" }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: "#1a1a2e", borderRight: "1px solid #2a2a4a",
        display: "flex", flexDirection: "column", padding: "20px 12px",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e0ff", padding: "0 8px 20px", borderBottom: "1px solid #2a2a4a", marginBottom: 12 }}>
          Winnify Admin
        </div>

        {NAV_ITEMS.map(({ path, label, icon, exact, prefix }) => {
          const isActive = exact
            ? location.pathname === path
            : location.pathname === path || (prefix ? location.pathname.startsWith(prefix) : false);
          return (
            <div
              key={path}
              onClick={() => navigate(path)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", marginBottom: 2, fontSize: 14,
                background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                color: isActive ? "#a5b4fc" : "#888",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          );
        })}

        {/* Profile at bottom */}
        <div style={{ marginTop: "auto", borderTop: "1px solid #2a2a4a", paddingTop: 12 }}>
          <div style={{ fontSize: 13, color: "#a5b4fc", fontWeight: 600, padding: "0 8px" }}>
            {admin.name || admin.username}
          </div>
          <button
            onClick={admin.logout}
            style={{
              marginTop: 8, width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid #2a2a4a", background: "transparent", color: "#888",
              cursor: "pointer", fontSize: 13, textAlign: "left",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/schools" element={<SchoolsList />} />
          <Route path="/schools/:id" element={<SchoolDetail />} />
          <Route path="/questions" element={<QuestionsManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/AdminLayout.tsx
git commit -m "feat: add admin layout with sidebar navigation"
```

---

### Task 8: Admin Dashboard Screen

**Files:**
- Create: `src/screens/admin/AdminDashboard.tsx`

- [ ] **Step 1: Create dashboard screen**

Create `src/screens/admin/AdminDashboard.tsx`:

```typescript
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

interface Stats {
  schools: number;
  teachers: number;
  students: number;
  attempts: number;
  recentTeachers: any[];
  recentSchools: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats().then((s) => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;
  if (!stats) return <p style={{ color: "#f43f5e" }}>Failed to load stats</p>;

  const cards = [
    { label: "Schools", value: stats.schools, color: "#6366f1" },
    { label: "Teachers", value: stats.teachers, color: "#8b5cf6" },
    { label: "Students", value: stats.students, color: "#a78bfa" },
    { label: "Attempts", value: stats.attempts, color: "#c4b5fd" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {cards.map((c) => (
          <div key={c.label} style={{
            background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: "20px 18px",
          }}>
            <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Recent schools */}
      <h2 style={{ fontSize: 16, color: "#e0e0ff", fontWeight: 600, marginBottom: 12 }}>Recent Schools</h2>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Code</th>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentSchools.map((s: any) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                <td style={{ padding: "10px 14px" }}>{s.name}</td>
                <td style={{ padding: "10px 14px", color: "#6366f1" }}>{s.code}</td>
                <td style={{ padding: "10px 14px", color: "#888" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentSchools.length === 0 && (
              <tr><td colSpan={3} style={{ padding: "20px 14px", textAlign: "center", color: "#555" }}>No schools yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent teachers */}
      <h2 style={{ fontSize: 16, color: "#e0e0ff", fontWeight: 600, marginBottom: 12 }}>Recent Teachers</h2>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Name</th>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Username</th>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888", fontWeight: 600 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentTeachers.map((t: any) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                <td style={{ padding: "10px 14px" }}>{t.name}</td>
                <td style={{ padding: "10px 14px", color: "#8b5cf6" }}>{t.username}</td>
                <td style={{ padding: "10px 14px", color: "#888" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {stats.recentTeachers.length === 0 && (
              <tr><td colSpan={3} style={{ padding: "20px 14px", textAlign: "center", color: "#555" }}>No teachers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/admin/AdminDashboard.tsx
git commit -m "feat: add admin dashboard screen with stats and recent activity"
```

---

### Task 9: Schools List + School Detail Screens

**Files:**
- Create: `src/screens/admin/SchoolsList.tsx`
- Create: `src/screens/admin/SchoolDetail.tsx`
- Create: `src/components/admin/BulkImportModal.tsx`

- [ ] **Step 1: Create SchoolsList screen**

Create `src/screens/admin/SchoolsList.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

export default function SchoolsList() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "", contactEmail: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.listSchools().then(setSchools).finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (!form.name.trim() || !form.code.trim()) { setError("Name and code are required"); return; }
    setCreating(true);
    try {
      const created = await adminApi.createSchool({
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
      });
      setSchools((prev) => [{ ...created, teacherCount: 0, studentCount: 0 }, ...prev]);
      setShowCreate(false);
      setForm({ name: "", code: "", address: "", contactEmail: "" });
    } catch (e: any) {
      setError(e.message || "Failed to create school");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(school: any) {
    const updated = await adminApi.updateSchool(school.id, { isActive: !school.isActive });
    setSchools((prev) => prev.map((s) => (s.id === school.id ? { ...s, ...updated } : s)));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, margin: 0 }}>Schools</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
        >
          + Add School
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{
          background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ color: "#e0e0ff", marginTop: 0, marginBottom: 16 }}>New School</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="School Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
              <input placeholder="Code (e.g. DPS-HYD) *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
              <input placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a", background: "#12122a", color: "#e0e0ff", fontSize: 13 }} />
            </div>
            {error && <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setError(""); }}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schools table */}
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Name</th>
              <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Code</th>
              <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Teachers</th>
              <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Students</th>
              <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Status</th>
              <th style={{ padding: "10px 14px", textAlign: "right", color: "#888" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1f1f3a", cursor: "pointer" }}
                onClick={() => navigate(`/admin/schools/${s.id}`)}>
                <td style={{ padding: "12px 14px", fontWeight: 500 }}>{s.name}</td>
                <td style={{ padding: "12px 14px", color: "#6366f1" }}>{s.code}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>{s.teacherCount}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>{s.studentCount}</td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={{
                    padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: s.isActive ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)",
                    color: s.isActive ? "#22c55e" : "#f43f5e",
                  }}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => toggleActive(s)}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 11 }}>
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "30px 14px", textAlign: "center", color: "#555" }}>No schools yet. Click "Add School" to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create BulkImportModal**

Create `src/components/admin/BulkImportModal.tsx`:

```typescript
import { useState, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

interface Props {
  schoolId: string;
  onClose: () => void;
  onImported: () => void;
}

export default function BulkImportModal({ schoolId, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<{ name: string; grades: string }[]>([]);
  const [results, setResults] = useState<{ name: string; username: string; password: string }[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      // Skip header if it looks like one
      const start = lines[0]?.toLowerCase().includes("name") ? 1 : 0;
      const parsed = lines.slice(start).map((line) => {
        const parts = line.split(",");
        const name = parts[0]?.replace(/"/g, "").trim() || "";
        const grades = parts.slice(1).join(",").replace(/"/g, "").trim();
        return { name, grades };
      }).filter((r) => r.name);
      setRows(parsed);
      setError("");
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (importing || rows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      const res = await adminApi.bulkImportTeachers(schoolId, rows);
      setResults(res.teachers);
      onImported();
    } catch (e: any) {
      setError(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function downloadCSV() {
    if (!results) return;
    const csv = "name,username,password\n" + results.map((r) => `"${r.name}","${r.username}","${r.password}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520 }}>
        <h3 style={{ color: "#e0e0ff", marginTop: 0, marginBottom: 16 }}>
          {results ? "Import Complete" : "Bulk Import Teachers"}
        </h3>

        {!results ? (
          <>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              Upload a CSV with columns: <code style={{ color: "#6366f1" }}>name, grades</code><br />
              Example: <code style={{ color: "#888" }}>Priya Sharma, "1,2,3"</code>
            </p>

            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
              style={{ display: "block", marginBottom: 16, color: "#888", fontSize: 13 }} />

            {rows.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: "#a5b4fc", fontSize: 13, marginBottom: 8 }}>{rows.length} teachers found:</p>
                <div style={{ maxHeight: 150, overflowY: "auto", background: "#12122a", borderRadius: 8, padding: 10, fontSize: 12, color: "#ccc" }}>
                  {rows.map((r, i) => (
                    <div key={i}>{r.name} — grades: {r.grades || "none"}</div>
                  ))}
                </div>
              </div>
            )}

            {error && <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 8 }}>{error}</p>}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleImport} disabled={importing || rows.length === 0}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: rows.length > 0 ? "#6366f1" : "#333", color: "#fff", cursor: rows.length > 0 ? "pointer" : "default", fontSize: 13 }}>
                {importing ? <Spinner size={14} color="#fff" /> : `Import ${rows.length} Teachers`}
              </button>
              <button onClick={onClose}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: "#22c55e", fontSize: 13, marginBottom: 16 }}>
              Successfully created {results.length} teacher accounts.
            </p>
            <div style={{ maxHeight: 200, overflowY: "auto", background: "#12122a", borderRadius: 8, padding: 10, fontSize: 12, color: "#ccc", marginBottom: 16 }}>
              {results.map((r, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {r.name} → <span style={{ color: "#8b5cf6" }}>{r.username}</span> / <span style={{ color: "#fbbf24" }}>{r.password}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={downloadCSV}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Download Credentials CSV
              </button>
              <button onClick={onClose}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create SchoolDetail screen**

Create `src/screens/admin/SchoolDetail.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/adminApi";
import BulkImportModal from "@/components/admin/BulkImportModal";
import Spinner from "@/components/Spinner";

export default function SchoolDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [tab, setTab] = useState<"teachers" | "stats">("teachers");

  function loadData() {
    if (!id) return;
    Promise.all([
      adminApi.listSchools().then((s) => setSchool(s.find((x: any) => x.id === id))),
      adminApi.listTeachers(id).then(setTeachers),
      adminApi.getSchoolStats(id).then(setStats),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [id]);

  async function removeTeacher(teacherId: string) {
    if (!confirm("Remove this teacher?")) return;
    await adminApi.deleteTeacher(teacherId);
    setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;
  if (!school) return <p style={{ color: "#f43f5e" }}>School not found</p>;

  return (
    <div>
      <button onClick={() => navigate("/admin/schools")}
        style={{ background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, marginBottom: 12, padding: 0 }}>
        ← Back to Schools
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, margin: 0 }}>{school.name}</h1>
        <p style={{ color: "#6366f1", fontSize: 14, margin: "4px 0" }}>Code: {school.code}</p>
        {school.address && <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{school.address}</p>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {(["teachers", "stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, cursor: "pointer",
            background: tab === t ? "#6366f1" : "#1a1a2e", color: tab === t ? "#fff" : "#888",
          }}>
            {t === "teachers" ? "Teachers" : "Stats"}
          </button>
        ))}
      </div>

      {tab === "teachers" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setShowBulk(true)}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13 }}>
              Bulk Import CSV
            </button>
          </div>

          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Name</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Username</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#888" }}>Grades</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", color: "#888" }}>Students</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "#888" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                    <td style={{ padding: "10px 14px" }}>{t.name}</td>
                    <td style={{ padding: "10px 14px", color: "#8b5cf6" }}>{t.username}</td>
                    <td style={{ padding: "10px 14px", color: "#888" }}>{(t.grades || []).join(", ") || "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{t.studentCount}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <button onClick={() => removeTeacher(t.id)}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #f43f5e33", background: "transparent", color: "#f43f5e", cursor: "pointer", fontSize: 11 }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "30px 14px", textAlign: "center", color: "#555" }}>No teachers yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {showBulk && id && (
            <BulkImportModal
              schoolId={id}
              onClose={() => setShowBulk(false)}
              onImported={() => { if (id) adminApi.listTeachers(id).then(setTeachers); }}
            />
          )}
        </>
      )}

      {tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { label: "Teachers", value: stats.teachers, color: "#6366f1" },
            { label: "Students", value: stats.students, color: "#8b5cf6" },
            { label: "Attempts", value: stats.attempts, color: "#a78bfa" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: "20px 18px" }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/screens/admin/SchoolsList.tsx src/screens/admin/SchoolDetail.tsx src/components/admin/BulkImportModal.tsx
git commit -m "feat: add schools list, school detail, and bulk import screens"
```

---

### Task 10: Questions Manager Screen

**Files:**
- Create: `src/screens/admin/QuestionsManager.tsx`

- [ ] **Step 1: Create questions manager screen**

Create `src/screens/admin/QuestionsManager.tsx`:

```typescript
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import Spinner from "@/components/Spinner";

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ id: "", categoryId: "", questionNumber: 1, title: "", prompt: "", scenario: "", durationSecs: 60 });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.listQuestions().then(setQuestions).finally(() => setLoading(false));
  }, []);

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const q of questions) {
    if (!grouped[q.categoryId]) grouped[q.categoryId] = [];
    grouped[q.categoryId].push(q);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (!form.id || !form.categoryId || !form.title || !form.prompt || !form.scenario) {
      setError("All fields are required");
      return;
    }
    setCreating(true);
    try {
      const created = await adminApi.createQuestion(form);
      setQuestions((prev) => [...prev, created]);
      setShowCreate(false);
      setForm({ id: "", categoryId: "", questionNumber: 1, title: "", prompt: "", scenario: "", durationSecs: 60 });
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await adminApi.deleteQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={24} /></div>;

  const inputStyle = {
    padding: "10px 12px", borderRadius: 8, border: "1px solid #2a2a4a",
    background: "#12122a", color: "#e0e0ff", fontSize: 13, width: "100%",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, color: "#e0e0ff", fontWeight: 700, margin: 0 }}>Questions</h1>
        <button onClick={() => setShowCreate(true)}
          style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          + Add Question
        </button>
      </div>

      {showCreate && (
        <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ color: "#e0e0ff", marginTop: 0, marginBottom: 16 }}>New Question</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <input placeholder="ID (e.g. ct-q6)" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} style={inputStyle} />
              <input placeholder="Category ID" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inputStyle} />
              <input placeholder="Question #" type="number" value={form.questionNumber}
                onChange={(e) => setForm({ ...form, questionNumber: parseInt(e.target.value) || 1 })} style={inputStyle} />
            </div>
            <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ ...inputStyle, marginBottom: 12 }} />
            <textarea placeholder="Prompt" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={3} style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }} />
            <textarea placeholder="Scenario" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })}
              rows={3} style={{ ...inputStyle, marginBottom: 12, resize: "vertical" }} />
            {error && <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={creating}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 13 }}>
                {creating ? "Creating..." : "Create"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #2a2a4a", background: "transparent", color: "#888", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0 && (
        <p style={{ color: "#555", textAlign: "center", padding: 40 }}>No questions yet</p>
      )}

      {Object.entries(grouped).map(([category, qs]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, color: "#a5b4fc", fontWeight: 600, marginBottom: 10, textTransform: "capitalize" }}>
            {category} ({qs.length})
          </h2>
          <div style={{ background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#ccc" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#888", width: 40 }}>#</th>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: "#888" }}>Title</th>
                  <th style={{ padding: "8px 14px", textAlign: "center", color: "#888", width: 80 }}>Duration</th>
                  <th style={{ padding: "8px 14px", textAlign: "right", color: "#888", width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {qs.sort((a: any, b: any) => a.questionNumber - b.questionNumber).map((q: any) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid #1f1f3a" }}>
                    <td style={{ padding: "8px 14px", color: "#6366f1" }}>{q.questionNumber}</td>
                    <td style={{ padding: "8px 14px" }}>{q.title}</td>
                    <td style={{ padding: "8px 14px", textAlign: "center", color: "#888" }}>{q.durationSecs}s</td>
                    <td style={{ padding: "8px 14px", textAlign: "right" }}>
                      <button onClick={() => deleteQuestion(q.id)}
                        style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #f43f5e33", background: "transparent", color: "#f43f5e", cursor: "pointer", fontSize: 11 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/admin/QuestionsManager.tsx
git commit -m "feat: add questions manager screen"
```

---

### Task 11: Wire Admin Routes into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to include admin routes**

Replace the entire `src/App.tsx` with:

```typescript
import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Spinner from "@/components/Spinner";
import { SessionProvider } from "@/context/SessionContext";
import { UserStoreProvider } from "@/context/UserStoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { SchoolSessionProvider } from "@/context/SchoolSessionContext";
import { AdminStoreProvider, useAdminStore } from "@/context/AdminStoreContext";
import ToastContainer from "@/components/Toast";
import OfflineBanner from "@/components/OfflineBanner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useStore } from "@/context/UserStoreContext";
import { syncModeClass } from "@/hooks/useMode";
import SchoolTopNav from "@/components/SchoolTopNav";
import CloudsBg from "@/components/CloudsBg";
import SchoolBgDecorations from "@/components/SchoolBgDecorations";
import Login from "@/screens/Login";
import AdminLogin from "@/screens/admin/AdminLogin";
import AdminLayout from "@/components/admin/AdminLayout";
// School screens
import TeacherHome from "@/screens/school/TeacherHome";
import ChallengeStep1Category from "@/screens/school/ChallengeStep1Category";
import ChallengeStep2GradeQuestion from "@/screens/school/ChallengeStep2GradeQuestion";
import ChallengeStep3Administer from "@/screens/school/ChallengeStep3Administer";
import SchoolRecording from "@/screens/school/SchoolRecording";
import SchoolReport from "@/screens/school/SchoolReport";
import StudentsList from "@/screens/school/StudentsList";
import ReportsList from "@/screens/school/ReportsList";
import ClassReport from "@/screens/school/ClassReport";
import CustomChallenges from "@/screens/school/CustomChallenges";

function SchoolRoutes() {
  const location = useLocation();
  if (location.pathname === "/") {
    return <Navigate to="/school" replace />;
  }
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/school" replace />} />
        <Route path="/school" element={<TeacherHome />} />
        <Route path="/school/students" element={<StudentsList />} />
        <Route path="/school/custom-challenges" element={<CustomChallenges />} />
        <Route path="/school/administer" element={<ChallengeStep1Category />} />
        <Route path="/school/administer/grade" element={<ChallengeStep2GradeQuestion />} />
        <Route path="/school/administer/run" element={<ChallengeStep3Administer />} />
        <Route path="/school/recording" element={<SchoolRecording />} />
        <Route path="/school/reports" element={<ReportsList />} />
        <Route path="/school/report/:id" element={<SchoolReport />} />
        <Route path="/school/class-report/:grade/:questionId" element={<ClassReport />} />
        {/* Catch all → home */}
        <Route path="*" element={<Navigate to="/school" replace />} />
      </Routes>
    </div>
  );
}

function AdminApp() {
  const admin = useAdminStore();

  if (admin.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f0f23" }}>
        <Spinner size={24} />
      </div>
    );
  }

  if (!admin.isLoggedIn) {
    return <AdminLogin />;
  }

  return <AdminLayout />;
}

function SchoolApp() {
  const store = useStore();

  useEffect(() => {
    syncModeClass("school");
  }, []);

  if (store.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!store.hasOnboarded) {
    return <Login />;
  }

  return (
    <div className="school-layout">
      <CloudsBg />
      <SchoolBgDecorations />
      <SchoolTopNav />
      <div className="school-body">
        <div className="school-content">
          <SchoolRoutes />
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <AdminStoreProvider>
        <AdminApp />
      </AdminStoreProvider>
    );
  }

  return (
    <UserStoreProvider>
      <SessionProvider>
        <SchoolSessionProvider>
          <SchoolApp />
        </SchoolSessionProvider>
      </SessionProvider>
    </UserStoreProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <OfflineBanner />
        <AppRouter />
        <ToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2: Verify the app builds**

```bash
npx vite build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire admin routes into App.tsx — /admin/* for admin, /school/* for teachers"
```

---

### Task 12: End-to-End Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
cd server && npm run dev &
cd .. && npx vite dev
```

- [ ] **Step 2: Test admin login**

Navigate to `http://localhost:5173/admin`. Should show admin login page. Log in with `admin` / `admin123`. Should see the admin dashboard.

- [ ] **Step 3: Test school creation**

Click "Schools" in sidebar → "Add School" → fill form → create. Should appear in the table.

- [ ] **Step 4: Test bulk import**

Click into the school → "Bulk Import CSV" → upload a CSV file:
```
name,grades
Test Teacher,"1,2"
Another Teacher,"3,4,5"
```
Should show created credentials. Download CSV button should work.

- [ ] **Step 5: Test teacher login**

Open a new tab to `http://localhost:5173/school`. Log in with one of the generated teacher credentials. Should see the teacher portal.

- [ ] **Step 6: Test that existing /school routes still work**

Navigate through the teacher portal — home, students, reports. All should work as before.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: winnify-jr admin panel — multi-tenant schools, teacher onboarding, analytics"
```
