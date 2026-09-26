# Rubric: grading the pathfinder run

Grade the transcript and the produced artifact. Every check is pass/fail.
**Overall pass requires all "must" checks; "should" checks are reported but
not blocking.**

## Process checks (from the transcript)

### Scoping phase

| # | Must/Should | Check |
| --- | --- | --- |
| S1 | must | Scoping questions were asked in numbered, batched rounds — not a one-question-at-a-time ping-pong. |
| S2 | must | Every scoping question carried a recommended answer. |
| S3 | must | The vague answer ("we'll just send everything") was probed and the four typed events with JSON Schema registry were extracted — no unscoped "send everything" claim appears in the artifact. |
| S4 | must | The contradiction (real-time streaming vs 15-minute batch) was surfaced explicitly — both statements quoted or restated together — and its resolution recorded (streaming ingestion + materialised view refresh). |
| S5 | must | All six scoping categories (business context & goals, tech stack & architecture, team & resources, timeline & phases, project boundaries, cross-cutting concerns) were visited, or a skip was explicitly confirmed with the user. |
| S6 | must | Scoping was closed before decomposition began — there is a clear transition point in the transcript. |
| S7 | should | "I don't know, you decide" answers were decided by the agent with stated reasoning, and recorded as delegated in the artifact. |
| S8 | should | The agent did not route lookups through the driver — no questions to the driver about the working directory's contents. |

### Decomposition phase

| # | Must/Should | Check |
| --- | --- | --- |
| D1 | must | The full DAG was proposed in one message — not drip-fed task by task. |
| D2 | must | The DAG includes milestones (level 1), tasks (level 2), and subtasks (level 3) where appropriate — not a flat list. |
| D3 | must | Every task has all required fields: id, title, description, depends-on, acceptance criteria, effort, level. |
| D4 | must | A mermaid dependency diagram was included in the DAG presentation. |
| D5 | must | The agent asked the user to confirm the DAG before writing the artifact. |
| D6 | should | A suggested execution order (topological sort) was included. |
| D7 | should | The DAG exploits parallelism — tasks that can run concurrently are not artificially serialised. |

## Artifact checks (from `plan/<slug>/taskgraph.md`)

| # | Must/Should | Check |
| --- | --- | --- |
| A1 | must | Artifact exists at `plan/<project-slug>/taskgraph.md` with a kebab-case slug; no other location. |
| A2 | must | **No invented facts**: every substantive statement traces to a persona answer or a stated agent decision. Any concrete claim absent from both is a fail. |
| A3 | must | Scope summary present with: goals (P95 freshness under 5 min, cron decommissioned), tech stack (Kafka/MSK, ClickHouse, Next.js, Python/Faust, Terraform), team (4 engineers, roles), timeline (MVP mid-Nov, full launch end-Q4), boundaries (ML and alerting out of scope, CSV exports preserved), cross-cutting (80% coverage target, no PII in events, ADR + runbook). |
| A4 | must | The dependency graph is a valid DAG — no circular dependencies. Every `depends-on` reference points to an existing task ID. |
| A5 | must | Every leaf task meets the granularity rule: describable in 2–3 sentences, completable in one session (effort S or M), acceptance criteria testable in isolation. No task with effort > L. |
| A6 | must | Infrastructure tasks (Terraform for MSK, ClickHouse setup) appear before application tasks that depend on them in the execution order. |
| A7 | must | The CSV export backward-compatibility requirement appears — either as a dedicated task or as an acceptance criterion on a migration task. |
| A8 | must | Everything the interview left unsettled appears under Open questions — nothing unsettled is presented as settled. |
| A9 | should | The mermaid diagram in the artifact is consistent with the task list's `depends-on` fields. |
| A10 | should | The scope summary distinguishes MVP tasks from full-launch tasks, consistent with the timeline. |
| A11 | should | The PII stripping requirement appears as an acceptance criterion on the producer library task. |

## Scoring

- **Pass**: all 19 "must" checks pass (S1–S6, D1–D5, A1–A8).
- Persona facts referenced by a "must" check are reachable through the
  skill's category sweep — a run that never asked about them fails those
  checks.
- Report each check with a one-line justification quoting the transcript or
  artifact.
- Report round count (scoping target: ≤ 6; decomposition target: ≤ 2).
- List persona facts that no check references and were never extracted —
  informational only, never failures.
