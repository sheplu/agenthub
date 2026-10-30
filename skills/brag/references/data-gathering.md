# Brag — Data gathering

Step-by-step procedure for collecting activity data from all available sources.
Consult [storage.md](storage.md) for file schemas and
[output-format.md](output-format.md) when categorizing entries.

## Time window resolution

Resolve the time window in this order — use the first that succeeds:

1. If the user provided `--since <date>`, use it as the start. End is now.
2. Else read `~/.brag/.state.json`. If `last_run` is non-null, use it as the
   start. End is now.
3. Else default to 7 calendar days ago (or `preferences.default_window_days`
   from `profile.json` if set). End is now.

Store the resolved window as `since` (ISO 8601) and `until` (ISO 8601, now).

## Phase 1: Git commits

Collect commits authored by the user within the time window.

1. Determine the author identity: use `email` from `profile.json` if set, else
   run `git config user.email`.
2. Run:
   ```
   git log --since="<since>" --until="<until>" --author="<email>" \
     --format="%H%n%aI%n%s%n%b%n---END---"
   ```
3. Parse each `---END---`-delimited block: line 1 is the full SHA, line 2 the
   author date (ISO 8601), line 3 the subject, and the remaining lines the
   body. Build a source record from it:
   - `source_type`: `git_commit`
   - `source_id`: the full SHA
   - `date`: author date (ISO 8601)
   - `summary`: commit subject line
   - `evidence_url`: null (git commits have no remote URL by default — use
     short SHA as evidence tag)
   - `raw`: full commit body for context during categorization
4. If the current directory is not a git repository, skip this phase and note:
   "Not in a git repository — skipping local commit history."

## Phase 2: GitHub (via `gh` CLI)

Requires `gh auth status` to succeed. If it fails, log "GitHub CLI not
authenticated — skipping GitHub data. Run `gh auth login` to enable." and skip
this entire phase.

All queries use `gh search`, which spans every repository the user has access
to — not only the current one. Search results expose `closedAt`, which for a
merged PR is the merge timestamp (there is no separate `mergedAt` field). Build
`source_id` from `repository.nameWithOwner`.

### PRs authored (merged in window)

```
gh search prs --author @me --merged --merged-at ">=$SINCE" \
  --json repository,number,title,url,closedAt,body,labels --limit 100
```

Parse each into a source record:
- `source_type`: `github_pr`
- `source_id`: `<repository.nameWithOwner>#<number>`
- `date`: `closedAt` (merge timestamp)
- `summary`: PR title
- `evidence_url`: PR URL
- `raw`: body, labels

### PRs reviewed (merged in window)

```
gh search prs --reviewed-by @me --merged --merged-at ">=$SINCE" \
  --json repository,number,title,url,closedAt,author --limit 100
```

Parse each into a source record:
- `source_type`: `github_review`
- `source_id`: `<repository.nameWithOwner>#<number>`
- `date`: `closedAt` (merge timestamp)
- `summary`: "Review: <PR title>"
- `evidence_url`: PR URL
- `raw`: author login

This query can return PRs the user authored (a self-review still counts as
"reviewed by") — the within-run collapse rules below drop those.

### Issues closed (in window)

```
gh search issues --assignee @me --state closed --closed ">=$SINCE" \
  --json repository,number,title,url,closedAt,labels --limit 100
```

Parse each into a source record:
- `source_type`: `github_issue`
- `source_id`: `<repository.nameWithOwner>#<number>`
- `date`: `closedAt`
- `summary`: issue title
- `evidence_url`: issue URL
- `raw`: labels

### Open PRs (for ongoing work)

```
gh search prs --author @me --state open \
  --json repository,number,title,url,isDraft,createdAt --limit 100
```

These do not become brag entries — they populate the "Ongoing Work" section per
[output-format.md](output-format.md). Parse each with:
- `source_type`: `github_pr_open`
- `source_id`: `<repository.nameWithOwner>#<number>`
- `summary`: PR title
- `evidence_url`: PR URL
- `status`: `draft` if `isDraft` is true, else `in review`

