/**
 * Generate kid-friendly coach voice PCM files for all 35 school questions.
 * Uses "Kore" voice — warm, friendly, perfect for children.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "voices", "school");

const API_KEY = "AIzaSyBTPmnGkkHDGZxrYZBcz9QTt2G1OcT0XM8";

const MODEL = "gemini-2.5-flash-preview-tts";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const QUESTIONS = [
  { id: "circletime_1", title: "My Favourite Toy", prompt: "Show or imagine your favourite toy. Say what it is and one thing you like doing with it.", scenario: "It's circle time. Everyone is sitting on the carpet listening to you." },
  { id: "circletime_2", title: "Breakfast Talk", prompt: "Talk about what you eat in the morning and say one reason you like it.", scenario: "It's circle time. Share with your friends." },
  { id: "circletime_3", title: "A Sound I Hear", prompt: "Talk about a sound you hear (at home or outside) and show how it sounds using your voice.", scenario: "It's circle time. Everyone is listening." },
  { id: "circletime_4", title: "On My Way to School", prompt: "Describe one thing you saw on your way to school and say what colour or shape it was.", scenario: "It's circle time. Tell your friends what you noticed." },
  { id: "circletime_5", title: "My Favourite Place", prompt: "Name your favourite place in your home and say one thing you do there.", scenario: "It's circle time. Share with your friends in the circle." },
  { id: "building_talks_1", title: "Build a House", prompt: "Build a house using blocks. Tell the class what it is, which parts you made first and next, and who can live in it.", scenario: "You just finished building something amazing. Tell the class about it." },
  { id: "building_talks_2", title: "Build a Bridge", prompt: "Build a bridge. Explain what it is for, how you made it stay up, and why the animals need it.", scenario: "You just finished building something. Explain it to the class." },
  { id: "building_talks_3", title: "Build a Tower", prompt: "Build a tower. Say what blocks or shapes you used, how you built it step by step, and why you wanted it to be tall.", scenario: "Show and tell time. Describe your tower." },
  { id: "building_talks_4", title: "Build a Parking Area", prompt: "Build a parking area or garage. Explain what you made, where the cars go, and how you built the different parts.", scenario: "You built something for the toy cars. Tell everyone about it." },
  { id: "building_talks_5", title: "Build a Bed for Teddy", prompt: "Build a bed or sleeping place for a teddy. Tell the class what it is, how you made it, and why it is good for resting.", scenario: "Teddy needs a place to sleep. Explain what you built." },
  { id: "tedlets_1", title: "My Favourite Fruit", prompt: "Bring the fruit, a picture, or a drawing. Tell us what it is, what it looks or tastes like, and why you like it.", scenario: "You're giving a 1-minute talk to your class using a prop or picture." },
  { id: "tedlets_2", title: "An Amazing Animal", prompt: "Use a toy, mask, or picture. Say what animal it is, where it lives, and one thing it can do well.", scenario: "It's your turn for a TEDlet talk. Use your prop and speak clearly." },
  { id: "tedlets_3", title: "A Cool Vehicle", prompt: "Bring a toy or drawing. Explain what it is called, where it goes, and why you find it exciting or useful.", scenario: "Show your prop and give your 1-minute talk." },
  { id: "tedlets_4", title: "My Favourite Character", prompt: "Use a book, picture, or drawing. Tell us who the character is, what they do, and why you like them.", scenario: "Present your character to the class in a TEDlet talk." },
  { id: "tedlets_5", title: "A Useful Object", prompt: "Bring the object or a picture. Explain what it is, how you use it, and why it helps you in class.", scenario: "It's your 1-minute talk. Show and explain your object." },
  { id: "interview_discussion_1", title: "Keep the Room Clean", prompt: "Imagine starting a class effort to keep the room clean — explain why it matters and how your classmates can help.", scenario: "You're speaking to your peers about a community project you care about." },
  { id: "interview_discussion_2", title: "Lost-and-Found Box", prompt: "Propose setting up a lost-and-found box in class — explain why it helps and how classmates can use it.", scenario: "You're advocating for a project that helps everyone." },
  { id: "interview_discussion_3", title: "Sharing Books", prompt: "Suggest sharing books among classmates — explain why it helps and how others can join in.", scenario: "Tell your class about your idea and why they should support it." },
  { id: "interview_discussion_4", title: "Moving Between Activities", prompt: "Present an idea to improve how students move between activities in class — explain why it matters and how classmates can follow it together.", scenario: "You have an idea to make the classroom work better." },
  { id: "interview_discussion_5", title: "Welcoming New Students", prompt: "Encourage welcoming new students — explain why it matters and how classmates can help.", scenario: "Speak to your class about making everyone feel included." },
  { id: "voice_for_change_1", title: "Protect Trees", prompt: "Design a campaign to protect trees — explain why it matters and how students can join.", scenario: "You're leading a campaign and speaking to your class about a cause you care about." },
  { id: "voice_for_change_2", title: "Avoid Food Waste", prompt: "Create an idea to avoid food waste — describe what to do and how others can participate.", scenario: "Present your campaign idea to your classmates and parents." },
  { id: "voice_for_change_3", title: "Keep Parks Clean", prompt: "Plan a campaign to keep parks clean — explain steps and how people can take part.", scenario: "You're speaking at a school assembly about your campaign." },
  { id: "voice_for_change_4", title: "Reduce Noise", prompt: "Suggest a campaign to reduce noise in shared spaces — describe what actions to take and how to spread awareness.", scenario: "Present your campaign to the school council." },
  { id: "voice_for_change_5", title: "Encourage Exercise", prompt: "Create a campaign to encourage exercise — explain what actions to promote and how others can join.", scenario: "Speak to your class about why this matters." },
  { id: "podcast_playground_1", title: "A Group Game", prompt: "Record an episode about a group game you enjoy — explain how it is played and why it is fun.", scenario: "You're recording a mini-podcast episode on a topic you love." },
  { id: "podcast_playground_2", title: "An Interesting Lesson", prompt: "Share a lesson you found interesting — describe what you learned and why it stood out.", scenario: "Script and record your podcast episode." },
  { id: "podcast_playground_3", title: "A Competition", prompt: "Create a podcast about a competition you experienced — explain what happened and what you learned.", scenario: "You're the host of your own podcast. Tell the story." },
  { id: "podcast_playground_4", title: "A Creative Activity", prompt: "Record about a creative activity you completed — describe the steps and the result.", scenario: "Your podcast listeners want to hear about what you made." },
  { id: "podcast_playground_5", title: "Something in Nature", prompt: "Create a podcast about something in nature that amazes you — describe what it is and explain what you find most surprising about it.", scenario: "Record a nature episode for your podcast." },
  { id: "student_council_1", title: "Propose a New Club", prompt: "Propose starting a new club — explain its purpose, activities, and benefits.", scenario: "You're giving a speech at a student council meeting." },
  { id: "student_council_2", title: "Improve Homework", prompt: "Suggest improvements to the homework system — describe the change and expected outcome.", scenario: "Present your proposal to the student council." },
  { id: "student_council_3", title: "Change Classroom Rules", prompt: "Recommend changes to classroom rules — present two improvements, why they are needed, and how you would respond to a disagreement.", scenario: "Deliver your speech and handle a rebuttal." },
  { id: "student_council_4", title: "Peer Mentoring", prompt: "Propose a peer mentoring system — explain how it works, roles involved, and benefits.", scenario: "Present your policy to the school council." },
  { id: "student_council_5", title: "A School Event", prompt: "Present a school event idea — describe the plan, roles, expected outcome, and answer one possible peer question.", scenario: "Pitch your event idea and handle questions." },
];

function buildCoachScript(q) {
  return `Hello there! Are you ready for a fun speaking challenge? Here it is! ${q.scenario} ${q.prompt} Take your time, speak nice and clearly, and remember, you're doing amazing! When you're ready, tap the Start Recording button. You've got this!`;
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
            prebuiltVoiceConfig: { voiceName: "Kore" },
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
  let failed = 0;

  console.log(`\n🎙  Generating kid-friendly voices for ${QUESTIONS.length} questions...\n`);

  for (const q of QUESTIONS) {
    const outPath = path.join(OUT_DIR, `${q.id}.pcm`);

    if (fs.existsSync(outPath)) {
      console.log(`  ✓ ${q.id} — already exists, skipping`);
      skipped++;
      continue;
    }

    console.log(`  ⏳ ${q.id} — "${q.title}"...`);
    try {
      const script = buildCoachScript(q);
      const pcm = await generateVoice(script);
      fs.writeFileSync(outPath, pcm);
      console.log(`  ✅ ${q.id} — saved (${(pcm.length / 1024).toFixed(0)} KB)`);
      generated++;

      await new Promise((r) => setTimeout(r, 8000));
    } catch (err) {
      console.error(`  ❌ ${q.id} — failed: ${err.message}`);
      failed++;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  console.log(`\n📊 Results: ${generated} generated, ${skipped} skipped, ${failed} failed`);
  console.log(`📁 Files saved to: ${OUT_DIR}\n`);

  if (failed > 0) {
    console.log("💡 Re-run the script to retry failed ones (existing files are skipped).\n");
  }
}

main();
