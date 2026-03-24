# Specifications: GitHub Achievement Automator

## Requirements

### R1: Token Management
- The extension MUST provide an input field for the GitHub Personal Access Token (PAT).
- The token MUST be stored securely in `chrome.storage.local`.
- The extension MUST validate the token by calling the `https://api.github.com/user` endpoint.

### R2: Achievement Dashboard
- The extension SHOULD display the user's current achievements.
- Since no official API exists, the extension MAY navigate to `https://github.com/[username]?tab=achievements` or scrape the main profile page to extract achievements.
- The dashboard MUST distinguish between unlocked and locked achievements (if possible).

### R3: Automated Actions
- The extension MUST provide buttons to trigger the following actions via the GitHub API:
    - **Create Repo**: Create a new public or private repository.
    - **Create Gist**: Create a new public or secret gist.
    - **Create Issue**: Create an issue in a repository owned by the user.
    - **Commit**: Push a small file change to a test repository.
    - **PR**: Create a pull request between two branches.
    - **Release**: Create a new release for a repository.

### R4: User Interface
- The UI MUST be reachable via the extension popup.
- The UI MUST follow a minimalist and premium design.
- The UI MUST show loading states and success/error notifications for every action.

## Scenarios

### Scenario 1: Initial Setup
**Given** a user has just installed the extension
**When** they open the popup
**Then** they see a login screen asking for a GitHub Token
**And** an "Authorize" button correctly validates the token and saves it.

### Scenario 2: Triggering an Action
**Given** the user is authenticated
**When** they click "Create Private Repo"
**Then** a loading indicator appears
**And** a request is sent to `POST /user/repos`
**And** a success notification appears once the repo is created.

### Scenario 3: Viewing Achievements
**Given** the user is authenticated
**When** the popup opens
**Then** the background script scrapes the user's profile
**And** the list of achievements is rendered in the dashboard.
