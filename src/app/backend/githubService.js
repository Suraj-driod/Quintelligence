export async function getGithubRepos(username) {
    const res = await fetch(
        `https://api.github.com/users/${username}/repos`
    );

    const data = await res.json();

    // Extract only useful fields
    const repos = data.map((repo) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
    }));

    return repos;
}

// Helper to extract username from URL
export function extractUsername(githubUrl) {
    const parts = githubUrl.split("github.com/");
    return parts[1]?.split("/")[0];
}

// Fetch dynamic stats like account age and contributions
export async function getGithubStats(username) {
    let stats = {
        accountAge: "Unknown",
        contributions: 0
    };

    try {
        // Fetch User API for Account Age
        const userRes = await fetch(`https://api.github.com/users/${username}`, {
            headers: { 'User-Agent': 'node.js' }
        });
        if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.created_at) {
                const createdAt = new Date(userData.created_at);
                const diffTime = Math.abs(new Date() - createdAt);
                const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
                stats.accountAge = diffYears > 0 ? `${diffYears} Year${diffYears > 1 ? 's' : ''}` : "Less than a year";
            }
        }

        // Fetch HTML for Contributions
        const htmlRes = await fetch(`https://github.com/${username}`, {
            headers: { 'User-Agent': 'node.js' }
        });
        if (htmlRes.ok) {
            const html = await htmlRes.text();
            // Regex to find "1,234 contributions in the last year"
            const match = html.match(/(\d+(?:,\d+)?)\s+contributions\s+in\s+the\s+last/i);
            if (match && match[1]) {
                stats.contributions = parseInt(match[1].replace(/,/g, ''), 10);
            }
        }
    } catch (e) {
        console.error("Failed to fetch Github stats:", e);
    }

    return stats;
}