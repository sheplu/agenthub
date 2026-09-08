# GitHub Actions — Conventions

Structural and naming rules every GitHub Actions workflow must follow. Read
this (entirely) before writing or reviewing a workflow.

## File naming

Workflow files live in `.github/workflows/` and use **kebab-case** with the
**`.yaml`** extension (not `.yml`):

```
.github/workflows/quality-gates.yaml   ✓
.github/workflows/sast.yaml            ✓
.github/workflows/deploy-staging.yaml  ✓
.github/workflows/CI.yml               ✗  (uppercase, .yml)
.github/workflows/build_and_test.yaml  ✗  (underscores)
```

The file name matches the workflow's purpose. One workflow per file. Avoid
generic names like `ci.yaml` or `main.yaml` — they say nothing about what the
workflow does.

## Workflow name

Set `name:` to a **Title Case**, concise label:

```yaml
name: Quality Gates
name: SAST
name: Dependency Scan
name: Deploy (Staging)
```

The name appears in the GitHub UI (Actions tab, branch protection, PR checks)
and in the concurrency group. It must be unique within the repository.

## Job IDs

Job IDs are **kebab-case verb phrases**:

```yaml
jobs:
  lint:           # ✓
  typecheck:      # ✓
  test-unit:      # ✓
  build:          # ✓
  deploy-staging: # ✓
  runTests:       # ✗  camelCase
  test_unit:      # ✗  underscores
  unit:           # ✗  noun, not a verb phrase
```

**The job ID is a permanent API contract.** Branch protection rules reference
job IDs by name. Renaming a job ID breaks every branch protection rule that
requires it as a status check. Treat job ID changes as breaking changes —
update branch protection in the same PR or coordinate the rename.

## Job display names

Set `name:` on every job to a **short, human-readable label**:

```yaml
jobs:
  test-unit:
    name: Test (Unit)
  test-integration:
    name: Test (Integration)
  build:
    name: Build & Package
  coverage-report:
    name: Coverage Report
  osv-scan:
    name: OSV Scan
```

Display names appear in the GitHub checks UI. Group related jobs by prefix
when applicable: `Test (Unit)`, `Test (Integration)`, `Test (E2E)`.

## Step names

Every step must have a `name:`. Use **imperative** form. Avoid redundancy
with the job name:

```yaml
steps:
  - name: Checkout           # ✓  concise, imperative
  - name: Setup Node         # ✓
  - name: Install Dependencies  # ✓
  - name: Lint               # ✓
  - name: Run lint step      # ✗  redundant with job
  - name: Step 3 - Linting   # ✗  numbered, noun form
```

## Trigger patterns

Choose the trigger that matches the workflow's purpose:

| Trigger | Use for |
| ------- | ------- |
| `pull_request` | CI gates — runs on every PR targeting a protected branch. Safe for forks (see security.md). |
| `push` (to specific branches) | Post-merge actions — deploy, publish, update caches. Trigger on `main` or release branches only. |
| `schedule` | Periodic scans — vulnerability scans, dependency updates, stale-branch cleanup. Uses cron syntax. |
| `workflow_dispatch` | Manual triggers — ad-hoc deploys, release cuts, maintenance tasks. Supports input parameters. |
| `workflow_run` | Post-workflow actions — comment on PR after CI completes, deploy preview after build. Safe for open-source write actions (see security.md). |
| `workflow_call` | Reusable workflows — called by other workflows (see performance.md). |

Rules:
- **Never trigger CI gates on `push` to all branches.** That runs CI on every
  push to every branch, including WIP branches. CI gates belong on
  `pull_request`.
- **Scope `pull_request` to protected branches** (usually just `main`):
  ```yaml
  on:
    pull_request:
      branches:
        - main
  ```
- **Scope `push` to specific branches** — never leave it unscoped:
  ```yaml
  on:
    push:
      branches:
        - main
  ```
- `schedule` workflows only run on the **default branch**. Use them for
  periodic scans that complement PR-triggered scans (e.g. catching CVEs
  disclosed after merge).

## Canonical workflow shape

Every CI gate workflow (quality gates, SAST, dependency scans) must share
this shape:

