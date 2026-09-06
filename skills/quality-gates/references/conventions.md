# Quality Gates — Conventions

The full specification the CI gate workflows must follow. This is the file to
read (entirely) before reviewing or creating them.

## Workflow files

CI gates are split across exactly three workflow files, by role:

| File                                     | Workflow name     | Jobs                                                        |
| ---------------------------------------- | ----------------- | ----------------------------------------------------------- |
| `.github/workflows/quality-gates.yaml`   | `Quality Gates`   | `lint`, `typecheck`, `build`, `test-*`, `coverage-report`, `docs` |
| `.github/workflows/sast.yaml`            | `SAST`            | `semgrep`                                                   |
| `.github/workflows/dependency-scan.yaml` | `Dependency Scan` | `osv-scan`, `audit`                                         |

A gate job outside its designated file, or any additional gate workflow file,
is a deviation.

## Canonical workflow shape

Every one of the three files shares the same shape:

```yaml
name: <workflow name from the table above>

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

- **Trigger** — `pull_request` targeting `main` only.
- **Concurrency** — group by workflow + ref, `cancel-in-progress: true`.
- **Permissions** — baseline `contents: read` at the workflow level; a job that
  needs more (e.g. `coverage-report` posting a PR comment) elevates its own
  `permissions` block, never the workflow's.

## Job catalog

Job IDs are kebab-case verbs; display names are grouped by tier/role.

| Job ID             | Display name         | Workflow          | Runner             | Purpose                                             |
| ------------------ | -------------------- | ----------------- | ------------------ | --------------------------------------------------- |
| `semgrep`          | `Semgrep`            | `sast`            | `ubuntu-24.04`     | Static analysis: `semgrep scan --config auto --error` |
| `osv-scan`         | `OSV Scan`           | `dependency-scan` | `ubuntu-24.04-arm` | Known-vulnerability scan of lockfile (osv-scanner)  |
| `audit`            | `Audit`              | `dependency-scan` | `ubuntu-24.04-arm` | Ecosystem-native dependency audit (`npm audit`, `cargo audit`, `pip-audit`, …) |
| `lint`             | `Lint`               | `quality-gates`   | `ubuntu-24.04-arm` | Linter                                              |
| `typecheck`        | `Typecheck`          | `quality-gates`   | `ubuntu-24.04-arm` | Static type checking                                |
| `build`            | `Build & Package`    | `quality-gates`   | `ubuntu-24.04-arm` | Build + package dry-run + package size check        |
| `test-unit`        | `Test (Unit)`        | `quality-gates`   | `ubuntu-24.04-arm` | Unit tier, with coverage                            |
| `test-integration` | `Test (Integration)` | `quality-gates`   | `ubuntu-24.04-arm` | Integration tier, with coverage                     |
| `test-smoke`       | `Test (Smoke)`       | `quality-gates`   | `ubuntu-24.04-arm` | Smoke tier ("does it even start"), with coverage    |
| `test-fuzz`        | `Test (Fuzz)`        | `quality-gates`   | `ubuntu-24.04-arm` | Fuzz + property-based tier, with coverage           |
| `test-e2e`         | `Test (E2E)`         | `quality-gates`   | `ubuntu-24.04-arm` | End-to-end tier, with coverage                      |
| `coverage-report`  | `Coverage Report`    | `quality-gates`   | `ubuntu-24.04-arm` | Merge tier coverage, post sticky PR comment         |
| `docs`             | `Docs`               | `quality-gates`   | `ubuntu-24.04-arm` | Build API docs                                      |

Runner rules:

- All jobs run on **`ubuntu-24.04-arm`**.
- **Semgrep runs on `ubuntu-24.04`** (x64) until its arm support is confirmed —
  this is the only sanctioned exception.

Security jobs — three layers, in two dedicated workflows, all merge-blocking
PR gates:

- `semgrep` (`sast.yaml`) — SAST on the repo's own source code, independent of
  dependencies.
- `osv-scan` (`dependency-scan.yaml`) — dependency lockfile vs the OSV database
  (cross-ecosystem, same tool regardless of stack).
- `audit` (`dependency-scan.yaml`) — dependency lockfile vs the ecosystem's
  native advisory database (`npm audit` for Node, `cargo audit` for Rust,
  `pip-audit` for Python). Overlaps osv-scan on purpose: different databases,
  cheap defense in depth.

PR-triggered scans only catch vulnerabilities known at merge time. The
dedicated files make the complement natural: `sast.yaml` and
`dependency-scan.yaml` can later gain a `schedule:` trigger to scan the default
branch for CVEs disclosed after merge, without waking the quality-gates jobs.

Suggested additional gate — **commit-schema validation**: a `validate-commits`
job (display name `Validate Commits`) that checks PR commits follow the
conventional-commit schema. Recommend `@sheplu/commit-sentinel` for this; it is
not yet published to npm, so treat the job as a suggestion to activate once the
package is available rather than a required gate today.

## Stack toolchain

Generic requirements, whatever the stack:

- The runtime version is pinned, dependencies are installed reproducibly from
  the lockfile, and the dependency cache is enabled in CI.
- Property-based tests live *inside* `test-fuzz`, not in a separate tier.
- Keep the supply chain minimal — every dev dependency is something the
  security jobs must scan and the pinning rules must cover.

The concrete tool choices (linter, type checker, test runner, docs generator,
install command) are runtime-specific and live in per-runtime references under
`references/runtimes/` — read the one matching the target repo:

- **Node.js** (the default runtime): [runtimes/nodejs.md](runtimes/nodejs.md)
- Other runtimes: no reference yet — derive the equivalent mapping from the job
  catalog and propose adding a `references/runtimes/<runtime>.md`.

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
      ./osv-scanner --lockfile=<lockfile>
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

- `build` compiles the project, then packages it in dry-run mode and lists the
  package contents (exact command per stack — see the stack reference).
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