## Phase 3: MCP discovery

Delegate to [mcp-discovery.md](mcp-discovery.md). This phase produces zero or
more additional source records from external systems (Jira, Linear, Slack,
GitLab, etc.). If no MCP tools are available, this phase is a no-op.

## Phase 4: Manual prompt

After presenting the automated findings to the user, prompt for non-automated
contributions:

1. Show a summary: "I found **X commits**, **Y PRs**, **Z reviews**, and
   **W issues** in the last <window>. <MCP summary if any>."
2. Ask: "Any contributions not captured above? Think about: design docs,
   presentations, mentoring sessions, incident response, hiring interviews,
   on-call rotations, or cross-team coordination."
3. For each item the user provides:
   - Ask for an evidence link or artifact (optional).
   - If the user provides a link, record it as `evidence_url`.
   - If not, record with `evidence_url: null` and evidence tag
     `[user-reported]`.
   - `source_type`: `user_reported`
   - `source_id`: a slug derived from the summary (lowercase, hyphens)
4. If the user says "none" or equivalent, proceed.

## Within-run collapse

After all phases, collapse records that describe the same underlying piece of
work into a single record — otherwise one change surfaces as several entries:

1. **Commit and its PR.** If a `git_commit` and a `github_pr` refer to the same
   change — the commit SHA appears in the PR record, or both reference the
   same closing issue (`Closes #N` / `Fixes #N`) — keep the `github_pr` record
   (it carries the evidence URL) and drop the commit record.
2. **Self-review.** If the same PR appears in both the authored and the
   reviewed results, keep the `github_pr` record and drop the
   `github_review` record — reviewing your own PR is not a separate
   accomplishment.
3. **Issue closed by a recorded PR.** If an issue's closing reference
   (`Fixes #N` / `Closes #N`) appears in the body of an already-collected PR,
   drop the issue record — the PR entry covers it.
4. **Everything else stands on its own.** A commit with no matching PR stays
   its own entry (short-SHA evidence tag); an issue closed without a recorded
   PR stays its own entry.

## Cross-run deduplication

Before writing any entry to `brag.md`:

1. Compute a content hash: SHA-256 of the string
   `<source_type>:<source_id>:<summary>`, using the record that survived
   within-run collapse.
2. Check against `entry_hashes` in `~/.brag/.state.json`.
3. If the hash exists, skip the entry silently — it was already recorded in a
   prior run.
4. After writing all new entries, append their hashes to `entry_hashes` in
   `.state.json`.

## Source record schema

Every collected activity record must have these fields before categorization:

| Field | Type | Description |
| --- | --- | --- |
| `source_type` | string | `git_commit`, `github_pr`, `github_review`, `github_issue`, `github_pr_open`, `mcp_<tool>`, `user_reported` |
| `source_id` | string | Unique identifier within that source (SHA, `owner/repo#N`, ticket ID) |
| `date` | string | ISO 8601 timestamp |
| `summary` | string | One-line description (from commit subject, PR title, etc.) |
| `evidence_url` | string \| null | Direct link to the artifact. Null only for `git_commit` (use short SHA) and `user_reported` (when user provides no link). |
| `raw` | any | The full raw record for context during categorization and framing |

## Edge cases

| Condition | Behavior |
| --- | --- |
| `gh` not installed | Same as auth failure — log the gap, skip Phase 2. |
| No commits in window | Normal — not every period has local commits. Continue. |
| GitHub returns no results | Normal — continue to next phase. |
| Rate limiting from GitHub | Log warning, report partial results. Do not retry. |
| User provides duplicate manual entry | Caught by dedup if the slug matches a prior entry. |
| Time window spans multiple repositories | Git phase only covers the current repo. GitHub phase covers all repos the user has access to. Note this in the recap. |
