---
name: github-actions
description: Author or review GitHub Actions workflows following security, performance, and structural best practices — use when writing a new workflow, reviewing a PR that touches CI, or auditing an existing pipeline.
---

# GitHub Actions

A platform-level skill for authoring and reviewing GitHub Actions workflows.
It covers how to write _any_ workflow well — security hardening, performance
optimization, and structural conventions — regardless of what the workflow
does (CI gates, deployments, releases, scheduled scans, …). Applies equally
to open-source and internal/company repositories.

For the _catalog of CI gate jobs_ (which jobs to have, which workflow file
each belongs in, coverage and build conventions), see the separate
**quality-gates** skill. This skill and quality-gates are complementary:
quality-gates decides _what_ to run; this skill decides _how_ to write it.

## Core rules at a glance

### Security

- **Pin every action by full commit SHA** with a `# vX.Y.Z` version comment —
  never by tag or branch. Tags are mutable; a compromised upstream can retag.
- **Pin external binaries** by version + SHA256 checksum, verified before
  execution. No `curl | bash`, no unverified downloads.
- **Pin scanner/tool installs** to an explicit version (`pipx install
  semgrep==1.75.0`). Never install floating latest.
- **Minimal permissions**: workflow-level `permissions: contents: read`; jobs
  that need more elevate their own block, never the workflow's.
- **No script injection**: never interpolate `${{ }}` expressions directly in
  `run:` blocks — route them through `env:` variables instead.
- **Secrets via `env:`**, never in CLI arguments. Never echo a secret.

### Performance

- **Cache dependencies** via the setup action's built-in cache (`cache: npm`,
  `cache: pip`). Install from the lockfile, never from a floating resolver.
- **Concurrency group** on every workflow: `cancel-in-progress: true`.
- **ARM runners** (`ubuntu-24.04-arm`) by default; x64 only when a tool
  requires it (document the exception).
- **Parallel by default**: jobs without `needs:` run concurrently. Reserve
  `needs:` for genuine data dependencies.
- Set **`timeout-minutes`** on every job.

### Conventions

- Workflow files: **kebab-case `.yaml`**. Job IDs: **kebab-case verbs**.
  Display names: **Title Case**, grouped by tier where applicable.
- Every CI gate workflow shares the **canonical shape**: `pull_request` →
  `main`, concurrency, `permissions: contents: read`.
- `run: |` with **`set -euo pipefail`** for every block containing more than
  one command.
- **No `continue-on-error`** except on non-critical reporting steps (e.g.
  posting a PR comment).

The exact rules, rationale, and YAML examples live in the reference files
below — never guess details from this summary.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/security.md](references/security.md) | Always, before writing or reviewing any workflow — action/binary pinning, permissions, injection prevention, secrets, fork safety, OIDC. |
| [references/performance.md](references/performance.md) | Optimizing runner cost and wall-clock time — caching, concurrency, runner selection, parallelism, artifacts, matrices, timeouts. |
| [references/conventions.md](references/conventions.md) | Naming, structure, triggers, YAML style, workflow organization — the structural rules every workflow must follow. |
| [references/review-checklist.md](references/review-checklist.md) | Reviewing an existing workflow or a PR that touches one — the 9-step audit procedure and deviation-report format. |

## How to use

- **Author**: read `security.md` + `performance.md` + `conventions.md`; write
  the workflow following all rules; self-review against `review-checklist.md`
  before opening the PR.
- **Review**: read `review-checklist.md` and the relevant references; audit
  the target workflow; report each checkpoint as pass/deviation with the
  specific line(s) and a concrete fix, security issues first.
