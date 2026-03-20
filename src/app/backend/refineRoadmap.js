import { GEMINI_API } from "./geminiService";

export async function refineRoadmap(roadmap, feedback) {
  const prompt = `
Here is a roadmap:
${JSON.stringify(roadmap)}

User feedback:
${feedback}

Modify the roadmap accordingly.
Return updated JSON + list of changes.
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