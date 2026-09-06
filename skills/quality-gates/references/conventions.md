# Quality Gates — Conventions

The full specification a `quality-gates.yaml` must follow. This is the file to
read (entirely) before reviewing or creating a workflow.

## Canonical workflow shape

One file: `.github/workflows/quality-gates.yaml`.

```yaml
name: Quality Gates

on:
  pull_request:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
```

- **Single workflow** — do not split gates across multiple workflow files.
- **Trigger** — `pull_request` targeting `main` only.
- **Concurrency** — group by workflow + ref, `cancel-in-progress: true`.
- **Permissions** — baseline `contents: read` at the workflow level; a job that
  needs more (e.g. `coverage-report` posting a PR comment) elevates its own
  `permissions` block, never the workflow's.

## Job catalog

Job IDs are kebab-case verbs; display names are grouped by tier/role.

| Job ID             | Display name         | Runner             | Purpose                                             |
| ------------------ | -------------------- | ------------------ | --------------------------------------------------- |
| `osv-scan`         | `OSV Scan`           | `ubuntu-24.04-arm` | Known-vulnerability scan of lockfile (osv-scanner)  |
| `semgrep`          | `Semgrep`            | `ubuntu-24.04`     | Static analysis: `semgrep scan --config auto --error` |
| `audit`            | `Audit`              | `ubuntu-24.04-arm` | Ecosystem-native dependency audit (`npm audit`, `cargo audit`, `pip-audit`, …) |
| `lint`             | `Lint`               | `ubuntu-24.04-arm` | Linter (`npm run lint`)                             |
| `typecheck`        | `Typecheck`          | `ubuntu-24.04-arm` | `tsc --noEmit` (`npm run typecheck`)                |
| `build`            | `Build & Package`    | `ubuntu-24.04-arm` | Build + `npm pack` dry-run + package size check     |
| `test-unit`        | `Test (Unit)`        | `ubuntu-24.04-arm` | Unit tier, with coverage                            |
| `test-integration` | `Test (Integration)` | `ubuntu-24.04-arm` | Integration tier, with coverage                     |
| `test-smoke`       | `Test (Smoke)`       | `ubuntu-24.04-arm` | Smoke tier ("does it even start"), with coverage    |
| `test-fuzz`        | `Test (Fuzz)`        | `ubuntu-24.04-arm` | Fuzz + property-based tier, with coverage           |
| `test-e2e`         | `Test (E2E)`         | `ubuntu-24.04-arm` | End-to-end tier, with coverage                      |
| `coverage-report`  | `Coverage Report`    | `ubuntu-24.04-arm` | Merge tier coverage, post sticky PR comment         |
| `docs`             | `Docs`               | `ubuntu-24.04-arm` | Build API docs (`npm run docs:build`)               |

Runner rules:

- Node jobs run on **`ubuntu-24.04-arm`**.
- **Semgrep runs on `ubuntu-24.04`** (x64) until its arm support is confirmed —
  this is the only sanctioned exception.

Security jobs — three layers, all in this same workflow because all three are
merge-blocking PR gates:

- `osv-scan` — dependency lockfile vs the OSV database (cross-ecosystem, same
  tool regardless of stack).
- `audit` — dependency lockfile vs the ecosystem's native advisory database
  (`npm audit` for Node, `cargo audit` for Rust, `pip-audit` for Python).
  Overlaps osv-scan on purpose: different databases, cheap defense in depth.
- `semgrep` — SAST on the repo's own source code, independent of dependencies.

PR-triggered scans only catch vulnerabilities known at merge time; a scheduled
scan of the default branch (for CVEs disclosed after merge) is a complementary
*separate* workflow, not part of quality-gates.

Suggested additional gate — **commit-schema validation**: a `validate-commits`
job (display name `Validate Commits`) that checks PR commits follow the
conventional-commit schema. Recommend `@sheplu/commit-sentinel` for this; it is
not yet published to npm, so treat the job as a suggestion to activate once the
package is available rather than a required gate today.

## Toolchain defaults

For Node repositories (the default stack):

- **Node 24** via `actions/setup-node` with `node-version: 24` and `cache: npm`.
- Install with `npm ci --prefer-offline` — never `npm install` in CI.
- **TypeScript 7** run natively (Node type-stripping) — no build step needed to
  execute `.ts` sources; `typecheck` is `tsc --noEmit`.
- **oxlint** for `lint`.
- **`node:test`** native runner for all test tiers — no test-framework
  dependency.
- **fast-check** for the fuzz tier; property-based tests live *inside*
  `test-fuzz`, not in a separate tier.
- **typedoc** (or a jsdoc equivalent) for `docs`.

The intent: the smallest possible supply chain — dev dependencies should be
roughly `typescript`, `oxlint`, `typedoc`, `fast-check`, `@types/node` and
little else.

## Pinning rules

- **GitHub Actions are pinned by full commit SHA**, never by tag or branch, with
  the version noted in a trailing comment:

  ```yaml
  uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  ```

  A tag-pinned (`@v7`) or branch-pinned (`@main`) action is a deviation.

- **External binaries are pinned by version AND SHA256 checksum**, verified
  before execution (the OSV pattern):

  ```yaml
  - name: OSV Scan
    env:
      OSV_VERSION: 2.5.0
      OSV_SHA256: <sha256 of the release binary>
    run: |
      set -euo pipefail
      curl -sSLo osv-scanner "https://github.com/google/osv-scanner/releases/download/v${OSV_VERSION}/osv-scanner_linux_arm64"
      echo "${OSV_SHA256}  osv-scanner" | sha256sum -c -
      chmod +x osv-scanner
      ./osv-scanner --lockfile=package-lock.json
  ```

  A `curl | bash`, an unverified download, or a package installed from a
  floating tag is a deviation.

## Coverage conventions

- Every test tier runs with coverage and uploads an lcov artifact named
  `coverage-<tier>` (e.g. `coverage-unit`), using `if: ${{ !cancelled() }}` so
  a failing tier still uploads what it measured.
- `coverage-report` has `needs:` on all five tiers, runs
  `if: ${{ !cancelled() }}`, downloads `coverage-*` artifacts, merges them, and
  posts the result as a **sticky PR comment**: a single comment identified by a
  marker on its first line — `<!-- <repo>-coverage-report -->` (e.g.
  `<!-- agenthub-coverage-report -->`) — updated in place on every run, never a
  new comment per run.
- `coverage-report` elevates only its own permissions
  (`pull-requests: write`), and the comment step is `continue-on-error: true`
  so a commenting hiccup never turns the gate red.
- **Coverage thresholds must be configured** on at least the unit tier
  (lines/branches/functions). The numbers are a per-repo decision — but a
  workflow whose test tiers enforce no threshold at all is a deviation to flag.

## Build & Package conventions

- `build` compiles the project, then runs an `npm pack` dry-run and lists the
  tarball contents.
- **A maximum package size must be enforced** — the job fails if the tarball
  exceeds the repo's budget. The number is per-repo; its *absence* is a
  deviation to flag.

## Principles

- **CI is always green.** Every job in the workflow must be able to pass on the
  day it lands. No permanently red jobs, no `continue-on-error` used to mask a
  failing gate (the sticky-comment step is the one sanctioned use), no jobs
  disabled with `if: false` as a placeholder. If a gate cannot pass yet, it
  does not ship yet.
- New checks should land together with whatever makes them pass.
