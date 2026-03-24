/**
 * popup.js - Interactive UI Logic
 */

import * as api from './api.js';

const DOM = {
    authView: document.getElementById('auth-view'),
    dashboardView: document.getElementById('dashboard-view'),
    tokenInput: document.getElementById('token-input'),
    authBtn: document.getElementById('auth-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    userAvatar: document.getElementById('user-avatar'),
    userLogin: document.getElementById('user-login'),
    achievementsList: document.getElementById('achievements-list'),
    statusBar: document.getElementById('status-bar'),
    statusText: document.getElementById('status-text'),
    actionButtons: document.querySelectorAll('.action-btn')
};

// --- Initialization ---

async function init() {
    const data = await chrome.storage.local.get([api.STORAGE_KEYS.TOKEN, api.STORAGE_KEYS.USER]);
    
    if (data[api.STORAGE_KEYS.TOKEN]) {
        showView('dashboard');
        updateUserInfo(data[api.STORAGE_KEYS.USER]);
        loadAchievements();
    } else {
        showView('auth');
    }
}

// --- View Management ---

function showView(view) {
    if (view === 'auth') {
        DOM.authView.classList.remove('hidden');
        DOM.dashboardView.classList.add('hidden');
    } else {
        DOM.authView.classList.add('hidden');
        DOM.dashboardView.classList.remove('hidden');
    }
}

function updateUserInfo(user) {
    if (!user) return;
    DOM.userAvatar.src = user.avatar_url;
    DOM.userLogin.textContent = user.login;
}

function setStatus(message, isError = false) {
    DOM.statusText.textContent = message;
    DOM.statusBar.classList.remove('hidden', 'error');
    if (isError) DOM.statusBar.classList.add('error');
    
    // Auto-hide success messages
    if (!isError) {
        setTimeout(() => DOM.statusBar.classList.add('hidden'), 3000);
    }
}

// --- Action Handlers ---

DOM.authBtn.addEventListener('click', async () => {
    const token = DOM.tokenInput.value.trim();
    if (!token) return;

    setStatus('Validating token...');
    try {
        await chrome.storage.local.set({ [api.STORAGE_KEYS.TOKEN]: token });
        const user = await api.getUser();
        updateUserInfo(user);
        showView('dashboard');
        loadAchievements();
        setStatus('Authorized successfully!');
    } catch (err) {
        setStatus(err.message, true);
    }
});

DOM.logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.clear();
    showView('auth');
});

async function loadAchievements() {
    DOM.achievementsList.innerHTML = '<p class="loading">Loading achievements...</p>';
    try {
        const user = (await chrome.storage.local.get(api.STORAGE_KEYS.USER))[api.STORAGE_KEYS.USER];
        const achievements = await api.getAchievements(user.login);
        
        DOM.achievementsList.innerHTML = '';
        if (achievements.length === 0) {
            DOM.achievementsList.innerHTML = '<p class="loading">No achievements found yet.</p>';
            return;
        }

        achievements.forEach(ach => {
            const div = document.createElement('div');
            div.className = 'achievement-item';
            div.innerHTML = `
                <img src="${ach.icon}" alt="${ach.name}" class="badge-icon" title="${ach.tier}">
                <span class="badge-name">${ach.name}</span>
            `;
            DOM.achievementsList.appendChild(div);
        });
    } catch (err) {
        DOM.achievementsList.innerHTML = `<p class="loading error">Error loading achievements.</p>`;
    }
}

// --- Automated Action Handlers ---

