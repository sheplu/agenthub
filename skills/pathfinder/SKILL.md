---
name: pathfinder
description: Scope a large project at the project level — tech stack, business goals, team, timeline, cross-cutting concerns — and decompose it into a DAG of individually actionable tasks. Use when starting a new project, re-scoping a stalled one, or whenever the user says "pathfinder", "break this down", "scope this project", or presents a large, vague project idea.
---

# Pathfinder

A skill for turning a large, vague project into a directed acyclic graph of
individually actionable tasks. The agent interviews the user at the
**project level** — business goals, tech stack, team constraints, timeline,
cross-cutting concerns — then decomposes the scoped project into a task
graph with explicit dependencies and a valid execution order.

Pathfinder works upstream of `bbq`: where `bbq` builds shared understanding
of one task, pathfinder draws the map of all tasks. Each task in the output
should be self-contained enough that someone — or an agent — can pick it up,
optionally run a `bbq` interview on it for deep understanding, and execute
it without knowing the rest of the graph.

## Core rules at a glance

- **Two phases**: **scoping** (project-level interview in rounds) then
  **decomposition** (propose full DAG, user validates). Scoping ends before
  decomposition begins.
- **Scoping is project-global**: tech stack, business goals, team &
  resources, timeline & phases, project boundaries, cross-cutting concerns.
  This is not the task-level deep-dive that `bbq` does — pathfinder asks
  "how does this shape the task breakdown?", not "what does this one task
  mean?".
- **Six scoping categories**, every one visited or consciously skipped:
  **business context & goals** · **tech stack & architecture** · **team &
  resources** · **timeline & phases** · **project boundaries** ·
  **cross-cutting concerns**. Details and probes live in
  `scoping-questionnaire.md`.
- **Rounds, not one-at-a-time**: ask every currently answerable question in
  one numbered batch, each with a recommended answer; wait for the user's
  replies; recompute which questions the replies unblock; ask the next batch.
- **Facts vs decisions**: anything discoverable — code, docs, tools, the
  web — is the agent's job to look up. Only judgment calls, preferences, and
  domain knowledge go to the user.
- **No vague answers**: "fast", "simple", "the usual", "later" are prompts
  to probe, not answers to record. Push for a number, a concrete example, a
  boundary.
- **When a `bbq` artifact exists** (`plan/<slug>/context.md`): read it,
  extract project-level context, and ask only what the artifact does not
  cover — timeline, phases, cross-cutting concerns, team composition, and
  anything decomposition-specific.
- **Decomposition proposes the full DAG** in one pass: all milestones,
  tasks, and subtasks with their dependencies. The user reviews and can
  request re-decomposition of specific nodes, merging, splitting, or
  re-wiring dependencies.
- **Task node schema** (medium richness): ID, title, description (2–3
  sentences), dependencies, acceptance criteria, effort estimate (S/M/L).
  Tasks are leaves when they can be completed in one focused session
  (typically one PR).
- **One artifact per project** at `plan/<project-slug>/taskgraph.md`. The path
  is announced during the DAG presentation; the file is written only after
  the user confirms. Create the folders if missing.
- **Re-runs update, never restart**: when the task graph already exists,
  treat completed tasks as settled, analyse remaining tasks for relevance,
  and update the graph in place.
- **Plain-text mechanics only**: the interview runs in ordinary markdown
  messages — no harness-specific question or form tools.

The exact procedure, scoping categories, and output template live in the
reference files below — never guess details from this summary.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/decomposition-procedure.md](references/decomposition-procedure.md) | Always, before the first question — the end-to-end procedure from recon through scoping, decomposition, validation, and artifact write. |
| [references/scoping-questionnaire.md](references/scoping-questionnaire.md) | While composing each scoping round — the six project-level categories, example probes, and resolution criteria. |
| [references/task-graph-format.md](references/task-graph-format.md) | Before proposing the DAG and before writing the artifact — the task node schema, document template, path rules, and re-run update rules. |

## How to use

- **Fresh run**: read `decomposition-procedure.md`; do the recon step; run
  the scoping interview in rounds, consulting `scoping-questionnaire.md`
  for coverage; when scoping is complete, decompose and propose the full
  DAG per the procedure; on the user's confirmation, write the artifact per
  `task-graph-format.md`.
- **Re-run**: read the existing `plan/<slug>/taskgraph.md`; analyse it and
  the current state of the project; mark completed tasks; re-scope and
  re-decompose only the remaining work; update the artifact in place per
  `task-graph-format.md`.
