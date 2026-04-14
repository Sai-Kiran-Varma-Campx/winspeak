import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "voices", "school");

// Read from .env file
const ROOT = path.join(__dirname, "..");
try {
  const envContent = fs.readFileSync(path.join(ROOT, ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) process.env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
} catch {}
const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) { console.error("❌ Set VITE_GEMINI_API_KEY in .env"); process.exit(1); }
const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const ITEMS = [
  {
    id: "tedlets_1",
    text: "Hello! Are you ready for your talk? Today you will tell us about your favourite fruit. Say what it is, what it looks or tastes like, and why you like it. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "tedlets_2",
    text: "Hello! Time for your talk! Today you will tell us about an amazing animal. Say what animal it is, where it lives, and one cool thing it can do. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "tedlets_3",
    text: "Hello! Time for your talk! Today you will tell us about a cool vehicle. Say what it is called, where it goes, and why you think it is exciting. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "tedlets_4",
    text: "Hello! Time for your talk! Today you will tell us about your favourite character. Say who the character is, what they do, and why you like them. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "interview_discussion_2",
    text: "Hello! Here is your speaking challenge. You need to suggest setting up a lost and found box in your class. Tell your friends why it helps and how they can use it. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "interview_discussion_4",
    text: "Hello! Here is your speaking challenge. You have an idea to help students move between activities in class. Tell your friends why it matters and how everyone can follow it. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "voice_for_change_1",
    text: "Hello! Are you ready? Here is your speaking challenge. You need to talk about protecting trees. Tell your classmates why trees are important and how students can help protect them. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "voice_for_change_3",
    text: "Hello! Are you ready? Here is your speaking challenge. You want to keep parks clean. Tell your classmates the steps to keep parks clean and how people can take part. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "voice_for_change_5",
    text: "Hello! Are you ready? Here is your speaking challenge. You want to encourage exercise. Tell your classmates why exercise is good and how others can join in. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "podcast_playground_2",
    text: "Hello! Time for your podcast! Today you will share a lesson you found interesting. Tell your listeners what you learned and why it stood out to you. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
  {
    id: "student_council_4",
    text: "Hello! Here is your speaking challenge. You need to suggest a peer mentoring system for your school. Tell the council how it would work, what roles are needed, and why it would help. Speak nice and clearly. Tap Start Recording when you are ready!",
  },
];

async function gen(item) {
  console.log(`  ⏳ ${item.id}...`);
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: item.text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
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
  if (!audioPart?.inlineData?.data) throw new Error("No audio data");

  const pcm = Buffer.from(audioPart.inlineData.data, "base64");
  fs.writeFileSync(path.join(OUT_DIR, `${item.id}.pcm`), pcm);
  console.log(`  ✅ ${item.id} — saved (${(pcm.length / 1024).toFixed(0)} KB)`);
}

(async () => {
  for (const item of ITEMS) {
    try {
      await gen(item);
    } catch (e) {
      console.error(`  ❌ ${item.id} — ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 8000));
  }
  console.log("\nDone!");
})();
