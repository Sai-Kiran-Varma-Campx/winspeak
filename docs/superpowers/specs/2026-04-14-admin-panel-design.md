# Winnify-JR Admin Panel — Design Spec

**Date:** 2026-04-14
**Branch:** winnify-jr-dev
**Deployment:** Same app as Winnify-JR at `/admin` routes (winnify-jr.vercel.app/admin)

## Overview

An internal admin panel for the CampX team to manage schools (tenants), onboard teachers via CSV bulk import, view platform analytics, and manage speaking challenges. Teachers never see or access the admin panel.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment | Same app, `/admin` route | POC simplicity, one codebase, shared API |
| Multi-tenancy | Shared tables + `school_id` column | Simplest approach, additive-only schema changes |
| DB | Same Neon DB for WinSpeak + Winnify | Both apps coexist, nullable new columns don't break WinSpeak |
| Admin auth | Separate `admins` table, seeded via script | No signup page, clean separation from teachers |
| Bulk import | CSV upload → auto-generate credentials | Admin downloads credentials CSV to distribute |

## DB Schema Changes

All changes are **additive only** — new tables, new nullable columns. WinSpeak code remains untouched.

### New Tables

```sql
-- schools: the tenant entity
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,          -- short code like "DPS-HYD"
  address TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- admins: platform administrators (CampX internal team)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Modified Tables (nullable new columns)

```sql
-- users: add school_id + role
ALTER TABLE users ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN role TEXT;  -- 'teacher' for winnify, NULL for winspeak students

-- students: add school_id (denormalized for fast queries)
ALTER TABLE students ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- student_attempts: add school_id (denormalized)
ALTER TABLE student_attempts ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

-- school_questions: add school_id (NULL = global question)
ALTER TABLE school_questions ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;
```

### Indexes

```sql
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_student_attempts_school ON student_attempts(school_id);
CREATE INDEX idx_school_questions_school ON school_questions(school_id);
```

### Drizzle Schema (new tables)

```typescript
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  contactEmail: text("contact_email"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_schools_code").on(t.code),
]);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

### Drizzle Schema (modified columns)

Add to existing table definitions:

```typescript
// users table: add these columns
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
role: text("role"),  // 'teacher' | null

// students table: add
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),

// studentAttempts table: add
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),

// schoolQuestions table: add
schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
```

## Admin Authentication

### Separate from teacher auth

- **Table:** `admins` (not `users`)
- **Login endpoint:** `POST /api/admin/login`
- **Middleware:** `resolveAdmin` — verifies JWT, looks up `admins` table
- **JWT payload:** `{ sub: admin.id, role: 'admin' }`
- **No signup page** — admin accounts seeded via `scripts/seed-admin.ts`

### Seed Script

```
ADMIN_USERNAME=admin ADMIN_PASSWORD=<secret> npx tsx scripts/seed-admin.ts
```

Creates a single admin user with PBKDF2-hashed password. Idempotent (updates if exists).

## API Routes

All under `/api/admin/*`, protected by `resolveAdmin` middleware.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Admin login → JWT |
| GET | `/api/admin/me` | Admin profile |

### Schools CRUD
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/schools` | List all schools |
| POST | `/api/admin/schools` | Create a school |
| PATCH | `/api/admin/schools/:id` | Update school |
| DELETE | `/api/admin/schools/:id` | Deactivate school (soft delete: `is_active=false`) |

### Teacher Onboarding
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/schools/:id/teachers` | List teachers in a school |
| POST | `/api/admin/schools/:id/teachers` | Create single teacher |
| POST | `/api/admin/schools/:id/teachers/bulk` | CSV bulk import |
| DELETE | `/api/admin/teachers/:id` | Remove teacher |

### Dashboard / Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Global stats: school count, teacher count, student count, attempt count |
| GET | `/api/admin/schools/:id/stats` | Per-school stats |

