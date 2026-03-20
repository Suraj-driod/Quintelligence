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