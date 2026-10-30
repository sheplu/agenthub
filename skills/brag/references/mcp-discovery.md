# Brag — MCP discovery

How to discover, categorize, and query MCP tools for user activity data. Read
this during Phase 3 of [data-gathering.md](data-gathering.md) when MCP tools
may be available in the agent's session.

## Purpose

MCP (Model Context Protocol) tools are registered by the hosting harness
(Claude Code, Cursor, Windsurf, etc.) and exposed as callable tools alongside
built-in file and shell tools. This reference covers how to find them,
categorize them, and extract activity data for the brag document.

## Discovery procedure

1. **Inspect your available tools.** Review all tools currently available to
   you. Identify tools that are not built-in file/shell/search tools (Read,
   Write, Edit, Bash, Glob, Grep, etc.). MCP tools typically have names
   prefixed with a service identifier or follow a `service_action` naming
   pattern.

2. **Categorize each non-built-in tool** by name and description into one of
   these source categories:

   | Category | Tool name patterns | Examples |
   | --- | --- | --- |
   | Issue tracker | `jira`, `linear`, `asana`, `shortcut`, `youtrack`, `github` (when separate from `gh` CLI) | `jira_search_issues`, `linear_list_issues`, `asana_get_tasks` |
   | Chat | `slack`, `teams`, `discord`, `mattermost` | `slack_search_messages`, `slack_list_channels` |
   | VCS (non-GitHub) | `gitlab`, `bitbucket`, `gitea`, `forgejo` | `gitlab_list_merge_requests`, `bitbucket_get_pullrequests` |
   | CI/CD | `jenkins`, `circleci`, `buildkite`, `github_actions` | `buildkite_list_builds`, `jenkins_get_job` |
   | Docs | `confluence`, `notion`, `google_docs`, `coda` | `confluence_search`, `notion_query_database` |

3. **If no MCP tools match any category**, skip this phase and note in the
   output: "No MCP-connected activity sources found. To enrich future brag
   docs, connect issue trackers or chat tools via MCP."

## Query patterns per category

For each discovered tool category, query for the user's recent activity within
the time window. Adapt the exact tool call to the tool's API — the patterns
below are guidance, not exact calls.

### Issue tracker (Jira, Linear, Asana, etc.)

**Goal**: find issues/tickets assigned to or created by the user,
closed/completed within the window.

- Search for issues where assignee is the current user and status changed to
  done/closed/completed after `since`.
- Extract: ticket ID/key, title, status, URL, labels/tags.
- Source record: `source_type: "mcp_<tool>"`, `source_id: "<ticket-key>"`.
- Categorize: most issue-tracker tickets map to Features or Fixes based on
  their type/label. Bug tickets → Fixes. Story/task tickets → Features.
  Epic-level tickets → typically Features with higher-impact framing.

### Chat (Slack, Teams, etc.)

**Goal**: find threads where the user provided substantive help or drove
discussions.

- Search for messages from the user in team or project channels within the
  window. Filter for substantive messages — long messages, thread starters in
  help channels, or messages with reactions/replies indicating usefulness.
- Extract: channel name, date, message summary (first line or truncated),
  thread URL.
- Source record: `source_type: "mcp_<tool>"`, `source_id: "<thread-url>"`.
- **Use sparingly**: chat is high-noise. Only include threads where the user
  clearly helped someone, drove a decision, or shared significant knowledge.
  Do not include casual conversation, status updates, or short replies.
- Categorize: help threads → Reviews or Other (mentoring). Decision threads →
  Features or Infrastructure depending on topic.

### VCS — non-GitHub (GitLab, Bitbucket, etc.)

**Goal**: same data as the GitHub phase but from a different forge.

- List merge requests / pull requests authored by the user, merged within the
  window.
- List merge requests reviewed by the user, merged within the window.
- Extract: MR/PR number, title, URL, merge date, author.
- Source records follow the same pattern as `github_pr` and `github_review`
  but with `source_type: "mcp_<tool>"`.

### CI/CD (Jenkins, CircleCI, Buildkite, etc.)

**Goal**: find pipelines or builds triggered by the user's commits.

- Usually not worth a standalone brag entry — CI work supports commits and PRs.
- Use as **supporting evidence**: if a commit triggered a complex deployment
  pipeline, mention the deployment in the commit's impact note rather than
  creating a separate entry.
- Exception: if the user built or configured the CI pipeline itself, that is
  an Infrastructure entry. Look for pipeline configuration changes.

### Docs (Confluence, Notion, etc.)

**Goal**: find documents created or substantially edited by the user within the
window.

- Search for pages/documents where the user is the creator or last editor,
  modified within the window.
- Extract: title, URL, last-edited date.
- Source record: `source_type: "mcp_<tool>"`, `source_id: "<page-url>"`.
- Categorize: design docs → Features or Infrastructure. Runbooks → Infrastructure.
  Onboarding docs → Other (mentoring). Post-mortems → Fixes.

## Graceful degradation

- If a tool call fails (auth error, timeout, unexpected response), log the
  error and continue to the next tool. Never abort the entire run because one
  MCP tool is broken.
- If a tool returns no results, that is normal — not every source has activity
  every period. Do not report it as an error.
- If the agent cannot determine how to call a discovered tool (unknown API
  shape, unclear parameters), skip it and note: "Found MCP tool `<name>` but
  could not determine how to query it for user activity. Check the tool's
  documentation."
- If a tool returns data that cannot be mapped to the source record schema
  (missing required fields), skip individual records and note the gap — do not
  fabricate missing fields.

## Future-proofing

The discovery approach is pattern-based, not hardcoded. When a user adds a new
MCP server (e.g., a Jira connector) to their agent harness configuration, the
brag skill automatically picks it up on the next run — no skill update needed.
The category table above covers the most common tools; for tools that do not
match any pattern, the agent should use its judgment to determine if the tool
provides relevant activity data, and if so, what category it belongs to.
