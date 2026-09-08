# GitHub Actions — Review Checklist

A 9-step audit procedure for reviewing any GitHub Actions workflow. Use this
when reviewing a PR that adds or modifies a workflow, or when auditing an
existing workflow for best-practice compliance.

## Procedure

Work through every checkpoint in order. For each, record **pass** or
**deviation** with the specific file, line(s), and a concrete fix. Report
security deviations first, then performance, then structural.

### 1. Pinning audit

- [ ] Every `uses:` directive references an action by **full 40-character
  commit SHA** with a `# vX.Y.Z` version comment.
- [ ] No action is pinned by tag (`@v7`) or branch (`@main`).
- [ ] Every external binary downloaded in a `run:` block is pinned by version
  **and** verified by SHA256 checksum before execution.
- [ ] Every tool installed via a package manager (`pipx`, `pip`, `gem`,
  `cargo install`, `npm install -g`, etc.) has an **exact** version pin — no
  semver ranges (`^`, `~`, `>=`).

See: [security.md — Action pinning](security.md#action-pinning),
[Binary pinning](security.md#binary-pinning),
[Scanner and tool version pinning](security.md#scanner-and-tool-version-pinning)

### 2. Permissions audit

- [ ] Workflow-level `permissions:` is set to `contents: read` (or more
  restrictive).
- [ ] No `permissions: write-all` or missing `permissions:` block.
- [ ] Elevated permissions are set **per-job**, not at the workflow level.
- [ ] Every elevated permission has a comment explaining its purpose.

See: [security.md — Permissions model](security.md#permissions-model)

### 3. Injection audit

- [ ] No `${{ }}` expression containing untrusted input appears directly in a
  `run:` block.
- [ ] Untrusted values (`github.event.pull_request.title`,
  `github.event.issue.body`, `github.head_ref`, etc.) are routed through
  `env:` variables, not interpolated into shell scripts.

See: [security.md — Script injection prevention](security.md#script-injection-prevention)

### 4. Secrets audit

- [ ] No secret is passed as a CLI argument in a `run:` block.
- [ ] No secret is `echo`ed or `cat`ed.
- [ ] Secrets are scoped to the job that needs them, not exposed at the
  workflow level.
- [ ] Derived sensitive values use `::add-mask::`.

See: [security.md — Secrets handling](security.md#secrets-handling)

### 5. Cache and install check

- [ ] Dependency cache is enabled via the setup action's built-in cache
  (`cache: npm`, `cache: pip`, etc.).
- [ ] Dependencies are installed from the lockfile (`npm ci`, not
  `npm install`; `pip install -r`, not bare `pip install`).
- [ ] `--prefer-offline` or equivalent is used where supported.
- [ ] Jobs that do not need dependencies do not waste time setting up the
  runtime.

See: [performance.md — Dependency caching](performance.md#dependency-caching)

### 6. Runner check

- [ ] ARM runner (`ubuntu-24.04-arm`) is used by default.
- [ ] Any use of `ubuntu-24.04` (x64) has a documented rationale — a YAML
  comment on the `runs-on:` line is sufficient (e.g.
  `# x64 — Semgrep has no official ARM binary`).
- [ ] No pinning to a non-LTS or deprecated runner image.

See: [performance.md — Runner selection](performance.md#runner-selection)

### 7. Concurrency, timeout, and job-design check

- [ ] Workflow has a `concurrency:` group with `cancel-in-progress: true`
  (for CI gate workflows).
- [ ] The concurrency group key includes both `github.workflow` and
  `github.ref`.
- [ ] Every job has `timeout-minutes` set to a reasonable value (see
  [performance.md — Timeout management](performance.md#timeout-management)
  for recommended starting points).
- [ ] No unnecessary `needs:` — jobs without a real data dependency run in
  parallel.
- [ ] Aggregation jobs (e.g. `coverage-report`) use `if: ${{ !cancelled() }}`
  so they run even when an upstream job fails.
- [ ] Upload and reporting steps use `if: ${{ !cancelled() }}`, **not**
  `if: always()` (which wastes time on cancelled runs).

See: [performance.md — Concurrency groups](performance.md#concurrency-groups),
[Timeout management](performance.md#timeout-management),
[Job parallelism](performance.md#job-parallelism),
[Artifact management](performance.md#artifact-management)

### 8. Fork safety check

Applies to any repository that accepts PRs from forks (open-source repos,
internal repos with external contributors).

- [ ] CI gate workflows use `pull_request` (not `pull_request_target`).
- [ ] If `pull_request_target` is used, it does **not** check out the PR's
  HEAD ref.
- [ ] Write actions after PR events use `workflow_run`, not
  `pull_request_target`.

See: [security.md — Fork safety](security.md#fork-safety)

### 9. Structural check

- [ ] Workflow file uses kebab-case `.yaml` naming (not `.yml`).
- [ ] `name:` is set (workflow name, job names, step names).
- [ ] Job IDs are kebab-case verb phrases.
- [ ] Triggers match the workflow's purpose (`pull_request` for CI gates,
  scoped to protected branches; `push` scoped to specific branches, never
  unscoped).
- [ ] `continue-on-error` is not used except on non-critical reporting steps
  or documented evidence-collection workflows.
- [ ] Artifact `retention-days` is set explicitly (not relying on the 90-day
  default).
- [ ] `run:` blocks with more than one command use `set -euo pipefail`.
- [ ] Shared values (tool versions, paths) use `env:` variables, not
  hardcoded duplicates across `run:` blocks.
- [ ] Key ordering follows the convention (name → on → concurrency →
  permissions → env → jobs; name → runs-on → timeout-minutes → … within
  jobs).
- [ ] Reusable workflow references (`uses: org/repo/…@<ref>`) are SHA-pinned
  like any other action.

See: [conventions.md](conventions.md)

## Reporting format

For each deviation found:

```
[severity] file:line — summary
  Fix: concrete remediation
```

Severity levels:
- **security** — Exploitable or policy-violating (unpinned action, injection,
  secret exposure, overly broad permissions). Report first.
- **performance** — Wasted runner time or cost (missing cache, wrong runner,
  no concurrency, no timeout).
- **convention** — Structural or naming rule violation (wrong file extension,
  camelCase job ID, missing step name).

Order findings: security first, then performance, then convention. Within a
severity level, order by impact.
