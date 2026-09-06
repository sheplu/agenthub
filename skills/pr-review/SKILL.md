---
name: pr-review
description: Review a GitHub pull request for correctness, security, and design issues — use when given a PR URL or number, or when asked to review changes before merge.
---

# PR Review

A platform-agnostic skill for reviewing GitHub pull requests. It examines every
meaningful change — file by file, then across files — and produces findings
with severities, categories, and concrete suggested fixes. Output goes to a
local Markdown report or directly to GitHub as a review with inline comments.
Requires the `gh` CLI authenticated against the target repository.

## Core rules at a glance

- **Three parameters**: PR ref (required — full URL or bare number), output mode
  (`local` or `online`, default `local`), review level (`quick`, `standard`, or
  `thorough`, default `standard`). Exact definitions and defaults live in
  `review-procedure.md`; do not restate them from this summary.
- **Hybrid review**: file-by-file pass followed by a cross-file integration pass
  covering caller/callee contracts, consistency, and missing consumer updates.
- Read the **PR description** first for context; read **existing comments and
  reviews** to avoid duplicating feedback and respect resolved discussions.
- **Skip** lockfiles, generated code, doc-only changes, and comment-only diffs —
  unless a change in them is security-critical.
- Tests are reviewed with the **same rigor** as production source code — test
  bugs, tautological assertions, and flaky patterns are real findings.
- **Finding schema**: `file:line`, severity, category, summary, why, fix — the
  exact fields and their definitions live in `severity-guide.md`; never invent
  severity or category values not defined there.
- **Verdict** (always stated): `approve`, `request changes`, or `comment`.
  Online mode posts the GitHub API review event as `COMMENT` regardless of
  verdict — never `APPROVE` or `REQUEST_CHANGES`.
- **Soft cap**: aim for 10–15 most important findings. Prioritization rules live
  in `severity-guide.md`.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/review-procedure.md](references/review-procedure.md) | Always — the step-by-step procedure from parameter parsing through composing and delivering the output. |
| [references/severity-guide.md](references/severity-guide.md) | Before classifying any finding — severity definitions, category definitions, level-based filtering, and the soft-cap rule. |
| [references/report-format.md](references/report-format.md) | Before composing output — the report templates for local mode (Markdown file) and online mode (GitHub review with inline comments). |

## How to use

- **Local** (default): read `review-procedure.md`, execute all steps; consult
  `severity-guide.md` while classifying each finding; format the report per
  `report-format.md` and write it to `reviews/pr-review-<PR>.md` in the
  reviewed project.
- **Online**: same procedure, but compose a single GitHub review with inline
  comments per `report-format.md` and post it via `gh`. The GitHub API review
  event is always `COMMENT`.
