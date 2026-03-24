/**
 * api.js - GitHub API Wrapper for Achievement Automator
 */

export const STORAGE_KEYS = {
    TOKEN: 'github_token',
    USER: 'github_user',
    ACHIEVEMENTS: 'github_achievements'
};

/**
 * Base fetch wrapper with auth
 */
async function ghFetch(endpoint, options = {}) {
    const token = (await chrome.storage.local.get(STORAGE_KEYS.TOKEN))[STORAGE_KEYS.TOKEN];
    if (!token) throw new Error('No GitHub token found');

    const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
        throw new Error('Unauthorized: Invalid token');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Validates token and returns user info
 */
export async function getUser() {
    const user = await ghFetch('/user');
    await chrome.storage.local.set({ [STORAGE_KEYS.USER]: user });
    return user;
}

/**
 * Scrapes achievements from profile
 */
export async function getAchievements(username) {
    // Note: Fetching the profile HTML requires the 'tabs' or 'host_permissions'
    const response = await fetch(`https://github.com/${username}?tab=achievements`);
    const html = await response.text();
    
    // Minimalist parser for achievement badges
    // Look for <img class="achievement-badge-card" ... title="Achievement: [Name]" ...>
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const badges = Array.from(doc.querySelectorAll('.achievement-badge-card'));
    
    const achievements = badges.map(badge => {
        const img = badge.querySelector('img');
        return {
            name: img?.getAttribute('alt')?.replace('Achievement: ', '') || 'Unknown',
            icon: img?.getAttribute('src'),
            tier: badge.querySelector('.achievement-tier-label')?.textContent?.trim() || 'Bronze'
        };
    });

    await chrome.storage.local.set({ [STORAGE_KEYS.ACHIEVEMENTS]: achievements });
    return achievements;
}

/**
 * Automated Actions
 */

export async function createRepo(name, isPrivate = true) {
    return ghFetch('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
            name,
            private: isPrivate,
            auto_init: true
        })
    });
}

export async function createGist(description, files) {
    return ghFetch('/gists', {
        method: 'POST',
        body: JSON.stringify({
            description,
            public: false,
            files: files // e.g. { "hello.txt": { "content": "world" } }
        })
    });
}

export async function createIssue(owner, repo, title, body = '') {
    return ghFetch(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify({ title, body })
    });
}

export async function createCommit(owner, repo, path, message, content) {
    // 1. Get current file sha if exists
    let sha;
    try {
        const fileData = await ghFetch(`/repos/${owner}/${repo}/contents/${path}`);
        sha = fileData.sha;
    } catch (e) { /* New file */ }

    return ghFetch(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify({
            message,
            content: btoa(content), // Base64
            sha
        })
    });
}

export async function createRelease(owner, repo, tag, name, body = '') {
    return ghFetch(`/repos/${owner}/${repo}/releases`, {
        method: 'POST',
        body: JSON.stringify({
            tag_name: tag,
            name,
            body,
            draft: false,
            prerelease: false
        })
    });
}

export async function createPullRequest(owner, repo, title, head, base = 'main') {
    return ghFetch(`/repos/${owner}/${repo}/pulls`, {
        method: 'POST',
        body: JSON.stringify({ title, head, base })
    });
}

/**
 * Achievement Specific: YOLO (Merge without review)
 */
export async function mergePullRequest(owner, repo, prNumber) {
    return ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, {
        method: 'PUT',
        body: JSON.stringify({
            merge_method: 'merge'
        })
    });
}

/**
 * Achievement Specific: Quickdraw (Close issue/PR within 5m)
 */
export async function closeIssue(owner, repo, issueNumber) {
    return ghFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        body: JSON.stringify({
            state: 'closed'
        })
    });
}

/**
 * Achievement Specific: Pair Extraordinaire (Co-authored PR)
 */
export async function createCommitWithCoAuthor(owner, repo, path, message, content, coAuthorEmail, coAuthorName) {
    const coAuthorLine = `\n\nCo-authored-by: ${coAuthorName} <${coAuthorEmail}>`;
    return createCommit(owner, repo, path, message + coAuthorLine, content);
}

/**
 * Achievement Specific: Heart On Your Sleeve (Reactions)
 */
export async function createReaction(owner, repo, issueNumber, content = 'heart') {
    return ghFetch(`/repos/${owner}/${repo}/issues/${issueNumber}/reactions`, {
        method: 'POST',
        headers: { 'Accept': 'application/vnd.github.squirrel-girl-preview+json' },
        body: JSON.stringify({ content })
    });
}

/**
 * Achievement Specific: Galaxy Brain (GraphQL for Discussions)
 */
export async function markDiscussionAsAnswer(commentId) {
    const query = `
        mutation($id: ID!) {
            markDiscussionCommentAsAnswer(input: { id: $id }) {
                discussion {
                    id
                }
            }
        }
    `;
    const token = (await chrome.storage.local.get(STORAGE_KEYS.TOKEN))[STORAGE_KEYS.TOKEN];
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, variables: { id: commentId } })
    });
    return response.json();
}
