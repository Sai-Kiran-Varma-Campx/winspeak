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
  "hr1", "hr2", "hr3", "hr4", "hr5", "hr6", "hr7", "hr8", "hr9", "hr10",
  "hr11", "hr12", "hr13", "hr14", "hr15", "hr16", "hr17", "hr18", "hr19", "hr20",
  "hr21", "hr22", "hr23", "hr24", "hr25", "hr26", "hr27", "hr28", "hr29", "hr30",
  "hr31", "hr32", "hr33", "hr34", "hr35", "hr36", "hr37", "hr38", "hr39", "hr40",
  "hr41", "hr42", "hr43", "hr44", "hr45", "hr46", "hr47", "hr48", "hr49", "hr50",
  "abap1", "abap2", "abap3", "abap4", "abap5", "abap6",
  "abap7", "abap8", "abap9", "abap10", "abap11", "abap12",
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
