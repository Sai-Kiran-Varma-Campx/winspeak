/**
 * Upload school voice PCM files to Vercel Blob.
 * Run: BLOB_READ_WRITE_TOKEN=<token> node scripts/upload-school-voices-to-blob.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VOICES_DIR = path.join(__dirname, "..", "public", "voices", "school");

const SCHOOL_IDS = [
  "circletime_1", "circletime_2", "circletime_3", "circletime_4", "circletime_5",
  "building_talks_1", "building_talks_2", "building_talks_3", "building_talks_4", "building_talks_5",
  "tedlets_1", "tedlets_2", "tedlets_3", "tedlets_4", "tedlets_5",
  "interview_discussion_1", "interview_discussion_2", "interview_discussion_3", "interview_discussion_4", "interview_discussion_5",
  "voice_for_change_1", "voice_for_change_2", "voice_for_change_3", "voice_for_change_4", "voice_for_change_5",
  "podcast_playground_1", "podcast_playground_2", "podcast_playground_3", "podcast_playground_4", "podcast_playground_5",
  "student_council_1", "student_council_2", "student_council_3", "student_council_4", "student_council_5",
];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Set BLOB_READ_WRITE_TOKEN env var");
    process.exit(1);
  }

  console.log(`\n📤 Uploading ${SCHOOL_IDS.length} school voice files to Vercel Blob...\n`);

  const urls = {};
  let uploaded = 0;
  let failed = 0;

  for (const id of SCHOOL_IDS) {
    const filePath = path.join(VOICES_DIR, `${id}.pcm`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  ${id}.pcm — file not found, skipping`);
      failed++;
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = await put(`voices/school/${id}.pcm`, fileBuffer, {
        access: "public",
        contentType: "application/octet-stream",
        allowOverwrite: true,
      });

      urls[id] = blob.url;
      console.log(`  ✅ ${id} → ${blob.url}`);
      uploaded++;
    } catch (err) {
      console.error(`  ❌ ${id} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${uploaded} uploaded, ${failed} failed\n`);

  // Output ready-to-copy code for voiceUrls.ts
  console.log("// ── Copy this into src/constants/voiceUrls.ts ──\n");
  console.log("export const SCHOOL_VOICE_URLS: Record<string, string> = {");
  for (const [id, url] of Object.entries(urls)) {
    console.log(`  "${id}": "${url}",`);
  }
  console.log("};\n");
}

main();
