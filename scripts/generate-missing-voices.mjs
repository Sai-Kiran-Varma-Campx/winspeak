/**
 * Generate missing voice files — 5 at a time, with text variation on retry.
 * Run: node scripts/generate-missing-voices.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "voices");

const envFile = fs.readFileSync(path.join(ROOT, ".env"), "utf-8");
const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY=(.+)/);
const API_KEY = process.env.GEMINI_API_KEY || apiKeyMatch?.[1]?.trim() || "";

if (!API_KEY) { console.error("No API key"); process.exit(1); }

const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Only the 16 missing challenges
const MISSING = [
  { id: "hr3", week: "HR", title: "Beyond the Job Description", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your willingness to step outside your comfort zone and take on unfamiliar responsibilities.", prompt: "Recall a time when you were assigned a task outside of your job description. How did you handle the situation? What was the outcome?" },
  { id: "hr11", week: "HR", title: "Team Player", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for genuine enthusiasm about teamwork and your ability to contribute meaningfully.", prompt: "Tell me about one of your favourite experiences working with a team and the contributions you made." },
  { id: "hr17", week: "HR", title: "Selling an Idea", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your ability to build buy-in and champion ideas effectively.", prompt: "Have you ever had to 'sell' an idea to your co-workers or group? How did you do it? What were the results?" },
  { id: "hr22", week: "HR", title: "Career Achievement", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see what motivates you and whether you set meaningful goals for yourself.", prompt: "What's the biggest career goal you've achieved?" },
  { id: "hr26", week: "HR", title: "Estimating Time", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your approach to realistic time estimation and workload management.", prompt: "How do you determine what amount of time is reasonable for a task?" },
  { id: "hr29", week: "HR", title: "Resolving Miscommunication", scenario: "You're in an HR interview for a campus placement. The interviewer wants to assess your mediation skills and ability to restore clarity in a team setting.", prompt: "Explain how you resolved a miscommunication on your team or conflict between colleagues." },
  { id: "hr33", week: "HR", title: "Avoiding Overwhelm", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see that you have practical strategies for managing a heavy workload.", prompt: "How do you manage your schedule to avoid feeling overwhelmed by your to-do list?" },
  { id: "hr34", week: "HR", title: "Productivity Tools", scenario: "You're in an HR interview for a campus placement. The interviewer is curious about the specific methods and tools you rely on to stay organized.", prompt: "What routines or productivity tools do you employ to manage your day?" },
  { id: "hr37", week: "HR", title: "Missing a Deadline", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for honesty, accountability, and the ability to learn from mistakes.", prompt: "Tell me about a time you missed a deadline. What did you learn?" },
  { id: "hr39", week: "HR", title: "Handling Confidentiality", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your integrity and ability to handle sensitive information appropriately.", prompt: "Have you ever encountered a situation when you were asked to share confidential or sensitive information? How did you react?" },
  { id: "hr41", week: "HR", title: "Team Environment", scenario: "You're in an HR interview for a campus placement. The interviewer wants to gauge your genuine comfort and enthusiasm for collaborative work.", prompt: "How do you feel about working in a team environment?" },
  { id: "hr48", week: "HR", title: "Strength & Weakness", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for genuine self-assessment, not rehearsed answers.", prompt: "What is your biggest strength? Weakness?" },
  { id: "hr50", week: "HR", title: "Working Overtime", scenario: "You're in an HR interview for a campus placement. The interviewer is gauging your expectations and whether you have a healthy approach to work-life balance.", prompt: "How do you feel about working overtime?" },
  { id: "abap1", week: "ABAP", title: "Tell Me About Yourself", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer opens with a classic introductory question to understand your background and motivation.", prompt: "Tell me about yourself. Structure: Current status, then relevant training or experience, then key achievement, then why this role." },
  { id: "abap3", week: "ABAP", title: "ABAP Cloud Developer Role", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks you to demonstrate your understanding of the modern ABAP development paradigm.", prompt: "What is the ABAP Cloud Developer role? How does it differ from classic ABAP?" },
  { id: "abap10", week: "ABAP", title: "Validations and Determinations in RAP", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer focuses on your understanding of RAP business object behaviour.", prompt: "What are Validations and Determinations in RAP? What is EML?" },
];

// Text variations to try if first attempt fails
const VARIATIONS = [
  (c) => `${c.week === "HR" ? "HR Interview" : "Technical Interview"}: ${c.title}. ${c.scenario} Your task: ${c.prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!`,
  (c) => `Welcome to your ${c.week === "HR" ? "HR interview" : "technical interview"} practice. Today's challenge is: ${c.title}. Here's the situation: ${c.scenario} The question is: ${c.prompt} You have sixty seconds to respond. Speak clearly and stay focused. Press Start Recording when ready. Best of luck!`,
  (c) => `Let's practice for your interview. Challenge: ${c.title}. Imagine this: ${c.scenario} Now, answer this question: ${c.prompt} Remember, you have one minute. Be clear and confident. Hit Start Recording whenever you're ready. You've got this!`,
];

async function generateVoice(text) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const audioPart = parts.find((p) => p.inlineData?.data);
  if (!audioPart?.inlineData?.data) throw new Error("No audio data in response");

  return Buffer.from(audioPart.inlineData.data, "base64");
}

async function generateWithRetry(challenge) {
  const outPath = path.join(OUT_DIR, `${challenge.id}.pcm`);
  if (fs.existsSync(outPath)) {
    console.log(`  ✓ ${challenge.id} — already exists`);
    return true;
  }

  for (let v = 0; v < VARIATIONS.length; v++) {
    const text = VARIATIONS[v](challenge);
    try {
      console.log(`  ⏳ ${challenge.id} — attempt ${v + 1}/3...`);
      const pcm = await generateVoice(text);
      if (pcm.length < 48000) {
        console.log(`  ⚠️  ${challenge.id} — audio too short (${pcm.length} bytes), retrying with variation...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      fs.writeFileSync(outPath, pcm);
      console.log(`  ✅ ${challenge.id} — saved (${(pcm.length / 1024).toFixed(0)} KB)`);
      return true;
    } catch (err) {
      const msg = err.message;
      if (msg.includes("429")) {
        console.log(`  ❌ ${challenge.id} — QUOTA HIT. Stopping.`);
        return "quota";
      }
      console.log(`  ❌ ${challenge.id} — ${msg.slice(0, 80)}, trying variation ${v + 2}...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.log(`  ❌ ${challenge.id} — FAILED all 3 variations`);
  return false;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Process in batches of 5
  const BATCH_SIZE = 5;
  let generated = 0;
  let failed = 0;

  for (let i = 0; i < MISSING.length; i += BATCH_SIZE) {
    const batch = MISSING.slice(i, i + BATCH_SIZE);
    console.log(`\n── Batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.map(c => c.id).join(", ")}) ──`);

    for (const challenge of batch) {
      const result = await generateWithRetry(challenge);
      if (result === "quota") {
        console.log(`\n⛔ Quota exhausted. Generated ${generated} this run, ${failed} failed.`);
        process.exit(0);
      }
      if (result === true) generated++;
      else failed++;

      // 10s delay between calls
      await new Promise(r => setTimeout(r, 10000));
    }

    console.log(`── Batch done. Pausing 15s before next batch... ──`);
    await new Promise(r => setTimeout(r, 15000));
  }

  console.log(`\n✅ Done: ${generated} generated, ${failed} failed`);
}

main();