### Questions Management
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/questions` | List all questions |
| POST | `/api/admin/questions` | Add question |
| PATCH | `/api/admin/questions/:id` | Edit question |
| DELETE | `/api/admin/questions/:id` | Remove question |

## Bulk Import Flow

### CSV Format (input)
```csv
name,grades
Priya Sharma,"1,2,3"
Rahul Verma,"4,5"
```

### Processing
1. Parse CSV rows
2. For each teacher:
   - Generate username: `lowercase(first_name) + random 3 digits` (e.g., `priya472`)
   - Generate password: random 8-char alphanumeric (e.g., `xK7mP2qR`)
   - Hash password with PBKDF2
   - Insert into `users` with `school_id`, `role='teacher'`, `grades` parsed
3. Check for username collisions, retry with different digits
4. Return JSON array of `{ name, username, password }` (plaintext, one-time)

### Response (downloadable CSV)
```csv
name,username,password
Priya Sharma,priya472,xK7mP2qR
Rahul Verma,rahul891,mN3pQ7wX
```

Admin downloads this CSV and distributes credentials to teachers (print/email).

## Frontend Screens

### Route Structure
```
/admin/login     → AdminLogin (standalone, no sidebar)
/admin           → AdminDashboard
/admin/schools   → SchoolsList
/admin/schools/:id → SchoolDetail (teachers list + bulk import)
/admin/questions → QuestionsManager
```

### Routing Logic in App.tsx
```
if (path starts with /admin) {
  if (!adminLoggedIn) → show AdminLogin
  else → show AdminLayout (sidebar + content)
} else {
  // existing teacher portal flow
}
```

### AdminLogin
- Simple username/password form
- Calls `POST /api/admin/login`
- Stores admin JWT in localStorage (separate key from teacher JWT: `admin_token`)
- Redirects to `/admin`

### AdminDashboard (`/admin`)
- Stats cards: total schools, total teachers, total students, total attempts
- Recent activity list (latest teacher onboardings, latest schools added)

### SchoolsList (`/admin/schools`)
- Table: name, code, teachers count, students count, status (active/inactive), created date
- "Add School" button → modal with name, code, address, email
- Row click → navigate to SchoolDetail
- Toggle active/inactive

### SchoolDetail (`/admin/schools/:id`)
- School info header (name, code, address)
- Teachers tab:
  - Table: name, username, grades, students count, created date
  - "Add Teacher" button → single teacher form
  - "Bulk Import" button → CSV upload + download credentials
  - "Remove" action per teacher
- Stats tab:
  - Teacher count, student count, attempt count for this school

### QuestionsManager (`/admin/questions`)
- Group by category
- Add/edit/delete questions
- Fields: category, question number, title, prompt, scenario, duration

## Auth Middleware

### resolveAdmin (new)
```typescript
// Same pattern as resolveUser but reads from admins table
// Checks JWT has role='admin'
// Sets c.set("admin", adminRow)
```

### resolveUser (unchanged)
- Continues to work for teacher routes
- No changes needed — WinSpeak and Winnify teacher flows unaffected

## File Structure (new files)

```
server/src/
├── routes/admin.ts          # All /api/admin/* routes
├── middleware/adminAuth.ts   # resolveAdmin middleware
scripts/
├── seed-admin.ts            # Seed admin user
src/
├── screens/admin/
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── SchoolsList.tsx
│   ├── SchoolDetail.tsx
│   └── QuestionsManager.tsx
├── components/admin/
│   ├── AdminSidebar.tsx
│   ├── AdminLayout.tsx
│   └── BulkImportModal.tsx
├── context/AdminStoreContext.tsx
├── lib/adminApi.ts          # Admin API client (uses admin_token)
```

## Impact on Existing Code

| File | Change |
|------|--------|
| `server/src/db/schema.ts` | Add `schools`, `admins` tables; add `schoolId`, `role` columns to existing tables |
| `server/src/app.ts` | Add `app.route("/api/admin", adminRoutes)` |
| `server/src/routes/school.ts` | Add `school_id` filter to queries (where teacher has school_id) |
| `src/App.tsx` | Add admin route detection + AdminLayout |
| WinSpeak branch code | **ZERO changes** — all new columns nullable |

## POC Simplifications

- `school_questions.school_id` is added but **not filtered on** yet — all questions remain global, visible to all teachers across all schools. Per-school question assignment is future work.
- Teacher portal (`/school/*` routes) continues to work without `school_id` filtering for now. The `school_id` column is populated on teacher creation but the existing queries don't filter by it yet — they filter by `teacher_id` which is sufficient.

## Out of Scope (POC)

- Email notifications to teachers
- Password reset for teachers (admin can re-generate)
- Role-based permissions within admin (all admins are equal)
- Audit logging
- Custom domains per school
- Student self-registration with school codes
