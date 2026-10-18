# Rubric: grading the skill-creator run

Grade the transcript and the scaffolded skill. Every check is pass/fail.
**Overall pass requires all "must" checks; "should" checks are reported but
not blocking.**

## Process checks (from the transcript)

| # | Must/Should | Check |
| --- | --- | --- |
| R1 | must | Recon ran before the first intake question — the agent examined the repo (listed `skills/`, read at least one existing skill or the git history) before asking the driver anything. A run whose first substantive act is a question to the driver fails. |
| R2 | must | Recon findings were presented as pre-filled answers for confirmation — in particular `pr-commit` was found and offered as the domain-adjacent sibling, not asked about cold. |
| R3 | must | Intake questions were asked in numbered, batched rounds with a recommended answer each — not one-question-at-a-time ping-pong — and covered purpose, triggers, and scope. |
| R4 | must | The vague answer ("just make it look professional") was probed and the Keep a Changelog 1.1.0 format with its categories reached the scaffolded files — no "professional-looking" hand-waving in the artifact. |
| R5 | must | The contradiction (every-commit vs users-only) was surfaced explicitly — both statements quoted or restated together — and its resolution (user-facing types only, squashed PR titles) recorded. |
| R6 | must | Inspiration was confirmed, not assumed: 2–3 named candidates from at least two pools were proposed with reasons, the driver's confirmation was obtained BEFORE any candidate was read in depth, and only confirmed candidates were read. |
| R7 | must | 2–3 dry runs were executed in-conversation on driver-approved prompts, each announced with a visible boundary and followed by a feedback request. |
| R8 | must | Each dry-run feedback item (no invented release dates; breaking changes first) produced a visible revision to the skill files before the next run. |
| R9 | must | No files were written and no state-changing commands were run inside a dry-run simulation — simulated outputs appear inline only. |
| R10 | must | The validation checklist was run and its results shown before the skill was declared done, including after the final dry-run revision. |
| R11 | should | The driver's replacement prompt ("prepare the changelog for the 2.3.0 release") was used as given. |
| R12 | should | Nothing repo-discoverable was routed through the driver — no questions about the working directory's contents. |

## Artifact checks (from `skills/changelog/`)

| # | Must/Should | Check |
| --- | --- | --- |
| A1 | must | The scaffold exists at `skills/changelog/` with a kebab-case directory name equal to the frontmatter `name`. |
| A2 | must | Frontmatter has exactly two fields: `name` and `description`. |
| A3 | must | The description follows `<what it does> — use when <triggers>` and quotes at least two persona trigger phrases. |
| A4 | must | SKILL.md has the four sections in order, the verbatim line `Read these on demand — do not guess details from the summary above:`, a `\| File \| Read when \|` table, and is 52–88 lines by `wc -l`. |
| A5 | must | 2–4 reference files, each starting `# Changelog — <Topic>` with a pointer paragraph; table/file bijection holds. |
| A6 | must | The Keep a Changelog format details live in a reference file only — SKILL.md points at them without restating headings or category lists. |
| A7 | must | Scope boundaries are present: release automation (bump/tag/publish) out of scope, and the non-overlap with `pr-commit` stated. |
| A8 | must | Both dry-run feedback items are present in the final files: dates read or asked, never guessed; breaking changes listed first within a version. |
| A9 | must | **No invented facts**: every rule in the scaffold traces to a persona answer, a recon finding, or a decision explicitly recorded as delegated. Any concrete claim absent from all three is a fail. |
| A10 | should | Delegated decisions ("I don't know, you decide" answers) are recorded with the agent's reasoning. |

## Scoring

- **Pass**: all 19 "must" checks pass (R1–R10, A1–A9).
- Persona facts referenced by a "must" check are reachable through the
  skill's recon and intake catalog — a run that never asked about them fails
  those checks.
- Report each check with a one-line justification quoting the transcript or
  artifact.
- Report intake round count (target: ≤ 4) and dry-run count (target: 2–3).
- List persona facts that no check references and were never extracted —
  informational only, never failures.
