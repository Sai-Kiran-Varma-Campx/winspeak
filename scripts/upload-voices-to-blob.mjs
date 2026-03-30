/**
 * Upload static coach voice PCM files to Vercel Blob.
 * Run: BLOB_READ_WRITE_TOKEN=<token> node scripts/upload-voices-to-blob.mjs
 *
 * After uploading, copy the output URLs into src/constants/voiceUrls.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICES_DIR = path.join(__dirname, "..", "public", "voices");

const CHALLENGE_IDS = [
  "c1", "c2", "c3", "c4", "c5", "c6", "c7",
  "c8", "c9", "c10", "c11", "c12", "c13", "c14",
];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Set BLOB_READ_WRITE_TOKEN env var");
    process.exit(1);
  }

  const urls = {};

  for (const id of CHALLENGE_IDS) {
    const filePath = path.join(VOICES_DIR, `${id}.pcm`);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭  ${id} — file not found, skipping`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    console.log(`⏳ ${id} — uploading (${(fileBuffer.length / 1024).toFixed(0)} KB)...`);

    try {
      const { url } = await put(`voices/${id}.pcm`, fileBuffer, {
        access: "public",
        contentType: "application/octet-stream",
      });
      urls[id] = url;
      console.log(`✅ ${id} — ${url}`);
    } catch (err) {
      console.error(`❌ ${id} — ${err.message}`);
    }
  }

  // Output the URL map for copy-paste into code
  console.log("\n\n// Copy this into src/constants/voiceUrls.ts:");
  console.log("export const VOICE_URLS: Record<string, string> = {");
  for (const [id, url] of Object.entries(urls)) {
    console.log(`  "${id}": "${url}",`);
  }
  console.log("};");
}

main();
