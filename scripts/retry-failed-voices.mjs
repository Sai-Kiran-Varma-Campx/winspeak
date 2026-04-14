import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "voices", "school");

const API_KEY = "AIzaSyBTPmnGkkHDGZxrYZBcz9QTt2G1OcT0XM8";
const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const ITEMS = [
  {
    id: "voice_for_change_1",
    text: "Hello there! Are you ready? Here is your speaking challenge. You need to design a campaign to protect trees. Tell your classmates why protecting trees is important and how students can join your campaign. Take your time, speak nice and clearly. Tap Start Recording when you are ready. You have got this!",
  },
  {
    id: "student_council_4",
    text: "Hello there! Are you ready? Here is your speaking challenge. You need to propose a peer mentoring system for your school. Explain how it would work, what roles are involved, and what the benefits would be. Take your time, speak nice and clearly. Tap Start Recording when you are ready. You have got this!",
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
