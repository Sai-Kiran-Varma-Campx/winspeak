/**
 * Create a test teacher account.
 * Run: node scripts/create-test-teacher.mjs <username> <password> <name> <grades>
 * Example: node scripts/create-test-teacher.mjs teacher1 password123 "Ms. Smith" 1,2
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

// Load DATABASE_URL from server/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "server", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) process.env[key.trim()] = vals.join("=").trim();
  }
}

const sql = neon(process.env.DATABASE_URL);

const [,, username, password, name, gradesStr] = process.argv;

if (!username || !password) {
  console.log("Usage: node scripts/create-test-teacher.mjs <username> <password> <name> <grades>");
  console.log("Example: node scripts/create-test-teacher.mjs teacher1 pass123 \"Ms. Smith\" 1,2");
  process.exit(1);
}

const teacherName = name || username;
const grades = gradesStr ? gradesStr.split(",").map(Number) : [1, 2, 3, 4];

// PBKDF2 hash matching the backend
async function hashPassword(pw) {
  const { subtle } = globalThis.crypto;
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const key = await subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  const hash = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function main() {
  const passwordHash = await hashPassword(password);

  try {
    await sql`
      INSERT INTO users (id, username, password_hash, name, has_onboarded, grades)
      VALUES (gen_random_uuid(), ${username}, ${passwordHash}, ${teacherName}, true, ${JSON.stringify(grades)}::jsonb)
    `;
    console.log(`✅ Teacher created:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${teacherName}`);
    console.log(`   Grades: ${grades.join(", ")}`);
  } catch (err) {
    if (err.message?.includes("unique")) {
      console.log(`❌ Username "${username}" already exists.`);
    } else {
      console.error("❌ Error:", err.message);
    }
  }
}

main();
