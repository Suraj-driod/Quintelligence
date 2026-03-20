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

    const res = await fetch(GEMINI_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}