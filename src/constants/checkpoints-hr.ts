// ── Evaluation: per-challenge required checkpoints for HR challenges ─────────
// Missing checkpoints -> Relevancy capped at 60, Structure at 65.
// Missing >half -> Relevancy capped at 45.

export const HR_CHECKPOINTS: Record<string, string[]> = {
  // ── Behavioral / Adaptability (Intermediate) ──────────────────────────────
  hr1: [
    "Describe a specific, significant change they experienced",
    "Explain concrete steps taken to adapt to the change",
    "Show excitement or willingness to tackle new challenges",
    "Demonstrate leaving their comfort zone",
    "Reflect on positive outcomes or personal growth from the experience",
  ],
  hr2: [
    "Identify a specific colleague and their different working style",
    "Explain adjustments made to accommodate the difference",
    "Show willingness to be flexible rather than insisting on their own way",
    "Describe the project outcome or achievement",
    "Reflect on what they learned from the experience",
  ],
  hr3: [
    "Describe the specific task that was outside their job description",
    "Show willingness to take on the unfamiliar responsibility",
    "Explain how they approached learning or executing the new task",
    "Share the outcome or result of their effort",
    "Demonstrate understanding that roles can evolve",
  ],

  // ── Self-awareness / Values (Beginner) ────────────────────────────────────
  hr4: [
    "Clearly name three specific things important to them in a job",
    "Explain why each factor matters to them personally",
    "Show alignment between their values and professional goals",
    "Demonstrate thoughtfulness rather than giving generic answers",
  ],
  hr5: [
    "Share something genuinely interesting and unique",
    "Go beyond typical resume-worthy achievements",
    "Show personality and authenticity",
    "Connect the fact to skills or perspectives they bring to a team",
  ],
  hr6: [
    "Describe a specific, recent situation where they felt energized",
    "Identify what type of work was involved",
    "Explain why it was satisfying and productive",
    "Show self-awareness about what environments suit them",
  ],
  hr7: [
    "Demonstrate knowledge of the company or role",
    "Give thoughtful, honest reasons for their interest",
    "Show alignment between their goals and the company's offerings",
    "Avoid generic or flattering answers without substance",
  ],
  hr8: [
    "Name a specific misconception others have about them",
    "Explain why co-workers might think that",
    "Show self-reflection and honesty about their own behaviour",
    "Demonstrate transparency and comfort with self-assessment",
  ],

  // ── Teamwork / Collaboration (Intermediate) ──────────────────────────────
  hr9: [
    "Describe the specific difficulty with the colleague",
    "Show willingness to see things from the other person's perspective",
    "Explain concrete strategies used to improve the interaction",
    "Share the outcome of the working relationship",
    "Demonstrate maturity and professionalism throughout",
  ],
  hr10: [
    "Describe the specific communication breakdown",
    "Show patience in the face of misunderstanding",
    "Explain how they adjusted their communication style",
    "Demonstrate awareness of different communication preferences",
    "Share the resolution or improved understanding",
  ],
  hr11: [
    "Describe a specific team experience with genuine energy",
    "Clearly articulate their personal contributions",
    "Use a healthy mix of 'I' and 'we' language",
    "Show motivation and enthusiasm about teamwork",
    "Highlight the team's collective outcome or achievement",
  ],
  hr12: [
    "Describe a specific supervisor or partner and their management style",
    "Explain what aspects of that style appealed to them",
    "Show understanding of their own working style and preferences",
    "Demonstrate self-awareness about what brings out their best work",
  ],

  // ── Ownership / Leadership (Advanced) ─────────────────────────────────────
  hr13: [
    "Describe a specific situation where things went off plan",
    "Clearly state their role and level of responsibility",
    "Show thoughtful reflection rather than deflecting blame",
    "Demonstrate a strong sense of ownership over the outcome",
    "Share what they did to address the situation and the final result",
  ],
  hr14: [
    "Describe a specific situation requiring persuasion",
    "Explain the steps taken to build their case",
    "Use credibility and compelling evidence rather than authority",
    "Avoid coming across as arrogant or dismissive of the other view",
    "Share the results and impact of their persuasion",
  ],
  hr15: [
    "Describe a specific instance of leading by example",
    "Explain what actions they took and why",
    "Show understanding of how their behaviour impacts others",
    "Describe how others reacted or were influenced",
    "Demonstrate authentic leadership rather than performative action",
  ],
  hr16: [
    "Describe a specific tough decision and its context",
    "Show careful consideration of multiple outcomes or options",
    "Demonstrate willingness to make the final call despite difficulty",
    "Explain the reasoning behind their chosen course of action",
    "Share the outcome and any lessons learned",
  ],
  hr17: [
    "Describe the specific idea they needed to sell",
    "Explain the approach used to pitch the idea",
    "Use proof points, data, or evidence to support their case",
    "Show assertiveness without being pushy or dismissive",
    "Share the results and whether the idea was adopted",
  ],
  hr18: [
    "Describe the specific problem that arose",
    "Explain how they assessed the situation without the manager",
    "Show ability to rise to the occasion and take initiative",
    "Mention consulting appropriate people without overstepping",
    "Share the outcome and the manager's reaction if applicable",
  ],

  // ── Growth / Learning (Intermediate) ──────────────────────────────────────
  hr19: [
    "Describe a specific instance of voluntary learning",
    "Show eagerness and intrinsic motivation to grow",
    "Explain what resources they sought or asked for",
    "Demonstrate initiative rather than waiting for direction",
    "Share the outcome or how the new knowledge was applied",
  ],
  hr20: [
    "Articulate clear motivations for seeking a new role",
    "Focus on growth opportunities rather than complaints about current role",
    "Show investment in long-term career development",
    "Demonstrate thoughtfulness about what they want next",
  ],
  hr21: [
    "Describe a specific instance of seeking feedback",
    "Explain why they asked for feedback at that time",
    "Show that feedback-seeking is a regular practice",
    "Demonstrate openness to constructive criticism",
    "Share how the feedback led to improvement",
  ],
  hr22: [
    "Name a specific, meaningful career achievement",
    "Explain the effort and steps required to achieve it",
    "Show motivation and pride in the accomplishment",
    "Demonstrate drive and goal-oriented thinking",
    "Connect the achievement to their broader career trajectory",
  ],

  // ── Time Management / Organization (Intermediate) ─────────────────────────
  hr23: [
    "Describe a specific project they planned",
    "Explain the organizational method or framework used",
    "Show strong self-discipline and structured approach",
    "Demonstrate methodical scheduling and milestone-setting",
    "Share the outcome and whether deadlines were met",
  ],
  hr24: [
    "Describe a specific stressful or overwhelming situation",
    "Explain their coping and management strategies",
    "Show use of planning and prioritization to stay calm",
    "Mention delegation or asking for help when needed",
    "Share the resolution and what they learned",
  ],
  hr25: [
    "Describe a specific important task that was delegated",
    "Explain how they chose the right person for the task",
    "Show clear communication of instructions and expectations",
    "Mention setting deadlines and follow-up checkpoints",
    "Share the successful outcome of the delegation",
  ],
  hr26: [
    "Explain their thought process for time estimation",
    "Show careful thinking rather than guessing",
    "Demonstrate seeking a healthy middle ground between fast and thorough",
    "Mention breaking tasks down or using past experience as reference",
    "Show awareness of buffer time for unexpected issues",
  ],

  // ── Communication (Intermediate) ──────────────────────────────────────────
  hr27: [
    "Describe a specific successful presentation",
    "Explain how they prepared and practiced",
    "Show awareness of the audience and their needs",
    "Demonstrate confident and clear delivery skills",
    "Share what specifically made the presentation successful",
  ],
  hr28: [
    "Describe the specific resistance they encountered",
    "Show empathy for the other person's perspective",
    "Explain use of evidence or logic to build their case",
    "Demonstrate persistence without being aggressive",
    "Share the outcome and whether the person was convinced",
  ],
  hr29: [
    "Describe the specific miscommunication or conflict",
    "Show mediation skills and balanced approach",
    "Explain steps taken to clarify and resolve the issue",
    "Focus on resolution rather than blame",
    "Share the outcome and restored team harmony",
  ],
  hr30: [
    "Describe a specific cross-functional project or initiative",
    "Explain how they coordinated across teams or departments",
    "Show ability to navigate different stakeholders and priorities",
    "Demonstrate communication and organizational skills",
    "Share the outcome and impact of the collaboration",
  ],

  // ── Productivity / Daily Habits (Beginner) ────────────────────────────────
  hr31: [
    "Describe a structured approach to organizing the day",
    "Show self-awareness about personal productivity patterns",
    "Mention specific routines or methods used",
    "Demonstrate intentionality rather than just reacting to tasks",
  ],
  hr32: [
    "Explain their approach to prioritizing competing deadlines",
    "Show ability to assess urgency and importance",
    "Mention communicating tradeoffs to stakeholders when needed",
    "Demonstrate staying organized under pressure",
  ],
  hr33: [
    "Describe practical strategies for schedule management",
    "Show self-regulation and proactive planning",
    "Mention breaking tasks into manageable pieces",
    "Demonstrate awareness of personal limits and coping mechanisms",
  ],
  hr34: [
    "Name specific tools or routines they actually use",
    "Explain how these methods help them stay productive",
    "Show results or benefits from using these tools",
    "Demonstrate consistent habits rather than occasional use",
  ],
  hr35: [
    "Describe specific, actionable strategies for minimizing distractions",
    "Show self-awareness about what distracts them most",
    "Demonstrate deliberate focus management",
    "Share results or improvements from using these strategies",
  ],
  hr36: [
    "Describe specific self-discipline techniques",
    "Show ability to reframe unpleasant tasks positively",
    "Demonstrate strategies for pushing through low motivation",
    "Share examples of successfully completing unappealing work",
  ],
  hr37: [
    "Describe a specific missed deadline honestly",
    "Show accountability without making excuses",
    "Reflect on what went wrong and why",
    "Share concrete lessons learned from the experience",
    "Demonstrate how they prevent similar situations now",
  ],

  // ── Professionalism / Ethics (Intermediate) ───────────────────────────────
  hr38: [
    "Identify specific aspects of professionalism relevant to the role",
    "Show understanding of industry or role-specific standards",
    "Demonstrate thoughtfulness about professional conduct",
    "Connect professionalism to team and organizational success",
  ],
  hr39: [
    "Describe a specific situation involving confidential information",
    "Show integrity in their response and decision-making",
    "Demonstrate clear boundaries about what can and cannot be shared",
    "Explain how they handled pressure to disclose information",
  ],
  hr40: [
    "Describe a specific instance of problematic coworker behavior",
    "Show courage in addressing the issue rather than ignoring it",
    "Demonstrate tact and professionalism in their approach",
    "Focus on resolution and positive outcome rather than punishment",
  ],

  // ── General / Character (Beginner) ────────────────────────────────────────
  hr41: [
    "Express genuine enthusiasm for teamwork",
    "Show awareness of team dynamics and collaboration",
    "Mention specific benefits or experiences from team settings",
    "Demonstrate understanding of both individual and team contributions",
  ],
  hr42: [
    "Describe a specific, significant problem they solved",
    "Explain the problem-solving process they followed",
    "Show the impact and result of the solution",
    "Demonstrate analytical or creative thinking in their approach",
  ],
  hr43: [
    "Describe a structured approach to learning new concepts",
    "Show resourcefulness in finding information and resources",
    "Mention specific learning strategies or techniques",
    "Demonstrate curiosity and persistence when facing the unknown",
  ],
  hr44: [
    "Show openness to hearing opposing viewpoints",
    "Describe a collaborative approach to decision-making",
    "Demonstrate willingness to reconsider or adjust decisions",
    "Explain how they balance listening with making progress",
  ],
  hr45: [
    "Describe a specific task performed without prior experience",
    "Show resourcefulness in figuring out how to proceed",
    "Demonstrate learning agility and quick adaptation",
    "Share the outcome and focus on results achieved",
  ],
  hr46: [
    "Describe a specific instance of giving negative feedback",
    "Show empathy and sensitivity in their delivery",
    "Demonstrate constructive framing focused on improvement",
    "Show awareness of preserving the working relationship",
  ],
  hr47: [
    "Choose five specific, meaningful words",
    "Show self-awareness in the selection of descriptors",
    "Demonstrate authenticity rather than generic buzzwords",
    "Connect the words to relevant attributes for the role",
  ],
  hr48: [
    "Identify a genuine strength with supporting evidence",
    "Identify a genuine weakness honestly",
    "Show self-awareness and depth of self-assessment",
    "Demonstrate awareness of growth areas and steps to improve",
  ],
  hr49: [
    "Describe a clear approach to conflict resolution",
    "Show fairness and balanced consideration of all sides",
    "Demonstrate focus on outcomes and team harmony",
    "Mention specific mediation techniques or strategies",
  ],
  hr50: [
    "Share an honest perspective on working overtime",
    "Show realistic expectations about work demands",
    "Demonstrate awareness of work-life balance importance",
    "Avoid extremes of always available or completely rigid",
  ],
};
