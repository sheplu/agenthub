---
name: quality-gates
description: Review or create a repository's CI quality-gates workflow. Use when setting up CI, reviewing a workflow, or auditing a PR that touches CI configuration.
---

# Quality Gates

Every repository runs a single CI workflow, shaped the same way everywhere.
This skill is the source of truth for that shape: use it to **review** an
existing `quality-gates.yaml` and report deviations, or to **guide the
creation** of one for a repo that has none.

## Core rules at a glance

- Single workflow `.github/workflows/quality-gates.yaml`, name `Quality Gates`,
  `pull_request` → `main`, concurrency `cancel-in-progress: true`, baseline
  `permissions: contents: read`.
- Kebab-case job IDs, tiered display names; jobs: security trio
  (`osv-scan`, `semgrep`, `audit`), `lint`, `typecheck`, `build`, five test
  tiers (`test-unit|integration|smoke|fuzz|e2e`), `coverage-report`, `docs`.
- Runners: `ubuntu-24.04-arm` for all jobs; Semgrep on `ubuntu-24.04` is the
  only exception.
- Pinned runtime, reproducible lockfile installs with dependency caching,
  minimal supply chain; property-based tests fold into the fuzz tier. Concrete
  toolchains are per-runtime references (Node.js is the default runtime).
- Actions pinned by commit SHA (+ version comment); external binaries pinned by
  version + SHA256 checksum.
- Per-tier `coverage-<tier>` lcov artifacts, merged into a sticky PR comment
  (`<!-- <repo>-coverage-report -->`); coverage thresholds and a max package
  size must be configured (numbers are per-repo decisions).
- **CI is always green** — no red-by-design jobs, no `continue-on-error`
  masking (the sticky-comment step is the one sanctioned use).

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/conventions.md](references/conventions.md) | Always, before any review or creation — the full stack-agnostic spec (workflow shape, job catalog, pinning rules, coverage and build conventions, principles). |
| [references/runtimes/nodejs.md](references/runtimes/nodejs.md) | The target repo is Node.js — runtime/install setup, toolchain, job-to-tool mapping, expected npm scripts. Skip for other runtimes (each gets its own file under `references/runtimes/`). |
| [references/review-checklist.md](references/review-checklist.md) | Reviewing an existing workflow or a PR touching one — the 9-step procedure and the deviation-report format. |
| [references/creation-guide.md](references/creation-guide.md) | Bootstrapping a repo that has no workflow yet. |

## How to use

- **Review**: read `conventions.md` + `review-checklist.md`, then the target
  workflow; report each convention as pass/deviation with exact lines and
  fixes, supply-chain issues first.
- **Create**: read `conventions.md` + `creation-guide.md`; land the workflow
  together with whatever makes every job pass, and raise per-repo numbers
  (coverage thresholds, package size budget) with the maintainer instead of
  inventing them.
