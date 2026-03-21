import { parseResume } from "@/app/backend/parseResume";
import { getGithubRepos, extractUsername } from "@/app/backend/githubService";
import { generatePathwayWithGemini } from "@/app/backend/geminiService";
import { savePathway } from "@/app/backend/pathwayService";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume");
    const jobDescription = formData.get("jobDescription") || "";
    const publicLink = formData.get("publicLink") || formData.get("github") || "";
    const mindGauge = formData.get("mindGauge") || null;

    if (!resumeFile) {
        return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse resume
    const { text, github: parsedGithub } = await parseResume(buffer);
    const finalGithub = publicLink || parsedGithub;

    // 2. Get GitHub repos
    let repos = [];
    let username = null;
    if (finalGithub) {
        username = extractUsername(finalGithub);
        if (username) {
            repos = await getGithubRepos(username);
        }
    }

    // 3. Analyze with Gemini
    const analysisStr = await generatePathwayWithGemini(text, repos, jobDescription, mindGauge);
    console.log("==== GEMINI RAW OUTPUT ====");
    console.log(analysisStr);
    console.log("===========================");
    
    // Attempt to parse JSON response from Gemini
    let result;
    try {
        if (!analysisStr) {
            throw new Error("analysisStr is empty or undefined");
        }
        const cleanedStr = analysisStr.replace(/```json/g, "").replace(/```/g, "").trim();
        result = JSON.parse(cleanedStr);
        
        if (finalGithub && username) {
            result.githubProfile = {
                username,
                reposCount: repos?.length || 0,
                languages: Array.from(new Set(repos.map(r => r.language).filter(Boolean))),
                url: finalGithub
            };
        }

        // Save to Firestore
        const pathwayPayload = {
            title: result.pathway?.role || "Untitled Pathway",
            mindGauge: mindGauge,
            githubData: result.githubProfile || null,
            gapAnalysis: {
                missing: result.analysis?.missingSkills?.map(s => s.name || s) || [],
                weak: result.analysis?.weakSkills?.map(s => s.name || s) || [],
                strong: result.analysis?.knownSkills || []
            },
            modules: result.pathway?.modules || []
        };
        const pathwayId = await savePathway('guest_user', pathwayPayload);
        result.pathwayId = pathwayId;

    } catch (e) {
        result = { raw: analysisStr, error: e.message || "Failed to parse JSON" };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error generating pathway:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
