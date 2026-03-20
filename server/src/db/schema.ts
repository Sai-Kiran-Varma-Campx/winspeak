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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_users_username").on(t.username),
    index("idx_users_total_xp").on(t.totalXp),
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