```yaml
name: <Workflow Name>

on:
  pull_request:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  # …
```

- **`on: pull_request`** targeting the protected branch.
- **`concurrency`** grouped by workflow + ref, cancelling in-progress runs.
- **`permissions: contents: read`** as the workflow-level baseline.

Non-CI workflows (deploys, releases, scheduled tasks) adapt the trigger and
concurrency settings to their purpose, but the permissions baseline still
applies.

## YAML style

- **2-space indentation.** No tabs.
- **No unnecessary quotes.** YAML scalars that are unambiguous strings do not
  need quotes. Use quotes only for values that YAML would misinterpret
  (`'true'`, `'3.14'`, `'on'`).
- **`run: |`** (literal block scalar) for multi-line shell scripts. Never
  `run: >` (folded scalar) — it collapses newlines into spaces, breaking shell
  syntax.
- **`set -euo pipefail`** at the start of every `run:` block that contains
  **more than one command**:
  ```yaml
  - name: Build
    run: |
      set -euo pipefail
      npm run build
      npm pack 2>&1 | tee pack-output.txt
  ```
  `set -e` exits on error. `set -u` exits on unset variables. `set -o
  pipefail` exits if any command in a pipeline fails (not just the last one).
  A step with a single command does not need it — the runner's default error
  handling exits on non-zero already.
- **Consistent key ordering** within each block:
  - Workflow level: `name` → `on` → `concurrency` → `permissions` → `env` →
    `jobs`
  - Job level: `name` → `runs-on` → `timeout-minutes` → `permissions` →
    `needs` → `if` → `env` → `steps`
  - Step level: `name` → `id` → `if` → `uses`/`run` → `with`/`env` →
    `continue-on-error`

## Workflow organization

Group jobs into **separate workflow files by concern**:

- **CI gates** (lint, typecheck, build, test) in one file.
- **Security scans** (SAST, dependency scanning) in dedicated files.
- **Deployment** in its own file.
- **Release/publish** in its own file.

Each file must be independently comprehensible. A reviewer reading
`sast.yaml` must not need to cross-reference `quality-gates.yaml` to
understand what it does.

The specific file split for CI gate jobs (which jobs belong in which file) is
defined by the **quality-gates** skill — refer to it for the canonical split.

## `continue-on-error`

**Avoid.** A step or job marked `continue-on-error: true` swallows failures
silently. This masks real problems and produces green CI on broken code.

The **only sanctioned uses**:

1. A **non-critical reporting step** whose failure must not block the gate:
   ```yaml
   - name: Post Coverage Comment
     if: ${{ !cancelled() }}
     continue-on-error: true   # commenting failure must not block the gate
     run: |
       # … post sticky PR comment …
   ```

2. An **evidence-collection workflow** (compliance scans, audit trails) where
   the purpose is to generate and aggregate results regardless of individual
   scan outcomes. In this case, error suppression (`continue-on-error` or
   `|| true`) is acceptable **when documented with a comment explaining why**
   and the downstream aggregation handles gaps. This does not apply to gate
   workflows — a CI gate must never suppress failures.

Every other step and job must fail loudly. If a check cannot pass yet, it does
not ship yet — do not mask it with `continue-on-error`.

## Environment variables

Define shared values (tool versions, paths, feature flags) as **`env:`**
variables at the job or step level:

```yaml
jobs:
  scan:
    env:
      OSV_VERSION: 2.5.0
      OSV_SHA256: fe152e1a546af223e6c557cc3111a8bb3e5dc02fcbf7dbe95d26567c0f0041f2
    steps:
      - name: Download Scanner
        run: |
          curl -sSLo osv-scanner \
            "https://…/v${OSV_VERSION}/osv-scanner_linux_arm64"
          echo "${OSV_SHA256}  osv-scanner" | sha256sum -c -
```

Rules:
- Never hardcode the same value in multiple `run:` blocks — factor it into
  `env:`.
- Prefer **step-level `env:`** over job-level when the variable is only used
  in one step.
- Prefer **job-level `env:`** over workflow-level when the variable is only
  used in one job.
- Never use workflow-level `env:` for secrets — scope them to the job (see
  security.md).
