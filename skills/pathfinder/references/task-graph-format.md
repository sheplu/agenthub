# Pathfinder — Task graph format

The artifact template and the rules for where it lives and how it evolves.
Write it only after the user confirms the DAG in
[decomposition-procedure.md](decomposition-procedure.md).

## Path and slug

- One artifact per project: `plan/<project-slug>/taskgraph.md`, relative to
  the target project's root. This folder is shared with `bbq`'s
  `context.md` — the two artifacts live side by side when both exist.
- **Slug**: kebab-case, 2–5 words, derived from the project name
  (`analytics-pipeline`, `auth-service-rewrite`). Before creating a new
  slug, list the existing `plan/*/` subfolders — if one already covers the
  same project under a different phrasing, reuse it. A project-level
  decomposition of the repo itself uses `project`.
- Create `plan/` and the subfolder if missing. If `taskgraph.md` exists,
  you are in re-run mode — see below; never overwrite it from scratch.

## Task node schema

Every task in the graph carries these fields:

| Field | Required | Description |
| --- | --- | --- |
| **id** | yes | Kebab-case slug, unique within the graph (e.g. `setup-ci-pipeline`). Short, descriptive, stable across re-runs. |
| **title** | yes | One-line human-readable summary. |
| **description** | yes | 2–3 sentences: what needs to happen, why it matters, and any notable constraints. Enough context that someone unfamiliar with the full project can understand the task. |
| **depends-on** | yes | Comma-separated list of task IDs that must complete before this task can start. `none` when the task has no blockers. Only hard blocking dependencies — not soft preferences. |
| **acceptance-criteria** | yes | Bullet list of testable conditions that define "done" for this task. Each criterion is a statement someone can verify by observation or by running a test. |
| **effort** | yes | Rough estimate: **S** (<2 hours), **M** (2–4 hours), or **L** (4–8 hours). Leaf tasks should be S or M; L tasks should be decomposed further. |
| **level** | yes | Decomposition depth: **1** = top-level milestone, **2** = task within a milestone, **3** = subtask within a task. |

## Template

Write the artifact in this structure. Omit sections that are genuinely
empty — but a complete run should populate all of them.

```markdown
# <Project name> — Task Graph

Scoped: <YYYY-MM-DD> · Status: complete | partial · Tasks: <total> (<done>/<total>)

## Scope summary

**Goals**: <ranked project outcomes, one line each>
**Tech stack**: <languages, frameworks, infrastructure>
**Team**: <size, roles, key constraints>
**Timeline**: <milestones, deadlines, MVP definition>
**Boundaries**: <in scope / out of scope>
**Cross-cutting**: <testing, CI/CD, security, documentation strategies>

## Tasks

### <id>: <title>

- **Level**: <1|2|3>
- **Effort**: <S|M|L>
- **Depends on**: <id-1>, <id-2> | none
- **Description**: <what and why, 2–3 sentences>
- **Acceptance criteria**:
  - <testable criterion>
  - <testable criterion>

<!-- repeat for each task, ordered by level then by dependency chain -->

## Dependency graph

\`\`\`mermaid
graph TD
  <id-1>[<title>] --> <id-2>[<title>]
  <id-1> --> <id-3>[<title>]
  <id-3> --> <id-4>[<title>]
\`\`\`

## Execution order

A valid topological ordering for sequential execution. When multiple tasks
are unblocked at the same point, list them together as a parallelisable
group.

1. <id> — <title>
2. <id> — <title>
3. ‖ <id-a> — <title> | <id-b> — <title> ‖  ← parallelisable
4. <id> — <title>

## Open questions

- **<Question>** — deferred because <reason>. Owner: <who>. Revisit:
  <date or trigger>.
```

### Ordering within the task list

Tasks are ordered by level first (all level-1 milestones, then their
level-2 tasks, then level-3 subtasks), and within a level by dependency
chain — earlier tasks first. When two tasks at the same level have no
dependency relationship, alphabetical by ID.

### Dependency graph conventions

- Use mermaid `graph TD` (top-down) for the diagram.
- Each node shows its ID as the node key and its title as the label:
  `id[Title]`.
- Edges flow from dependency to dependent: `setup-db --> build-api` means
  "setup-db must finish before build-api can start."
- For readability, omit transitive edges: if A → B → C, do not draw A → C.
- If the graph has more than 20 nodes, split into sub-graphs by milestone
  and connect them at the milestone level.

## Update rules (re-run mode)

- **Completed tasks**: prefix the task heading with `✅` and keep it in the
  graph for dependency context. Do not delete completed tasks — downstream
  tasks reference them.
- **Revised tasks**: rewrite the task in place and append
  `*(revised <YYYY-MM-DD>: was "<old title/description>" — <why>)*` at the
  end of the description.
- **Dropped tasks**: move to a `## Dropped tasks` section at the end with a
  one-line reason for each. Remove their edges from the dependency graph.
- **New tasks**: add with a new ID; wire dependencies to existing tasks.
- **Re-ordered tasks**: update the execution order and dependency graph.
- Bump the `Scoped` date. Flip `Status` to `complete` only when the same
  stop condition as a fresh run is met.
- Update the `Tasks` count: `<total> (<done>/<total>)` reflects the current
  state including completed tasks.
