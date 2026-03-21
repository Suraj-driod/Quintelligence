import { NextResponse } from "next/server";
import { refinePathwayWithGemini } from "@/app/backend/geminiService";

export async function POST(req) {
  try {
    const { modules, role, feedback } = await req.json();

    if (!modules || !feedback) {
      return NextResponse.json(
        { error: "Modules array and feedback string are required" },
        { status: 400 }
      );
    }

    const refinedStr = await refinePathwayWithGemini(modules, role, feedback);
    
    // Attempt to parse JSON response from Gemini
    let result;
    try {
        if (!refinedStr) {
            throw new Error("refinedStr is empty or undefined");
        }
        const cleanedStr = refinedStr.replace(/```json/g, "").replace(/```/g, "").trim();
        result = JSON.parse(cleanedStr);
    } catch (e) {
        result = { raw: refinedStr, error: e.message || "Failed to parse JSON" };
        return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error refining pathway:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