DOM.actionButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        const user = (await chrome.storage.local.get(api.STORAGE_KEYS.USER))[api.STORAGE_KEYS.USER];
        
        setStatus(`Executing ${action}...`);
        try {
            switch (action) {
                case 'createRepo':
                    const repoName = `test-repo-${Date.now()}`;
                    await api.createRepo(repoName, true);
                    setStatus(`Created repo: ${repoName}`);
                    break;
                
                case 'createGist':
                    await api.createGist('Automated achievement gist', {
                        'achievement.md': { content: 'This gist was created automatically by GitHub Achievement Automator.' }
                    });
                    setStatus('Secret Gist created!');
                    break;
                
                case 'createIssue':
                    // We need a repo to create an issue. Let's use the first one available or prompt.
                    // For this simple POC, we'll try to find any repo.
                    setStatus('Note: Issue creation needs an existing repo.');
                    break;

                case 'createCommit':
                    setStatus('Note: Commit needs a specific repo and branch.');
                    break;

                case 'quickdraw':
                    setStatus('Executing Quickdraw: Opening & Closing Issue...');
                    const qdRepo = `quickdraw-test-${Date.now()}`;
                    await api.createRepo(qdRepo, true);
                    const issue = await api.createIssue(user.login, qdRepo, 'Quickdraw Achievement');
                    await api.closeIssue(user.login, qdRepo, issue.number);
                    setStatus('Quickdraw complete! Issue opened and closed.');
                    break;

                case 'yolo':
                    setStatus('Executing YOLO: Merging without review...');
                    const yoloRepo = `yolo-automa-${Date.now()}`;
                    await api.createRepo(yoloRepo, true);
                    const yoloMain = await api.getRef(user.login, yoloRepo, 'heads/main');
                    await api.createBranch(user.login, yoloRepo, 'yolo-fix', yoloMain.object.sha);
                    await api.createCommit(user.login, yoloRepo, 'yolo.txt', 'feat: yolo', 'yolo content', 'yolo-fix');
                    const yoloPr = await api.createPullRequest(user.login, yoloRepo, 'YOLO PR', 'yolo-fix', 'main');
                    await api.mergePullRequest(user.login, yoloRepo, yoloPr.number);
                    setStatus('Success! PR merged (YOLO mode).');
                    break;
                
                case 'pullShark':
                    setStatus('Executing Pull Shark: Creating 2 PRs...');
                    const psRepo = `pullshark-automa-${Date.now()}`;
                    await api.createRepo(psRepo, true);
                    const psMain = await api.getRef(user.login, psRepo, 'heads/main');
                    
                    // PR 1
                    await api.createBranch(user.login, psRepo, 'shark-1', psMain.object.sha);
                    await api.createCommit(user.login, psRepo, 'shark1.txt', 'feat: shark 1', 'v1', 'shark-1');
                    const pr1 = await api.createPullRequest(user.login, psRepo, 'Shark PR 1', 'shark-1', 'main');
                    await api.mergePullRequest(user.login, psRepo, pr1.number);
                    
                    // PR 2
                    await api.createBranch(user.login, psRepo, 'shark-2', psMain.object.sha);
                    await api.createCommit(user.login, psRepo, 'shark2.txt', 'feat: shark 2', 'v2', 'shark-2');
                    const pr2 = await api.createPullRequest(user.login, psRepo, 'Shark PR 2', 'shark-2', 'main');
                    await api.mergePullRequest(user.login, psRepo, pr2.number);
                    
                    setStatus('Pull Shark complete! 2 PRs created and merged.');
                    break;

                case 'heart':
                    setStatus('Reacting with heart...');
                    // Create a temporary repo and issue to react to safely
                    const heartRepo = `heart-automa-${Date.now()}`;
                    await api.createRepo(heartRepo, true);
                    const heartIssue = await api.createIssue(user.login, heartRepo, 'React to this!');
                    await api.createReaction(user.login, heartRepo, heartIssue.number, 'heart');
                    setStatus('Achievement: Heart on your sleeve facilitated!');
                    break;
                
                case 'galaxyBrain':
                    setStatus('Galaxy Brain requires a Discussion Comment ID.');
                    const commentId = prompt('Enter a Discussion Comment ID to mark as answer:');
                    if (commentId) {
                        try {
                            await api.markDiscussionAsAnswer(commentId);
                            setStatus('Galaxy Brain: Comment marked as answer!');
                        } catch (e) {
                            setStatus('Note: Requires a discussion repo with answers enabled.', true);
                        }
                    }
                    break;
                
                case 'pairExtraordinaire':
                    setStatus('Executing Pair Extraordinaire: Co-authored PR...');
                    const pairRepo = `pair-automa-${Date.now()}`;
                    await api.createRepo(pairRepo, true);
                    const pairMain = await api.getRef(user.login, pairRepo, 'heads/main');
                    await api.createBranch(user.login, pairRepo, 'pair-fix', pairMain.object.sha);
                    
                    // Commit with co-author (using a generic co-author)
                    await api.createCommitWithCoAuthor(user.login, pairRepo, 'pair.txt', 'feat: pair programming', 'Pair content', 'bot@antigravity.ai', 'Antigravity Bot', 'pair-fix');
                    
                    const pairPr = await api.createPullRequest(user.login, pairRepo, 'Pair Extraordinaire PR', 'pair-fix', 'main');
                    await api.mergePullRequest(user.login, pairRepo, pairPr.number);
                    setStatus('Pair Extraordinaire complete! PR with co-author merged.');
                    break;

                default:
                    setStatus(`${action} is ready to be configured.`);
            }
        } catch (err) {
            setStatus(err.message, true);
        }
    });
});

init();
