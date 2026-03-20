import { parseResume } from "@/app/backend/parseResume";
import { getGithubRepos, extractUsername } from "@/app/backend/githubService";
import { analyzeWithGemini } from "@/app/backend/geminiService";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume");
    const jobDescription = formData.get("jobDescription") || "";

    if (!resumeFile) {
        return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse resume
    const { text, github } = await parseResume(buffer);

    // 2. Get GitHub repos
    let repos = [];
    if (github) {
        const username = extractUsername(github);
        if (username) {
            repos = await getGithubRepos(username);
        }
    }

    // 3. Analyze with Gemini
    const analysisStr = await analyzeWithGemini(text, repos, jobDescription);
    
    // Attempt to parse JSON response from Gemini
    let analysis;
    try {
        const cleanedStr = analysisStr.replace(/```json/g, "").replace(/```/g, "").trim();
        analysis = JSON.parse(cleanedStr);
    } catch (e) {
        analysis = { raw: analysisStr, error: "Failed to parse JSON" };
    }

    return NextResponse.json(analysis);

  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
