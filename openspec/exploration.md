## Exploration: GitHub Achievement Automator

### Current State
As of March 2026, GitHub does not provide an official REST or GraphQL API endpoint dedicated to listing all achievements for a user. Achievements are rendered on the profile page but are not explicitly part of the standard `User` object in the public APIs.

### Affected Areas
- `api.js` — Needs to handle GraphQL queries or profile scraping to retrieve the achievement list.
- `popup.js` — Needs to render achievements and provide buttons for automated actions.

### Approaches
1. **Approach A: GraphQL User Query**
   - **Description**: Query the GraphQL API for the `User` object and look for nodes like `socialAccounts`, `status`, or experimental fields.
   - **Pros**: Clean, official, follows user's preference for API use.
   - **Cons**: Might not return the full list of achievements (only basic stats).
   - **Effort**: Low

2. **Approach B: Profile Scraping (DOM Parsing)**
   - **Description**: The extension navigates to `github.com/{username}` and parses the achievement section from the HTML.
   - **Pros**: Guaranteed to see everything the user sees on their profile.
   - **Cons**: Brittle (can break if GitHub changes their UI), requires `content_scripts` or `tab` permissions.
   - **Effort**: Medium

3. **Approach C: Logic-Based Inference**
   - **Description**: Query API for repositories, forks, PRs, and issues. Match these stats against known achievement criteria (e.g., Pull Shark = Merged PRs).
   - **Pros**: Reliable, uses standard APIs.
   - **Cons**: Cannot see "private" achievements or specific "milestone" dates accurately.
   - **Effort**: High (developing the logic for each achievement).

### Recommendation
**Approach B + C**: Combine DOM scraping for the current list (to show what's unlocked) and Logic-Based Inference to track progress on missing ones. For the automated actions, use the official REST API as requested.

### Risks
- **GitHub Rate Limits**: Automating multiple actions might trigger rate limits.
- **Account Protection**: Automating commits/PRs must be done carefully to avoid being flagged as bot activity (though the user specifically requested legitimate actions).

### Ready for Proposal
**Yes** — Once the retrieval method is finalized.
