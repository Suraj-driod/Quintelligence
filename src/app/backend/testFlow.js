import { parseResume } from "./parseResume";
import { getGithubRepos, extractUsername } from "./githubService";
import { analyzeWithGemini } from "./geminiService";
import { refineRoadmap } from "./refineRoadmap";

async function runPipeline(fileBuffer) {
    // 1. Parse resume
    const { text, github } = await parseResume(fileBuffer);

    // 2. Get GitHub repos
    let repos = [];
    if (github) {
        const username = extractUsername(github);
        repos = await getGithubRepos(username);
    }

    // 3. Analyze with Gemini
    const analysis = await analyzeWithGemini(text, repos);

    console.log("Analysis:", analysis);

    // 4. Feedback example
    const updated = await refineRoadmap(analysis, "Make it faster and more project-based");

    console.log("Updated:", updated);
}