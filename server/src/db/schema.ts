import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  date,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

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

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull().default(""),
    hasOnboarded: boolean("has_onboarded").notNull().default(false),
    totalXp: integer("total_xp").notNull().default(0),
    streak: integer("streak").notNull().default(0),
    lastActivityDate: date("last_activity_date"),
    grades: jsonb("grades").$type<number[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
    role: text("role"),
  },
  (t) => [
    index("idx_users_username").on(t.username),
    index("idx_users_total_xp").on(t.totalXp),
    index("idx_users_school").on(t.schoolId),
  ]
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id").notNull(),
    challengeTitle: text("challenge_title").notNull(),
    score: integer("score").notNull(),
    xpEarned: integer("xp_earned").notNull(),
    passed: boolean("passed").notNull().default(false),
    skillFluency: integer("skill_fluency"),
    skillGrammar: integer("skill_grammar"),
    skillVocabulary: integer("skill_vocabulary"),
    skillClarity: integer("skill_clarity"),
    skillStructure: integer("skill_structure"),
    skillRelevancy: integer("skill_relevancy"),
    analysisResult: jsonb("analysis_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_attempts_user_created").on(t.userId, t.createdAt),
    index("idx_attempts_user_challenge").on(t.userId, t.challengeId),
  ]
);

// ── School POC: students managed by teachers ────────────────────────────────
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    studentExternalId: text("student_external_id"),
    grade: integer("grade").notNull(),
    section: text("section"),
    parentEmail: text("parent_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
  },
  (t) => [
    index("idx_students_teacher").on(t.teacherId),
    index("idx_students_teacher_grade").on(t.teacherId, t.grade),
    index("idx_students_school").on(t.schoolId),
  ]
);

// School-mode attempts: linked to a student (not the teacher's own user account)
export const studentAttempts = pgTable(
  "student_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    questionId: text("question_id").notNull(),
    questionTitle: text("question_title").notNull(),
    grade: integer("grade").notNull(),
    score: integer("score").notNull(),
    skillFluency: integer("skill_fluency"),
    skillGrammar: integer("skill_grammar"),
    skillVocabulary: integer("skill_vocabulary"),
    skillClarity: integer("skill_clarity"),
    skillStructure: integer("skill_structure"),
    skillRelevancy: integer("skill_relevancy"),
    confidenceScore: integer("confidence_score"),
    analysisResult: jsonb("analysis_result"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
  },
  (t) => [
    index("idx_student_attempts_student").on(t.studentId, t.createdAt),
    index("idx_student_attempts_teacher").on(t.teacherId, t.createdAt),
    index("idx_student_attempts_school").on(t.schoolId),
  ]
);

// ── School questions (content from PDF, 5 per category) ───────────────────
export const schoolQuestions = pgTable(
  "school_questions",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull(),
    questionNumber: integer("question_number").notNull(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    scenario: text("scenario").notNull(),
    durationSecs: integer("duration_secs").notNull().default(60),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    schoolId: uuid("school_id").references(() => schools.id, { onDelete: "set null" }),
  },
  (t) => [
    index("idx_school_questions_category").on(t.categoryId),
  ]
);

// ── Platform admins (CampX internal team) ─────────────────────────────────
export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type StudentAttempt = typeof studentAttempts.$inferSelect;
export type NewStudentAttempt = typeof studentAttempts.$inferInsert;
export type SchoolQuestionRow = typeof schoolQuestions.$inferSelect;
export type NewSchoolQuestion = typeof schoolQuestions.$inferInsert;
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
