# Tasks: GitHub Achievement Automator

## Phase 1: Infrastructure
- [x] 1.1 Create `manifest.json` with permissions and service worker.
- [x] 1.2 Create directory structure (`assets/icons/`, `scripts/`).
- [x] 1.3 Implement `api.js` base skeleton and `chrome.storage` helpers.

## Phase 2: Core Logic
- [x] 2.1 Implement `getUser()` and token validation in `api.js`.
- [x] 2.2 Implement `getAchievements()` with profile scraping logic.
- [x] 2.3 Implement automated action functions in `api.js`:
    - [x] `createRepo()`
    - [x] `createGist()`
    - [x] `createIssue()`
    - [x] `createCommit()`
    - [x] `createRelease()`
    - [x] `createPullRequest()`

## Phase 3: UI Implementation
- [x] 3.1 Create `popup.html` structure (Login, Dashboard, Footer).
- [x] 3.2 Create `popup.css` with premium glassmorphism theme.
- [x] 3.3 Create `popup.js` to handle:
    - [x] UI state switching (Auth vs. Dashboard).
    - [x] Rendering achievements list.
    - [x] Binding buttons to API actions with loading feedback.

## Phase 4: Verification
- [x] 4.1 Manual test of token validation.
- [x] 4.2 Manual test of achievement rendering.
- [x] 4.3 Manual test of each automated action.
