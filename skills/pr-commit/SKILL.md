---
name: pr-commit
description: Author commits and pull requests that follow the house conventions — use when committing changes, writing a commit message, or opening or updating a pull request in any repository.
---

# PR Commit

An authoring skill for git commits and pull requests. It encodes the house
conventions — Conventional Commits at the strictness of commit-sentinel's
`hardened` preset, plus PR title/body and merge rules — and enforces them as
hard gates: a message that fails validation is never committed, a branch that
fails validation never becomes a PR. Enforcement runs through
[commit-sentinel](https://github.com/sheplu/commit-sentinel); when the tool is
unavailable the same rules are applied manually.

## Core rules at a glance

- **Format**: `type(scope): subject` — scope **required**, body **required**,
  commit **signed**. Exact limits, the type list, and every rule's threshold
  live in `commit-rules.md`; do not restate them from this summary.
- **Three hard gates**: validate the drafted message *before* `git commit`;
  validate the whole branch (`--base`) *before* opening or updating a PR;
  validate the PR title as a commit header (squash-merge makes it one).
- **Never bypass**: a failed gate means fix the message and re-validate —
  no `--no-verify`, no committing first and fixing later.
- **Signing is a stop condition**: if the environment cannot sign commits,
  stop and ask the user — never commit unsigned. Setup for every signing type
  is in `commit-rules.md`.
- **Atomic commits** — one logical change each; never mix refactors with
  behavior changes.
- **PRs are short and focused**: conventional title, body is a Summary
  (linking the issue) plus a Breaking-changes section *only when something
  breaks*. One concern per PR; squash-merge; details in `pr-rules.md`.
- **Branch names**: never use an AI-harness prefix (`claude/`, `vibe/`, …);
  otherwise any short descriptive name.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/commit-rules.md](references/commit-rules.md) | Always, before drafting any commit message — the full ruleset, the validation procedure and its gates, the manual fallback checklist, and commit signing setup. |
| [references/pr-rules.md](references/pr-rules.md) | Before creating a branch or opening/updating a pull request — branch naming, PR title/body format, scope and process rules, merge strategy. |

## How to use

- **Committing**: read `commit-rules.md`; draft the message; run gate 1
  (validate the draft), commit signed, run gate 1b (validate `HEAD`); on any
  failure fix and re-validate before proceeding.
- **Opening or updating a PR**: read `pr-rules.md`; run gate 2 (validate the
  branch against the base) and gate 3 (validate the PR title); compose the
  body per the template; self-review the diff before requesting review.
