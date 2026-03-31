import type { Challenge } from "@/types";

export const HR_CHALLENGES: Challenge[] = [
  // ── Behavioral / Adaptability (Intermediate) ──────────────────────────────
  {
    id: "hr1",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Adapting to Change",
    description: "Describe how you handled a major change in your life or work.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer asks you a behavioral question to assess your adaptability and resilience in the face of change.",
    prompt:
      "Tell me about the biggest change you've had to deal with? How did you adapt to that change?",
    category: "hr",
    evaluationCriteria:
      "Listen for excitement about tackling new challenges and a willingness to leave their comfort zone.",
  },
  {
    id: "hr2",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Adapting to Others",
    description: "Share how you adjusted to a colleague's working style.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to know how flexible you are when collaborating with people who work differently from you.",
    prompt:
      "Tell me about a time when you had to adjust to a colleague's working style in order to complete a project or achieve your outcomes.",
    category: "hr",
    evaluationCriteria:
      "Listen for willingness to be flexible and ability to reflect on what they learned.",
  },
  {
    id: "hr3",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Beyond the Job Description",
    description: "Describe a time you took on a task outside your usual role.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is assessing your willingness to step outside your comfort zone and take on unfamiliar responsibilities.",
    prompt:
      "Recall a time when you were assigned a task outside of your job description. How did you handle the situation? What was the outcome?",
    category: "hr",
    evaluationCriteria:
      "Listen for understanding that their job may evolve and willingness to try something new.",
  },

  // ── Self-awareness / Values (Beginner) ────────────────────────────────────
  {
    id: "hr4",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "What Matters Most",
    description: "Share the three things most important to you in a job.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand your values and what drives you in a professional setting.",
    prompt:
      "What are the three things that are most important to you in a job?",
    category: "hr",
    evaluationCriteria:
      "Listen for alignment between what's most important to them and what the role and company have to offer.",
  },
  {
    id: "hr5",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Beyond the Resume",
    description: "Share something interesting about yourself not on your resume.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to get to know the person behind the resume and discover hidden qualities.",
    prompt:
      "What's the most interesting thing about you that's not on your resume?",
    category: "hr",
    evaluationCriteria:
      "Listen for signs the candidate will bring new experiences and skills to the team.",
  },
  {
    id: "hr6",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Peak Performance",
    description: "Describe a recent time you felt satisfied and productive at work.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand what kind of work energizes you and keeps you engaged.",
    prompt:
      "Tell me about a time in the last week when you've been satisfied, energized, and productive at work. What were you doing?",
    category: "hr",
    evaluationCriteria:
      "Listen for indications that the work environment and day-to-day responsibilities are right for them.",
  },
  {
    id: "hr7",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Why This Company",
    description: "Explain what would make you choose this company over others.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is gauging your genuine interest in the company and whether you've done your research.",
    prompt: "What would make you choose our company over others?",
    category: "hr",
    evaluationCriteria:
      "Listen for thoughtful, honest responses that tell you what they're really thinking.",
  },
  {
    id: "hr8",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Clearing Misconceptions",
    description: "Address the biggest misconception your co-workers have about you.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is testing your self-awareness and ability to reflect honestly on how others perceive you.",
    prompt:
      "What's the biggest misconception your co-workers have about you, and why do they think that?",
    category: "hr",
    evaluationCriteria:
      "Listen for self-reflection and transparency.",
  },

  // ── Teamwork / Collaboration (Intermediate) ──────────────────────────────
  {
    id: "hr9",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Working with Difficult People",
    description: "Describe handling interactions with a difficult colleague.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating your teamwork and collaboration skills, especially under friction.",
    prompt:
      "Give an example of when you had to work with someone who was difficult to get along with. How did you handle interactions with that person?",
    category: "hr",
    evaluationCriteria:
      "Listen for willingness to see things from the other person's perspective.",
  },
  {
    id: "hr10",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Communication Breakdown",
    description: "Share a time someone didn't understand you and how you fixed it.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to see how you adapt your communication when your message isn't getting through.",
    prompt:
      "Tell me about a time when you were communicating with someone and they did not understand you. What did you do?",
    category: "hr",
    evaluationCriteria:
      "Listen for patience and ability to adjust communication style.",
  },
  {
    id: "hr11",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Team Player",
    description: "Share a favourite team experience and your contributions.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is looking for genuine enthusiasm about teamwork and your ability to contribute meaningfully.",
    prompt:
      "Tell me about one of your favourite experiences working with a team and the contributions you made.",
    category: "hr",
    evaluationCriteria:
      "Listen for energy and motivation through teamwork, healthy mix of 'I' and 'we'.",
  },
  {
    id: "hr12",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Ideal Manager",
    description: "Describe the best supervisor you've worked with and why.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand what management style brings out the best in you.",
    prompt:
      "Describe the best partner or supervisor you've worked with. What part of their management style appealed to you?",
    category: "hr",
    evaluationCriteria:
      "Listen for understanding of their own working style.",
  },

  // ── Ownership / Leadership (Advanced) ─────────────────────────────────────
  {
    id: "hr13",
    week: "HR",
    tier: "Advanced",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Owning a Setback",
    description: "Describe a time something significant didn't go according to plan.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is probing your sense of ownership and how you respond when things go wrong.",
    prompt:
      "Tell me about the last time something significant didn't go according to plan at work. What was your role? What was the outcome?",
    category: "hr",
    evaluationCriteria:
      "Listen for thoughtful reflection and strong sense of ownership.",
  },
  {
    id: "hr14",
    week: "HR",
    tier: "Advanced",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Power of Persuasion",
    description: "Share a time you persuaded someone to see things your way.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is assessing your ability to influence others through credibility and evidence.",
    prompt:
      "Describe a situation where you needed to persuade someone to see things your way. What steps did you take? What were the results?",
    category: "hr",
    evaluationCriteria:
      "Listen for credibility and compelling evidence, not acting like they know best.",
  },
  {
    id: "hr15",
    week: "HR",
    tier: "Advanced",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Leading by Example",
    description: "Describe a time when you led by example and its impact.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand your leadership style and awareness of your influence on others.",
    prompt:
      "Tell me about a time when you led by example. What did you do and how did others react?",
    category: "hr",
    evaluationCriteria:
      "Listen for understanding of how their behaviour impacts others.",
  },
  {
    id: "hr16",
    week: "HR",
    tier: "Advanced",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Tough Decisions",
    description: "Describe the toughest decision you had to make recently.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating your decision-making process under pressure and ambiguity.",
    prompt:
      "Tell me about the toughest decision you had to make in the last six months.",
    category: "hr",
    evaluationCriteria:
      "Listen for careful consideration of outcomes and willingness to make final decisions.",
  },
  {
    id: "hr17",
    week: "HR",
    tier: "Advanced",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Selling an Idea",
    description: "Share a time you had to sell an idea to your co-workers.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is assessing your ability to build buy-in and champion ideas effectively.",
    prompt:
      "Have you ever had to 'sell' an idea to your co-workers or group? How did you do it? What were the results?",
    category: "hr",
    evaluationCriteria:
      "Listen for use of proof points and assertiveness without being pushy.",
  },
  {
    id: "hr18",
    week: "HR",
    tier: "Advanced",
    xp: 1000,
    passingScore: 70,
    maxAttempts: 3,
    status: "active",
    title: "Stepping Up",
    description: "Describe handling a problem when your manager was unavailable.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is testing your ability to take initiative and act decisively without overstepping.",
    prompt:
      "Recall a time when your manager was unavailable when a problem arose. How did you handle the situation? Who did you consult with?",
    category: "hr",
    evaluationCriteria:
      "Listen for ability to rise to the occasion without stepping on toes.",
  },

  // ── Growth / Learning (Intermediate) ──────────────────────────────────────
  {
    id: "hr19",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Self-Driven Learning",
    description: "Share a time you voluntarily expanded your knowledge at work.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is looking for evidence of intrinsic motivation and a proactive approach to growth.",
    prompt:
      "Describe a time when you volunteered to expand your knowledge at work, as opposed to being directed to do so.",
    category: "hr",
    evaluationCriteria:
      "Listen for eagerness to learn and willingness to ask for resources.",
  },
  {
    id: "hr20",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Motivation to Move",
    description: "Explain what would motivate you to leave your current role.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand what you're truly seeking in your next opportunity.",
    prompt:
      "What would motivate you to make a move from your current role?",
    category: "hr",
    evaluationCriteria:
      "Listen for investment in growth opportunities rather than immediate payoff.",
  },
  {
    id: "hr21",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Seeking Feedback",
    description: "Describe the last time you asked for direct feedback.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating whether you actively seek improvement and can handle constructive criticism.",
    prompt:
      "When was the last time you asked for direct feedback from a superior? Why?",
    category: "hr",
    evaluationCriteria:
      "Listen for regular feedback requests indicating constant self-improvement.",
  },
  {
    id: "hr22",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Career Achievement",
    description: "Share the biggest career goal you've achieved.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to see what motivates you and whether you set meaningful goals for yourself.",
    prompt: "What's the biggest career goal you've achieved?",
    category: "hr",
    evaluationCriteria:
      "Listen for motivation and drive, taking pride in achievements.",
  },

  // ── Time Management / Organization (Intermediate) ─────────────────────────
  {
    id: "hr23",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Project Planning",
    description: "Describe how you planned and organized a project.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is assessing your organizational skills and ability to manage a project from start to finish.",
    prompt:
      "Tell me about a project that you planned. How did you organize and schedule the tasks?",
    category: "hr",
    evaluationCriteria:
      "Listen for strong self-discipline and methodical approach to deadlines.",
  },
  {
    id: "hr24",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Handling Stress",
    description: "Describe a time you felt stressed and how you managed it.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to know how you cope with pressure and whether you can maintain composure.",
    prompt:
      "Describe a time when you felt stressed or overwhelmed. How did you handle it?",
    category: "hr",
    evaluationCriteria:
      "Listen for planning and prioritization helping them stay calm, plus knowing how to delegate.",
  },
  {
    id: "hr25",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Delegating Effectively",
    description: "Give an example of successfully delegating an important task.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating your ability to trust others and distribute work effectively.",
    prompt:
      "Give an example of a time when you delegated an important task successfully.",
    category: "hr",
    evaluationCriteria:
      "Listen for understanding of how to delegate, clear about instructions, deadlines, expectations.",
  },
  {
    id: "hr26",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Estimating Time",
    description: "Explain how you determine how long a task should take.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand your approach to realistic time estimation and workload management.",
    prompt:
      "How do you determine what amount of time is reasonable for a task?",
    category: "hr",
    evaluationCriteria:
      "Listen for careful thinking about time and seeking a healthy middle ground.",
  },

  // ── Communication (Intermediate) ──────────────────────────────────────────
  {
    id: "hr27",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Successful Presentation",
    description: "Describe a successful presentation you made and why it worked.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating your communication skills and how you prepare for high-stakes speaking situations.",
    prompt:
      "Tell me about a successful presentation you made, and what made it so.",
    category: "hr",
    evaluationCriteria:
      "Listen for clear preparation, audience awareness, and confident delivery.",
  },
  {
    id: "hr28",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Overcoming Resistance",
    description: "Describe convincing someone resistant to an idea or change.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is testing your ability to handle pushback and bring others on board through empathy and evidence.",
    prompt:
      "Describe a time when you had to convince someone resistant to an idea or a change.",
    category: "hr",
    evaluationCriteria:
      "Listen for empathy, persistence, and use of evidence.",
  },
  {
    id: "hr29",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Resolving Miscommunication",
    description: "Explain how you resolved a miscommunication or team conflict.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to assess your mediation skills and ability to restore clarity in a team setting.",
    prompt:
      "Explain how you resolved a miscommunication on your team or conflict between colleagues.",
    category: "hr",
    evaluationCriteria:
      "Listen for mediation skills and focus on resolution.",
  },
  {
    id: "hr30",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Cross-Functional Collaboration",
    description: "Describe working cross-functionally with multiple teams.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating your ability to coordinate across departments and navigate different stakeholders.",
    prompt:
      "Describe a time when you had to work cross-functionally with multiple teams or departments.",
    category: "hr",
    evaluationCriteria:
      "Listen for coordination skills and ability to navigate different stakeholders.",
  },

  // ── Productivity / Daily Habits (Beginner) ────────────────────────────────
  {
    id: "hr31",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Organizing Your Day",
    description: "Walk the interviewer through how you organize your day.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand your daily habits and how you structure your time for productivity.",
    prompt: "Talk to me about your process for organizing your day.",
    category: "hr",
    evaluationCriteria:
      "Listen for structured approach and self-awareness about productivity patterns.",
  },
  {
    id: "hr32",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Competing Deadlines",
    description: "Explain how you balance projects with competing deadlines.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is assessing your ability to prioritize when multiple tasks demand your attention simultaneously.",
    prompt:
      "Tell me how you balance projects with competing deadlines.",
    category: "hr",
    evaluationCriteria:
      "Listen for prioritization skills and ability to communicate tradeoffs.",
  },
  {
    id: "hr33",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Avoiding Overwhelm",
    description: "Share how you manage your schedule to avoid feeling overwhelmed.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to see that you have practical strategies for managing a heavy workload.",
    prompt:
      "How do you manage your schedule to avoid feeling overwhelmed by your to-do list?",
    category: "hr",
    evaluationCriteria:
      "Listen for practical strategies and self-regulation.",
  },
  {
    id: "hr34",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Productivity Tools",
    description: "Share your routines or tools for managing your day.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is curious about the specific methods and tools you rely on to stay organized.",
    prompt:
      "What routines or productivity tools do you employ to manage your day?",
    category: "hr",
    evaluationCriteria:
      "Listen for specific tools/methods and results they produce.",
  },
  {
    id: "hr35",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Minimizing Distractions",
    description: "Explain how you minimize distractions during the workday.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to know if you have deliberate strategies for maintaining focus.",
    prompt: "How do you minimize distractions during the workday?",
    category: "hr",
    evaluationCriteria:
      "Listen for specific, actionable strategies and self-awareness.",
  },
  {
    id: "hr36",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Tackling Unappealing Tasks",
    description: "Describe how you motivate yourself for unpleasant tasks.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is testing your self-discipline and ability to push through work that isn't naturally motivating.",
    prompt:
      "How do you motivate yourself to tackle the least appealing item on your to-do list?",
    category: "hr",
    evaluationCriteria:
      "Listen for self-discipline techniques and positive framing.",
  },
  {
    id: "hr37",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Missing a Deadline",
    description: "Share a time you missed a deadline and what you learned.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is looking for honesty, accountability, and the ability to learn from mistakes.",
    prompt:
      "Tell me about a time you missed a deadline. What did you learn?",
    category: "hr",
    evaluationCriteria:
      "Listen for accountability, honest reflection, and concrete lessons learned.",
  },

  // ── Professionalism / Ethics (Intermediate) ───────────────────────────────
  {
    id: "hr38",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Professionalism in Practice",
    description: "Discuss the most important aspects of professionalism for this role.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating whether you understand the professional standards expected in this industry.",
    prompt:
      "What aspects of professionalism do you believe are most important to this particular role?",
    category: "hr",
    evaluationCriteria:
      "Listen for understanding of role requirements and professional standards.",
  },
  {
    id: "hr39",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Handling Confidentiality",
    description: "Describe handling a request to share confidential information.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is testing your integrity and ability to handle sensitive information appropriately.",
    prompt:
      "Have you ever encountered a situation when you were asked to share confidential or sensitive information? How did you react?",
    category: "hr",
    evaluationCriteria:
      "Listen for integrity and clear boundaries.",
  },
  {
    id: "hr40",
    week: "HR",
    tier: "Intermediate",
    xp: 800,
    passingScore: 65,
    maxAttempts: 3,
    status: "active",
    title: "Addressing Problematic Behavior",
    description: "Describe addressing a coworker's problematic behavior.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to see if you can handle difficult interpersonal situations with courage and tact.",
    prompt:
      "Tell me about a time you had to address problematic behavior from a coworker. What was your approach?",
    category: "hr",
    evaluationCriteria:
      "Listen for courage, tact, and focus on resolution.",
  },

  // ── General / Character (Beginner) ────────────────────────────────────────
  {
    id: "hr41",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Team Environment",
    description: "Share how you feel about working in a team environment.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to gauge your genuine comfort and enthusiasm for collaborative work.",
    prompt: "How do you feel about working in a team environment?",
    category: "hr",
    evaluationCriteria:
      "Listen for genuine enthusiasm and awareness of team dynamics.",
  },
  {
    id: "hr42",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Biggest Problem Solved",
    description: "Describe the most significant problem you solved at work or school.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is assessing your problem-solving ability and the impact you can make.",
    prompt:
      "What is the most significant problem you solved in the learning place/work place?",
    category: "hr",
    evaluationCriteria:
      "Listen for problem-solving process and impact of the solution.",
  },
  {
    id: "hr43",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Learning New Concepts",
    description: "Explain your approach to learning unfamiliar concepts.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand how you tackle unfamiliar territory and build new knowledge.",
    prompt:
      "How to learn new concepts if you are unfamiliar?",
    category: "hr",
    evaluationCriteria:
      "Listen for structured learning approach and resourcefulness.",
  },
  {
    id: "hr44",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Handling Disagreements",
    description: "Explain what you do when team members disagree with you.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is evaluating your openness to feedback and collaborative decision-making approach.",
    prompt:
      "What do you do if team members disagree with your decisions?",
    category: "hr",
    evaluationCriteria:
      "Listen for openness to feedback and collaborative decision-making.",
  },
  {
    id: "hr45",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "No Experience, No Problem",
    description: "Share a time you performed a task without relevant experience.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to see how resourceful and adaptable you are when facing something completely new.",
    prompt:
      "Have you ever performed a task without relevant experience?",
    category: "hr",
    evaluationCriteria:
      "Listen for resourcefulness, learning agility, and outcome focus.",
  },
  {
    id: "hr46",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Giving Negative Feedback",
    description: "Describe a time you gave negative feedback to a colleague.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is testing your ability to deliver difficult messages with empathy and professionalism.",
    prompt:
      "Tell me about when you gave negative feedback to a colleague?",
    category: "hr",
    evaluationCriteria:
      "Listen for empathy, constructiveness, and relationship preservation.",
  },
  {
    id: "hr47",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Five Words",
    description: "Describe yourself in just five words.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants a quick snapshot of your self-awareness and what you consider your defining qualities.",
    prompt: "How would you describe yourself in 5 words?",
    category: "hr",
    evaluationCriteria:
      "Listen for self-awareness, authenticity, and relevant attributes.",
  },
  {
    id: "hr48",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Strength & Weakness",
    description: "Share your biggest strength and weakness honestly.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is looking for genuine self-assessment, not rehearsed answers.",
    prompt: "What is your biggest strength? Weakness?",
    category: "hr",
    evaluationCriteria:
      "Listen for genuine self-assessment and growth awareness.",
  },
  {
    id: "hr49",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Resolving Team Conflicts",
    description: "Explain your approach to resolving team conflicts.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer wants to understand your conflict resolution style and whether you can maintain team harmony.",
    prompt: "How do you resolve team conflicts?",
    category: "hr",
    evaluationCriteria:
      "Listen for mediation approach, fairness, and focus on outcomes.",
  },
  {
    id: "hr50",
    week: "HR",
    tier: "Beginner",
    xp: 500,
    passingScore: 55,
    maxAttempts: 3,
    status: "active",
    title: "Working Overtime",
    description: "Share your honest perspective on working overtime.",
    scenario:
      "You're in an HR interview for a campus placement. The interviewer is gauging your expectations and whether you have a healthy approach to work-life balance.",
    prompt: "How do you feel about working overtime?",
    category: "hr",
    evaluationCriteria:
      "Listen for realistic expectations and work-life balance awareness.",
  },
];
