---
name: brag
description: Generate an evidence-backed accomplishment document from recent work — use when asked to update a brag doc, summarize accomplishments, or prepare for a performance review.
---

# Brag

A stateful, multi-source skill that aggregates recent engineering work into an
evidence-backed accomplishment document. It collects activity from git history,
GitHub (via the `gh` CLI), any MCP-connected tools (Jira, Linear, Slack, GitLab,
etc.), and manual input, then produces a categorized, evidence-linked markdown
brag document. The agent is an **aggregator, not an interviewer** — it collects
and categorizes evidence rather than asking open-ended questions. Requires the
`gh` CLI for GitHub data; all other sources are optional. Degrades gracefully
when sources are unavailable.

## Core rules at a glance

- **Storage**: three files under `~/.brag/` — `profile.json` (identity),
  `.state.json` (runtime state), `brag.md` (growing output). Schemas and
  lifecycle live in `storage.md`; do not restate them from this summary.
- **First run**: bootstrap `profile.json` by asking the user's name and level
  (`junior` / `mid` / `senior` / `staff` / `principal`). Create `~/.brag/` if
  absent.
- **Time window**: configurable `--since` parameter; defaults to last run
  timestamp from `.state.json`, falling back to 7 days.
- **Data sources** (in order): git commits, GitHub (PRs authored, PRs reviewed,
  issues closed) via `gh`, MCP-discovered tools (issue trackers, chat, VCS, CI,
  docs), manual prompt for non-automated contributions. Exact procedure in
  `data-gathering.md`.
- **MCP discovery**: at runtime, list all available tools, categorize them
  (issue tracker, chat, VCS, CI, docs), query the relevant ones for the user's
  recent activity. Procedure in `mcp-discovery.md`.
- **Categories**: Features, Fixes, Reviews, Infrastructure, Learnings, Other.
  The agent may suggest additional categories if the data warrants it;
  definitions in `output-format.md`.
- **No fabrication**: every entry must trace to a concrete evidence source
  (commit SHA, PR URL, issue URL, Slack thread, ticket ID). An entry without
  evidence is never written.
- **Level-aware framing**: entries are framed according to the user's seniority
  level — junior entries emphasize learning and growth, principal entries
  emphasize system-wide impact and leadership. Rules in `output-format.md`.
- **Idempotent**: running twice with the same time window produces no duplicate
  entries. Dedup uses content hashes stored in `.state.json`. Within a single
  run, records describing the same work collapse into one entry (a commit and
  the PR that merged it, a self-reviewed PR, an issue closed by a recorded PR).
- **Graceful degradation**: each data source is optional. If `gh` is not
  authenticated, skip GitHub data and note the gap. If no MCP tools exist,
  skip that phase. Always produce output from whatever sources are available.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/storage.md](references/storage.md) | On first run or when reading/writing persistent state — file locations, JSON schemas for `profile.json` and `.state.json`, bootstrap procedure, and idempotency rules. |
| [references/data-gathering.md](references/data-gathering.md) | Always — the step-by-step procedure for determining the time window, querying each data source, deduplicating, and prompting for manual contributions. |
| [references/output-format.md](references/output-format.md) | Before writing any entry — the document structure, entry format, categorization rules, level-aware framing, and ongoing-work section rules. |
| [references/mcp-discovery.md](references/mcp-discovery.md) | When MCP tools may be available — how to list, categorize, and query MCP tools for user activity data. |

## How to use

- **First run**: read `storage.md`, bootstrap profile; read `data-gathering.md`,
  collect all data; read `output-format.md`, produce the initial document.
- **Update run**: read `storage.md` for existing state; read
  `data-gathering.md`, collect data since last run; read `output-format.md`,
  prepend the new period section after the header block (newest period first);
  update `.state.json`.
- **Review-prep mode**: read `output-format.md`, produce a conversational recap
  of the last N periods suitable for pasting into a self-review.
