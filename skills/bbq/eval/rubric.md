# Rubric: grading the bbq run

Grade the transcript and the produced artifact. Every check is pass/fail.
**Overall pass requires all "must" checks; "should" checks are reported but
not blocking.**

## Process checks (from the transcript)

| # | Must/Should | Check |
| --- | --- | --- |
| P1 | must | Questions were asked in numbered, batched rounds — not a one-question-at-a-time ping-pong. |
| P2 | must | Every question carried a recommended answer. |
| P3 | must | The vague answer ("it needs to feel snappy") was probed and the 2-second/VPN figure extracted — no unquantified performance claim appears in the artifact. |
| P4 | must | The contradiction (everyone edits vs. captain-only sign-off) was surfaced explicitly — both statements quoted or restated together — and its resolution recorded. |
| P5 | must | All six categories (goals & success criteria, users & stakeholders, domain & language, architecture & integration, constraints & non-goals, edge cases & risks) were visited, or a skip was explicitly confirmed with the user. |
| P6 | must | A full playback of the understanding was presented, and the artifact was written only after the driver confirmed it. |
| P7 | must | The agent built nothing: despite the opening "can you set that up?", no code was written and no file was created other than the artifact — the request was answered with an interview, not scaffolding. |
| P8 | should | "I don't know, you decide" answers were decided by the agent with stated reasoning, and recorded as delegated in the artifact. |
| P9 | should | The agent did not route lookups through the driver — no questions to the driver about the working directory's contents, and no requests for permission to inspect the environment. |

## Artifact checks (from `plan/<slug>/context.md`)

| # | Must/Should | Check |
| --- | --- | --- |
| A1 | must | Artifact exists at `plan/<subject-slug>/context.md` with a kebab-case slug; no other location. |
| A2 | must | **No invented facts**: every substantive statement traces to a persona answer or a stated agent decision. Any concrete claim absent from both (a stack choice presented as the user's, a made-up metric) is a fail. |
| A3 | must | Project brief present with goals, success criteria (the zero-missed-items-per-quarter signal), users (release captain, 6 SREs, compliance vetoer), and non-goals (not a general todo app; releases out of scope). |
| A4 | must | Domain glossary distinguishes *deployment* (one ArgoCD sync, one service) from *release*, and defines *checklist* as a versioned per-service template. |
| A5 | must | Decisions & constraints include: self-hosted only (hard, compliance), webhook-driven (no polling), rollback checklists, manual-checklist fallback when webhooks are down, and the resolved sign-off permission model. |
| A6 | must | Everything the interview left unsettled appears under Open questions — nothing unsettled is presented as settled. Consciously skipped categories are noted under Resolved questions, per the skill's output format. |
| A7 | should | Delegated decisions are marked as agent-recommended/user-delegated, not attributed to the user. |

## Scoring

- **Pass**: all 13 "must" checks pass.
- Persona facts referenced by a "must" check are reachable through the
  skill's category sweep — a run that never asked about them fails those
  checks; that is the point, not bad luck.
- Report each check with a one-line justification quoting the transcript or
  artifact.
- Report round count (target: ≤ 8), and list persona facts that no check
  references and were never extracted — those are informational only, never
  failures.
