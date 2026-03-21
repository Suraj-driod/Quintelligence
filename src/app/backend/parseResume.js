// parseResume.js

export async function parseResume(fileBuffer) {
    try {
        // ✅ Dynamic import (BEST for Next.js)
        const pdfParse = (await import("pdf-parse")).default;

        // ✅ Extract text from PDF
        const data = await pdfParse(fileBuffer);
        const text = data.text || "";

        // ✅ Improved GitHub regex (handles missing https, www, etc.)
        const githubRegex =
            /(https?:\/\/)?(www\.)?github\.com\/[A-Za-z0-9_-]+/i;

        let github = text.match(githubRegex)?.[0] || null;

        // ✅ Normalize GitHub URL
        if (github) {
            github = github.trim();

            // Add https if missing
            if (!github.startsWith("http")) {
                github = "https://" + github;
            }

            // Remove trailing slashes or junk
            github = github.replace(/\/+$/, "");
        }

        return {
            text,
            github,
        };
    } catch (error) {
        console.error("Error parsing resume:", error);

        return {
            text: "",
            github: null,
            error: "Failed to parse resume",
        };
    }
}