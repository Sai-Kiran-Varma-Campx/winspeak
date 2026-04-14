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
