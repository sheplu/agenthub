# Rubric: grading the skill-creator run

Grade the transcript and the scaffolded skill. Every check is pass/fail.
**Overall pass requires all "must" checks; "should" checks are reported but
not blocking.**

## Process checks (from the transcript)

| # | Must/Should | Check |
| --- | --- | --- |
| R1 | must | Recon ran before the first intake question — the agent examined the repo (listed `skills/`, read at least one existing skill or the git history) before asking the driver anything. A run whose first substantive act is a question to the driver fails. |
| R2 | must | Recon findings were presented as pre-filled answers for confirmation — in particular `pr-commit` was found and offered as the domain-adjacent sibling, not asked about cold. |
| R3 | must | Intake questions were asked in numbered, batched rounds — each carrying a recommended answer or an explicit "no recommendation" — not one-question-at-a-time ping-pong — and covered purpose, triggers, and scope. |
| R4 | must | The vague answer ("just make it look professional") was probed and the Keep a Changelog 1.1.0 format with its categories reached the scaffolded files — no "professional-looking" hand-waving in the artifact. |
| R5 | must | The contradiction (every-commit vs users-only) was surfaced explicitly — both statements quoted or restated together — and its resolution (user-facing types only, squashed PR titles) recorded. |
| R6 | must | Inspiration was confirmed, not assumed: named candidates with reasons and a recommended pick were proposed from every pool in which the agent could name one, with unnameable or unreachable pools noted as skipped per the workflow (offline runs grade on locally available pools alone); the driver's confirmation was obtained BEFORE any candidate was read in depth as inspiration — recon and portability-detection reads are exempt — and only confirmed candidates were read as inspiration. |
| R7 | must | Three dry runs were executed in-conversation on driver-approved prompts, each announced with a visible boundary and followed by a feedback request — the persona scripts feedback after runs 1 and 2, so finishing on a clean run requires the third; stopping earlier fails this check. |
| R8 | must | Each dry-run feedback item (no invented release dates; breaking changes first) produced a visible revision to the skill files before the next run. |
| R9 | must | No files were written and no state-changing commands were run inside a dry-run simulation — simulated outputs appear inline only. |
| R10 | must | The validation checklist was run and its results shown before the skill was declared done, including after the final dry-run revision. |
| R11 | should | The driver's replacement prompt ("prepare the changelog for the 2.3.0 release") was used as given. |
| R12 | should | Nothing repo-discoverable was routed through the driver — no questions about the working directory's contents. |

## Artifact checks (from `skills/changelog/`)

Structure rows apply `../references/validation-checklist.md` — readable from
the checkout, since only `eval/` is stripped — rather than restating it.

| # | Must/Should | Check |
| --- | --- | --- |
| A1 | must | The scaffold exists at `skills/changelog/` and passes checklist rows S1 and S11. |
| A2 | must | The frontmatter passes checklist row S2. |
| A3 | must | The description passes checklist row S3 and works in at least two persona trigger phrases, quoted where used. |
| A4 | must | SKILL.md passes checklist rows S4–S6, S9, and S10. |
| A5 | must | The reference files pass checklist rows S7 and S8, and each passes C2 with headers reading `# Changelog — <Topic>`. |
| A6 | must | The Keep a Changelog format details live in a reference file only — SKILL.md points at them without restating headings or category lists. |
| A7 | must | Scope boundaries are present: release automation (bump/tag/publish) out of scope, and the non-overlap with `pr-commit` stated. |
| A8 | must | Both dry-run feedback items are present in the final files: dates read or asked, never guessed; breaking changes listed first within a version. |
| A9 | must | **No invented facts**: every rule in the scaffold traces to one of checklist C5's provenance sources (persona answers standing in for user-confirmed intake). Any concrete claim outside them is a fail. |
| A10 | should | Delegated decisions ("I don't know, you decide" answers) are recorded with the agent's reasoning — in the artifact or the finalize summary. |

## Scoring

- **Pass**: every "must" check passes (R1–R10, A1–A9).
- Persona facts referenced by a "must" check are reachable through the
  skill's recon and intake catalog — a run that never asked about them fails
  those checks.
- Report each check with a one-line justification quoting the transcript or
  artifact.
- Report intake round count (target: ≤ 4) and dry-run count (target: 3).
- List persona facts that no check references and were never extracted —
  informational only, never failures.
