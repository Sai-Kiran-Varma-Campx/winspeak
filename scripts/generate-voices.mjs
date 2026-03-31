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

  // ── HR Interview Challenges (hr1-hr50) ──────────────────────────────────────
  { id: "hr1", week: "HR", title: "Adapting to Change", scenario: "You're in an HR interview for a campus placement. The interviewer asks you a behavioral question to assess your adaptability and resilience in the face of change.", prompt: "Tell me about the biggest change you've had to deal with? How did you adapt to that change?" },
  { id: "hr2", week: "HR", title: "Adapting to Others", scenario: "You're in an HR interview for a campus placement. The interviewer wants to know how flexible you are when collaborating with people who work differently from you.", prompt: "Tell me about a time when you had to adjust to a colleague's working style in order to complete a project or achieve your outcomes." },
  { id: "hr3", week: "HR", title: "Beyond the Job Description", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your willingness to step outside your comfort zone and take on unfamiliar responsibilities.", prompt: "Recall a time when you were assigned a task outside of your job description. How did you handle the situation? What was the outcome?" },
  { id: "hr4", week: "HR", title: "What Matters Most", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your values and what drives you in a professional setting.", prompt: "What are the three things that are most important to you in a job?" },
  { id: "hr5", week: "HR", title: "Beyond the Resume", scenario: "You're in an HR interview for a campus placement. The interviewer wants to get to know the person behind the resume and discover hidden qualities.", prompt: "What's the most interesting thing about you that's not on your resume?" },
  { id: "hr6", week: "HR", title: "Peak Performance", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand what kind of work energizes you and keeps you engaged.", prompt: "Tell me about a time in the last week when you've been satisfied, energized, and productive at work. What were you doing?" },
  { id: "hr7", week: "HR", title: "Why This Company", scenario: "You're in an HR interview for a campus placement. The interviewer is gauging your genuine interest in the company and whether you've done your research.", prompt: "What would make you choose our company over others?" },
  { id: "hr8", week: "HR", title: "Clearing Misconceptions", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your self-awareness and ability to reflect honestly on how others perceive you.", prompt: "What's the biggest misconception your co-workers have about you, and why do they think that?" },
  { id: "hr9", week: "HR", title: "Working with Difficult People", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating your teamwork and collaboration skills, especially under friction.", prompt: "Give an example of when you had to work with someone who was difficult to get along with. How did you handle interactions with that person?" },
  { id: "hr10", week: "HR", title: "Communication Breakdown", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see how you adapt your communication when your message isn't getting through.", prompt: "Tell me about a time when you were communicating with someone and they did not understand you. What did you do?" },
  { id: "hr11", week: "HR", title: "Team Player", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for genuine enthusiasm about teamwork and your ability to contribute meaningfully.", prompt: "Tell me about one of your favourite experiences working with a team and the contributions you made." },
  { id: "hr12", week: "HR", title: "Ideal Manager", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand what management style brings out the best in you.", prompt: "Describe the best partner or supervisor you've worked with. What part of their management style appealed to you?" },
  { id: "hr13", week: "HR", title: "Owning a Setback", scenario: "You're in an HR interview for a campus placement. The interviewer is probing your sense of ownership and how you respond when things go wrong.", prompt: "Tell me about the last time something significant didn't go according to plan at work. What was your role? What was the outcome?" },
  { id: "hr14", week: "HR", title: "Power of Persuasion", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your ability to influence others through credibility and evidence.", prompt: "Describe a situation where you needed to persuade someone to see things your way. What steps did you take? What were the results?" },
  { id: "hr15", week: "HR", title: "Leading by Example", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your leadership style and awareness of your influence on others.", prompt: "Tell me about a time when you led by example. What did you do and how did others react?" },
  { id: "hr16", week: "HR", title: "Tough Decisions", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating your decision-making process under pressure and ambiguity.", prompt: "Tell me about the toughest decision you had to make in the last six months." },
  { id: "hr17", week: "HR", title: "Selling an Idea", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your ability to build buy-in and champion ideas effectively.", prompt: "Have you ever had to 'sell' an idea to your co-workers or group? How did you do it? What were the results?" },
  { id: "hr18", week: "HR", title: "Stepping Up", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your ability to take initiative and act decisively without overstepping.", prompt: "Recall a time when your manager was unavailable when a problem arose. How did you handle the situation? Who did you consult with?" },
  { id: "hr19", week: "HR", title: "Self-Driven Learning", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for evidence of intrinsic motivation and a proactive approach to growth.", prompt: "Describe a time when you volunteered to expand your knowledge at work, as opposed to being directed to do so." },
  { id: "hr20", week: "HR", title: "Motivation to Move", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand what you're truly seeking in your next opportunity.", prompt: "What would motivate you to make a move from your current role?" },
  { id: "hr21", week: "HR", title: "Seeking Feedback", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating whether you actively seek improvement and can handle constructive criticism.", prompt: "When was the last time you asked for direct feedback from a superior? Why?" },
  { id: "hr22", week: "HR", title: "Career Achievement", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see what motivates you and whether you set meaningful goals for yourself.", prompt: "What's the biggest career goal you've achieved?" },
  { id: "hr23", week: "HR", title: "Project Planning", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your organizational skills and ability to manage a project from start to finish.", prompt: "Tell me about a project that you planned. How did you organize and schedule the tasks?" },
  { id: "hr24", week: "HR", title: "Handling Stress", scenario: "You're in an HR interview for a campus placement. The interviewer wants to know how you cope with pressure and whether you can maintain composure.", prompt: "Describe a time when you felt stressed or overwhelmed. How did you handle it?" },
  { id: "hr25", week: "HR", title: "Delegating Effectively", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating your ability to trust others and distribute work effectively.", prompt: "Give an example of a time when you delegated an important task successfully." },
  { id: "hr26", week: "HR", title: "Estimating Time", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your approach to realistic time estimation and workload management.", prompt: "How do you determine what amount of time is reasonable for a task?" },
  { id: "hr27", week: "HR", title: "Successful Presentation", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating your communication skills and how you prepare for high-stakes speaking situations.", prompt: "Tell me about a successful presentation you made, and what made it so." },
  { id: "hr28", week: "HR", title: "Overcoming Resistance", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your ability to handle pushback and bring others on board through empathy and evidence.", prompt: "Describe a time when you had to convince someone resistant to an idea or a change." },
  { id: "hr29", week: "HR", title: "Resolving Miscommunication", scenario: "You're in an HR interview for a campus placement. The interviewer wants to assess your mediation skills and ability to restore clarity in a team setting.", prompt: "Explain how you resolved a miscommunication on your team or conflict between colleagues." },
  { id: "hr30", week: "HR", title: "Cross-Functional Collaboration", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating your ability to coordinate across departments and navigate different stakeholders.", prompt: "Describe a time when you had to work cross-functionally with multiple teams or departments." },
  { id: "hr31", week: "HR", title: "Organizing Your Day", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your daily habits and how you structure your time for productivity.", prompt: "Talk to me about your process for organizing your day." },
  { id: "hr32", week: "HR", title: "Competing Deadlines", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your ability to prioritize when multiple tasks demand your attention simultaneously.", prompt: "Tell me how you balance projects with competing deadlines." },
  { id: "hr33", week: "HR", title: "Avoiding Overwhelm", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see that you have practical strategies for managing a heavy workload.", prompt: "How do you manage your schedule to avoid feeling overwhelmed by your to-do list?" },
  { id: "hr34", week: "HR", title: "Productivity Tools", scenario: "You're in an HR interview for a campus placement. The interviewer is curious about the specific methods and tools you rely on to stay organized.", prompt: "What routines or productivity tools do you employ to manage your day?" },
  { id: "hr35", week: "HR", title: "Minimizing Distractions", scenario: "You're in an HR interview for a campus placement. The interviewer wants to know if you have deliberate strategies for maintaining focus.", prompt: "How do you minimize distractions during the workday?" },
  { id: "hr36", week: "HR", title: "Tackling Unappealing Tasks", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your self-discipline and ability to push through work that isn't naturally motivating.", prompt: "How do you motivate yourself to tackle the least appealing item on your to-do list?" },
  { id: "hr37", week: "HR", title: "Missing a Deadline", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for honesty, accountability, and the ability to learn from mistakes.", prompt: "Tell me about a time you missed a deadline. What did you learn?" },
  { id: "hr38", week: "HR", title: "Professionalism in Practice", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating whether you understand the professional standards expected in this industry.", prompt: "What aspects of professionalism do you believe are most important to this particular role?" },
  { id: "hr39", week: "HR", title: "Handling Confidentiality", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your integrity and ability to handle sensitive information appropriately.", prompt: "Have you ever encountered a situation when you were asked to share confidential or sensitive information? How did you react?" },
  { id: "hr40", week: "HR", title: "Addressing Problematic Behavior", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see if you can handle difficult interpersonal situations with courage and tact.", prompt: "Tell me about a time you had to address problematic behavior from a coworker. What was your approach?" },
  { id: "hr41", week: "HR", title: "Team Environment", scenario: "You're in an HR interview for a campus placement. The interviewer wants to gauge your genuine comfort and enthusiasm for collaborative work.", prompt: "How do you feel about working in a team environment?" },
  { id: "hr42", week: "HR", title: "Biggest Problem Solved", scenario: "You're in an HR interview for a campus placement. The interviewer is assessing your problem-solving ability and the impact you can make.", prompt: "What is the most significant problem you solved in the learning place/work place?" },
  { id: "hr43", week: "HR", title: "Learning New Concepts", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand how you tackle unfamiliar territory and build new knowledge.", prompt: "How to learn new concepts if you are unfamiliar?" },
  { id: "hr44", week: "HR", title: "Handling Disagreements", scenario: "You're in an HR interview for a campus placement. The interviewer is evaluating your openness to feedback and collaborative decision-making approach.", prompt: "What do you do if team members disagree with your decisions?" },
  { id: "hr45", week: "HR", title: "No Experience, No Problem", scenario: "You're in an HR interview for a campus placement. The interviewer wants to see how resourceful and adaptable you are when facing something completely new.", prompt: "Have you ever performed a task without relevant experience?" },
  { id: "hr46", week: "HR", title: "Giving Negative Feedback", scenario: "You're in an HR interview for a campus placement. The interviewer is testing your ability to deliver difficult messages with empathy and professionalism.", prompt: "Tell me about when you gave negative feedback to a colleague?" },
  { id: "hr47", week: "HR", title: "Five Words", scenario: "You're in an HR interview for a campus placement. The interviewer wants a quick snapshot of your self-awareness and what you consider your defining qualities.", prompt: "How would you describe yourself in 5 words?" },
  { id: "hr48", week: "HR", title: "Strength & Weakness", scenario: "You're in an HR interview for a campus placement. The interviewer is looking for genuine self-assessment, not rehearsed answers.", prompt: "What is your biggest strength? Weakness?" },
  { id: "hr49", week: "HR", title: "Resolving Team Conflicts", scenario: "You're in an HR interview for a campus placement. The interviewer wants to understand your conflict resolution style and whether you can maintain team harmony.", prompt: "How do you resolve team conflicts?" },
  { id: "hr50", week: "HR", title: "Working Overtime", scenario: "You're in an HR interview for a campus placement. The interviewer is gauging your expectations and whether you have a healthy approach to work-life balance.", prompt: "How do you feel about working overtime?" },

  // ── ABAP Technical Interview Challenges (abap1-abap12) ──────────────────────
  { id: "abap1", week: "ABAP", title: "Tell Me About Yourself", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer opens with a classic introductory question to understand your background and motivation.", prompt: "Tell me about yourself. Structure: Current status (10 sec) \u2192 Relevant training/experience (30 sec) \u2192 Key achievement (20 sec) \u2192 Why this role (10 sec)." },
  { id: "abap2", week: "ABAP", title: "Why SAP ABAP?", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer wants to understand why you chose ABAP over other technology stacks.", prompt: "Why SAP ABAP as your specialisation?" },
  { id: "abap3", week: "ABAP", title: "ABAP Cloud Developer Role", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks you to demonstrate your understanding of the modern ABAP development paradigm.", prompt: "What is the ABAP Cloud Developer role? How does it differ from classic ABAP?" },
  { id: "abap4", week: "ABAP", title: "Internal Table Types", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer tests your understanding of core ABAP data structures.", prompt: "Compare STANDARD, SORTED and HASHED internal table types." },
  { id: "abap5", week: "ABAP", title: "Three-Table JOIN", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer gives you a whiteboard scenario involving multi-table data retrieval.", prompt: "Write a SELECT with an INNER JOIN across three tables. What rules must you follow?" },
  { id: "abap6", week: "ABAP", title: "OOP in ABAP", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer probes your object-oriented programming knowledge in the ABAP context.", prompt: "What are the four pillars of OOP in ABAP? Explain SUPER and REDEFINITION." },
  { id: "abap7", week: "ABAP", title: "CDS Virtual Data Model", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks about the data modelling strategy used across S/4HANA.", prompt: "What is the CDS Virtual Data Model (VDM) and its three layers?" },
  { id: "abap8", week: "ABAP", title: "FOR ALL ENTRIES IN Risk", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer tests your awareness of a classic ABAP performance pitfall.", prompt: "What is the critical risk of FOR ALL ENTRIES IN and how do you mitigate it?" },
  { id: "abap9", week: "ABAP", title: "ABAP Exception Classes", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer digs into your error handling strategy and exception class design.", prompt: "What are the three ABAP exception base classes and when do you use each?" },
  { id: "abap10", week: "ABAP", title: "Validations and Determinations in RAP", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer focuses on your understanding of RAP business object behaviour.", prompt: "What are Validations and Determinations in RAP? What is EML?" },
  { id: "abap11", week: "ABAP", title: "AUTHORITY-CHECK vs CDS Access Control", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer asks about authorisation approaches in classic versus modern ABAP.", prompt: "How does AUTHORITY-CHECK differ from CDS Access Control (DCL)?" },
  { id: "abap12", week: "ABAP", title: "Optimistic Locking in RAP", scenario: "You're in a technical interview for an SAP ABAP Cloud Developer role. The interviewer tests your understanding of concurrency control in the RAP framework.", prompt: "What is Optimistic Locking in RAP and how is ETag implemented?" },
];

function buildCoachScript(c) {
  const prefix = c.week === "HR" ? "HR Interview" : c.week === "ABAP" ? "Technical Interview" : c.week;
  return `${prefix}: ${c.title}. ${c.scenario} Your task: ${c.prompt} You have up to 60 seconds. Speak clearly, stay on topic. Tap Start Recording when you're ready. Good luck!`;
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
