import pdfParse from "pdf-parse";

export async function parseResume(fileBuffer) {
    // Step 1: Extract text
    const data = await pdfParse(fileBuffer);
    const text = data.text;

    // Step 2: Regex GitHub extraction
    const githubRegex = /https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+/i;
    let github = text.match(githubRegex)?.[0] || null;

    // Step 3: Fix missing https
    if (github && !github.startsWith("http")) {
        github = "https://" + github;
    }

    return {
        text,
        github,
    };
}