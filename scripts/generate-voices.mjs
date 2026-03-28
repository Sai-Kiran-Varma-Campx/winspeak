/**
 * Generate static coach voice PCM files for all challenges.
 * Run: node scripts/generate-voices.mjs
 * Requires GEMINI_API_KEY env var or reads from .env
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "voices");

// Read API key from .env
const envFile = fs.readFileSync(path.join(ROOT, ".env"), "utf-8");
const apiKeyMatch = envFile.match(/VITE_GEMINI_API_KEY=(.+)/);
const API_KEY = process.env.GEMINI_API_KEY || apiKeyMatch?.[1]?.trim() || "";

if (!API_KEY) {
  console.error("No GEMINI_API_KEY found");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const CHALLENGES = [
  { id: "c1", week: "W1", title: "The Self-Introduction", scenario: "It's the first day of a new semester. Your professor asks everyone to stand up and introduce themselves to the class — who you are, what you're studying, and what you're passionate about. 40 students are watching. You have 60 seconds.", prompt: "Introduce yourself confidently. In under 60 seconds: who you are, what you study, what drives you, and one interesting thing about yourself. Make people want to know you." },
  { id: "c2", week: "W2", title: "Explain a Concept", scenario: "Your classmate missed an important lecture and asks you to explain the key concept before tomorrow's quiz. They're confused and short on time. You need to break it down simply and clearly.", prompt: "Pick any topic you know well and explain it as if teaching someone who has never heard of it. Be clear, structured, and engaging. You have 60 seconds." },
  { id: "c3", week: "W3", title: "Group Project Leader", scenario: "Your group of 5 can't agree on a direction for the final project. Two members want to take an easy route, one doesn't care, and one has a competing idea. You believe your plan is the strongest. The professor gave you 10 minutes to decide.", prompt: "Make the case for your project idea. Address the concerns, explain why your plan is the best path, and rally the group behind it. Be persuasive but respectful." },
  { id: "c4", week: "W4", title: "Debate Defense", scenario: "You're in a class debate. Your opponent just delivered a compelling argument that got the audience nodding. The moderator turns to you: 'You have 60 seconds to respond.' The room is waiting.", prompt: "Counter the opposing argument effectively. Acknowledge their point, then present your rebuttal with evidence and logic. Stay composed and persuasive." },
  { id: "c5", week: "W5", title: "Presentation Under Pressure", scenario: "You're presenting your semester research project to the class. Your laptop just froze — slides are gone. The professor says: 'That's fine, just walk us through it verbally.' 30 students and your professor are watching. Your grade depends on this.", prompt: "Deliver your research summary without slides. State your topic, key findings, why it matters, and your conclusion. Be clear and confident under pressure." },
  { id: "c6", week: "W6", title: "Difficult Conversation", scenario: "Your group project is due in a week. One teammate has missed every meeting and hasn't done their part. The rest of the group is frustrated. You've been chosen to talk to them. You want to be honest but not burn the relationship.", prompt: "Have the conversation. Address the problem directly, explain the impact on the team, and propose a way forward. Be firm but fair." },
  { id: "c7", week: "W7", title: "Tough Q&A", scenario: "You just finished presenting your thesis argument. The professor leans forward: 'I don't buy it. Your methodology has a clear flaw and your sample size is too small. Convince me why your conclusions still hold.' The class goes silent.", prompt: "Defend your position under academic scrutiny. Acknowledge the limitation, explain why your findings are still valid, and show the depth of your understanding." },
  { id: "c8", week: "W8", title: "Impromptu Speech", scenario: "At a college event, the host unexpectedly calls you up: 'We'd love to hear from one of our top students. Come share what you've learned this year.' 200 people in the auditorium. No prep. No notes. Just you and the mic.", prompt: "Deliver a compelling impromptu speech about your college journey, a key lesson you've learned, or something you're passionate about. Make it memorable." },
  { id: "c9", week: "W9", title: "The Final Showcase", scenario: "End-of-year showcase. A panel of 3 professors and 2 industry professionals will evaluate your capstone project. You have 60 seconds for your closing statement. Other students presented strong work. You need to stand out.", prompt: "Deliver your closing statement. Summarize your project's impact, what makes it unique, what you learned, and end with a line that makes the panel remember you." },
  { id: "c10", week: "W10", title: "One App to Delete", scenario: "You're in a casual discussion circle with classmates. The icebreaker question is: 'If you had to permanently delete one app from your phone, which would it be and why?' Everyone's listening — make your answer interesting and honest.", prompt: "Pick one app you'd delete from your phone and explain why. Be specific — what would you gain by removing it? Make your reasoning engaging and relatable." },
  { id: "c11", week: "W11", title: "The Ideal Weekend", scenario: "Your English class is doing a speaking exercise. The prompt is simple: 'Describe your ideal weekend.' But the catch — you need to make it vivid enough that the class can picture it. No boring lists. Paint a scene.", prompt: "Describe your ideal weekend in 60 seconds. Be vivid and specific — where are you, what are you doing, who are you with? Make the listener feel like they're there." },
  { id: "c12", week: "W12", title: "Change One Rule", scenario: "The student council is collecting proposals. Each student gets 60 seconds at the mic to pitch one rule change to the college administration. The dean is in the audience. This is your chance to be heard.", prompt: "Propose one rule change for your college. State the current rule, why it's a problem, what you'd change, and how it would improve student life. Be persuasive." },
  { id: "c13", week: "W13", title: "Recommend a Habit", scenario: "A junior student asks you: 'What's one productivity habit or tool that actually works?' They're overwhelmed with college workload and looking for real, practical advice — not generic tips from the internet.", prompt: "Recommend one productivity tool or habit that you genuinely use. Explain what it is, how you use it, and why it works for you. Be authentic — no generic advice." },
  { id: "c14", week: "W14", title: "60-Second VC Pitch", scenario: "You're at a startup networking event. A well-known venture capitalist is about to leave — you catch them at the elevator. They say: 'You've got 60 seconds. What's your idea?' This is your one shot. No slides, no deck, just your words.", prompt: "Deliver a 60-second elevator pitch for a startup idea (real or imagined). Cover the problem, your solution, why now, your traction or vision, and end with a compelling ask. Be concise, confident, and make the investor want to hear more." },
];

function buildCoachScript(c) {
  return `${c.week}: ${c.title}. ${c.scenario} Your task: ${c.prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!`;
}

async function generateVoice(text) {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Charon" },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }

  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const audioPart = parts.find((p) => p.inlineData?.data);

  if (!audioPart?.inlineData?.data) {
    throw new Error("No audio data in response");
  }

  return Buffer.from(audioPart.inlineData.data, "base64");
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;

  for (const challenge of CHALLENGES) {
    const outPath = path.join(OUT_DIR, `${challenge.id}.pcm`);

    // Skip if already generated
    if (fs.existsSync(outPath)) {
      console.log(`✓ ${challenge.id} — already exists, skipping`);
      skipped++;
      continue;
    }

    console.log(`⏳ ${challenge.id} — generating (${MODEL})...`);
    try {
      const script = buildCoachScript(challenge);
      const pcm = await generateVoice(script);
      fs.writeFileSync(outPath, pcm);
      console.log(`✅ ${challenge.id} — saved (${(pcm.length / 1024).toFixed(0)} KB)`);
      generated++;

      // 8s delay between calls — RPM limit is 10, stay well under
      await new Promise((r) => setTimeout(r, 8000));
    } catch (err) {
      console.error(`❌ ${challenge.id} — failed: ${err.message}`);
    }
  }

  console.log(`\nDone: ${generated} generated, ${skipped} skipped`);
}

main();
