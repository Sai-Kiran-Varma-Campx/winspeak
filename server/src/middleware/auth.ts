import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { verify } from "hono/jwt";
import { db } from "../db/index.js";
import { users, type User } from "../db/schema.js";

type Env = { Variables: { user: User } };

export const resolveUser = createMiddleware<Env>(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = auth.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) return c.json({ error: "Server misconfigured" }, 500);

  let payload: { sub?: string };
  try {
    payload = (await verify(token, secret, "HS256")) as { sub?: string };
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  if (!payload.sub) return c.json({ error: "Invalid token payload" }, 401);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  if (!user) return c.json({ error: "User not found" }, 401);

  c.set("user", user);
  await next();
});
