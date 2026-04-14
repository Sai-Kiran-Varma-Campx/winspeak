import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import userRoutes from "./routes/users.js";
import attemptRoutes from "./routes/attempts.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import schoolRoutes from "./routes/school.js";
import adminRoutes from "./routes/admin.js";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.route("/api/users", userRoutes);
app.route("/api/users/me/attempts", attemptRoutes);
app.route("/api/leaderboard", leaderboardRoutes);
app.route("/api/school", schoolRoutes);
app.route("/api/admin", adminRoutes);

app.get("/api/health", (c) => c.json({ ok: true }));

export default app;
