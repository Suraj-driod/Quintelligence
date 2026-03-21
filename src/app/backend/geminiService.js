export const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function analyzeWithGemini(inputText, repos, jobDescription = "") {
    const prompt = `
Analyze this user:

Resume:
${inputText}

GitHub Repos:
${JSON.stringify(repos)}

${jobDescription ? `Target Job Description:\n${jobDescription}` : ""}

Analyze the user's profile against the Target Job Description (if provided) and generate a learning roadmap.
If no job description is provided, generate a general learning roadmap for their next logical career step.
Return JSON:
{
  "skills": [],
  "level": "",
  "insights": [],
  "learning_style": "",
  "roadmap": [
    { "step": 1, "topic": "", "description": "" }
  ]
}
`;

    const res = await fetch(`${GEMINI_API}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Gemini API Error: ${res.status} - ${JSON.stringify(errData)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function generatePathwayWithGemini(inputText, repos, jobDescription = "", mindGauge = null) {
    let learnerInstruction = "";
    if (mindGauge) {
       const mapped = {
           "A": "Visual Learner: Provide resources that heavily rely on diagrams, architecture graphs, and visual mapping.",
           "B": "Auditory Learner: Provide resources linking to video tutorials, tech podcasts, and auditory explanations.",
           "C": "Kinesthetic Learner: Provide resources linking to hands-on exercises, interactive coding platforms, and lab environments.",
           "D": "Logical Learner: Provide resources linking strictly to official documentation, whitepapers, and source code.",
           "E": "Social Learner: Provide resources linking to social media communities, discord servers, StackOverflow tags, and Reddit discussions."
       };
       learnerInstruction = mapped[mindGauge] || "";
    }

    const prompt = `
Analyze this user:

Resume:
${inputText}

GitHub Repos:
${JSON.stringify(repos)}

${jobDescription ? `Target Job Description:\n${jobDescription}` : ""}

Analyze the user's profile against the Target Job Description (if provided) and generate a learning roadmap.
If no job description is provided, generate a general learning roadmap for their next logical career step.

${learnerInstruction ? `VERY IMPORTANT LEARNER PREFERENCE:
The user has been identified with the following learning style constraint:
"${learnerInstruction}"
You MUST provide 2-3 specific learning resources (with realistic URLs, e.g. youtube.com, official docs, etc) for EACH module that cater EXACTLY to this learning style.` : ""}

We need output strictly in the following JSON format:

{
  "analysis": {
    "knownSkills": ["Python", "React"],
    "missingSkills": [{ "name": "GraphQL", "requiredLevel": "Intermediate" }],
    "weakSkills": [{ "name": "TypeScript", "currentLevel": "Beginner", "targetLevel": "Intermediate" }],
    "reasoning": [
      "Scanning resume and GitHub repos for matches against target role...",
      "Found strong evidence of React and Python from 24 repos."
    ]
  },
  "pathway": {
    "role": "Senior Frontend Developer",
    "estimatedHours": 40,
    "modules": [
      { 
        "id": 1, 
        "name": "Advanced TypeScript Patterns", 
        "duration": "8 hrs", 
        "skills": ["TypeScript"], 
        "reasoning": "Addresses the gap from Beginner to Intermediate TypeScript.",
        "resources": [
           { "type": "video", "title": "Advanced TS Masterclass", "url": "https://youtube.com/..." },
           { "type": "docs", "title": "TypeScript Official Handnook", "url": "https://www.typescriptlang.org/docs/" }
        ]
      }
    ]
  }
}

Important criteria:
1. Provide valid JSON only. Do not wrap in markdown tags if possible, or if you do, wrap strictly in \`\`\`json.
2. In 'analysis.reasoning', provide 3 to 4 string elements, simulating terminal processing logs like 'Scanning resume...' and 'Missing evidence of Docker...'.
3. In 'pathway', 'role' should be a concise job title reflecting the next logical step or the given JD.
4. 'modules' array should contain exactly what to learn, with each having an integer 'id', a 'name', 'duration' (like '8 hrs'), array of top 'skills' covered, and a short 'reasoning' why it's recommended.
5. 100% GAP COVERAGE (CRITICAL): Ensure ABSOLUTELY NO identified skill gaps are left out. You may group multiple related gaps into a single module if it makes sense, or split complex gaps across multiple modules. What matters is that EVERY single missing or weak skill has a clear learning path. Do not drop items for the sake of a concise response.
6. CRITICAL URL RULES explicitly for 'resources' array: 
   - NEVER hallucinate URLs. All returned URLs MUST be existent and real. 
   - For YouTube videos, if you do not know the exact video ID, use a search query URL: 'https://www.youtube.com/results?search_query=your+search+topic'.
   - For documentation, prefer detailed official root docs (e.g., 'https://react.dev/learn', 'https://docs.python.org/3/'). 
   - For social/community links, ONLY use StackOverflow tag pages (e.g., 'https://stackoverflow.com/questions/tagged/reactjs') or actual public Discord server directory links.
`;

    const res = await fetch(`${GEMINI_API}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Gemini API Error: ${res.status} - ${JSON.stringify(errData)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function refinePathwayWithGemini(modules, role, feedback) {
    const prompt = `
You are an expert career coach AI.
I have a learning pathway for the role: ${role}.
Here is the current list of learning modules in JSON format:
${JSON.stringify(modules)}

The user provided the following feedback to refine this pathway:
"${feedback}"

Your task is to modify the existing modules based ONLY on this feedback. You can add, remove, or edit modules, durations, or skills to better suit their request.
We need output strictly in the following JSON format:
{
  "modules": [
    { 
      "id": 1, 
      "name": "Module Name", 
      "duration": "8 hrs", 
      "skills": ["Skill1", "Skill2"], 
      "reasoning": "Why this is recommended based on their feedback.",
      "resources": [
         { "type": "video", "title": "A Video Tutorial", "url": "https://www.youtube.com/results?search_query=tutorial+topic" }
      ]
    }
  ]
}

Important criteria:
1. Provide valid JSON only. Do not wrap in markdown tags if possible, or if you do, wrap strictly in \`\`\`json.
2. The output MUST contain the "modules" array with the exact same object structure as the input, preserving 'resources'.
3. Maintain the "resources" array. NEVER hallucinate URLs. Use real, existing URLs only. Ensure YouTube links use a valid search query ('https://www.youtube.com/results?search_query=...') if exact video ID is unknown. Use detailed official docs ('https://react.dev/learn'). Use StackOverflow tags or Discord for socials.
4. 100% GAP COVERAGE: When adjusting modules, ensure that all required topics from the feedback are entirely covered. Group related items if logical, but never omit requested topics just to keep the list short.
`;

    const res = await fetch(`${GEMINI_API}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(`Gemini API Error: ${res.status} - ${JSON.stringify(errData)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}