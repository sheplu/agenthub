# GitHub Actions — Performance

Caching, runner selection, concurrency, and job design rules for keeping
workflows fast and cost-efficient. Read the sections relevant to the workflow
you are authoring or reviewing.

## Dependency caching

Always enable the **built-in cache** in the official setup action for the
runtime:

```yaml
- uses: actions/setup-node@<sha> # vX.Y.Z
  with:
    node-version: 24
    cache: npm
```

Equivalent for other ecosystems:

| Runtime | Setup action | Cache key |
| ------- | ------------ | --------- |
| Node.js | `actions/setup-node` | `cache: npm` (or `yarn`, `pnpm`) |
| Python  | `actions/setup-python` | `cache: pip` |
| Go      | `actions/setup-go` | `cache: true` (default since v5) |
| Rust    | `Swatinem/rust-cache` (third-party) | Auto-detected |
| Java    | `actions/setup-java` | `cache: maven` (or `gradle`, `sbt`) |

Rules:
- Install from the **lockfile**, never from a floating resolver. `npm ci`,
  not `npm install`. `pip install -r requirements.txt`, not bare `pip install
  <pkg>`. `cargo build --locked`, not `cargo build`.
- Add **`--prefer-offline`** where supported (`npm ci --prefer-offline`) to
  skip registry checks when the cache is warm.
- If a job does not install dependencies (e.g. a pure shell-script job), do
  not set up the runtime just for caching — that wastes time.

## Concurrency groups

Every workflow must set a concurrency group that cancels superseded runs:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

This ensures that pushing a new commit to a PR branch cancels the still-running
CI from the previous push, saving runner minutes and avoiding stale results.

- The group key **must include the workflow name** (`github.workflow`) so
  different workflows on the same ref do not cancel each other.
- The group key **must include the ref** (`github.ref`) so runs on different
  branches/PRs do not cancel each other.
- **`cancel-in-progress: true`** is required for CI gate workflows. For
  deployment workflows, set it to `false` to prevent a half-finished deploy
  from being cancelled by a subsequent push.

## Runner selection

Default to **`ubuntu-24.04-arm`** (GitHub-hosted Arm runners):

```yaml
jobs:
  lint:
    runs-on: ubuntu-24.04-arm
```

Arm runners are cheaper (by GitHub's pricing) and faster for most workloads
(single-threaded performance parity, better energy efficiency, more
concurrent jobs within the same spend).

Use **`ubuntu-24.04`** (x64) only when a tool explicitly lacks Arm support.
Document the exception with a comment:

```yaml
jobs:
  semgrep:
    name: Semgrep
    runs-on: ubuntu-24.04  # x64 — Semgrep has no official ARM binary
```

### Self-hosted runners (internal repos)

For internal/company repositories using self-hosted runners:
- Pin the runner label to a specific OS version, not just `self-hosted`.
- Ensure the runner image is hardened and ephemeral (no state carried between
  jobs).
- Prefer organization-level runner groups over repository-level runners for
  centralized management.
- The same security rules apply — self-hosted runners do not exempt a workflow
  from action pinning or permission scoping.

## Job parallelism

Jobs in a workflow run in **parallel by default**. A job runs sequentially
only when it declares `needs:`.

Design the dependency graph to maximize parallelism:

```
┌─────────┐  ┌───────────┐  ┌───────┐  ┌────────────┐  ┌────────────┐
│  lint   │  │ typecheck  │  │ build │  │ test-unit  │  │ test-fuzz  │  ← all parallel
└─────────┘  └───────────┘  └───────┘  └─────┬──────┘  └─────┬──────┘
                                              │               │
                                        ┌─────┴───────────────┴─────┐
                                        │    coverage-report        │  ← needs: [test-*]
                                        └───────────────────────────┘
```

Rules:
- **Lint, typecheck, build, and each test tier** run in parallel —
  they have no data dependency on each other.
- **Aggregation jobs** (`coverage-report`) declare `needs:` on the jobs whose
  output they consume.
- Never add a `needs:` that does not reflect a real data dependency. A lint
  job does not need to wait for tests to finish.
- Use `if: ${{ !cancelled() }}` on aggregation jobs so they still run even
  if an upstream job fails — partial results are better than no results.

## Artifact management

Upload artifacts only when downstream jobs or humans need them:

```yaml
- name: Upload Coverage
  if: ${{ !cancelled() }}
  uses: actions/upload-artifact@<sha> # vX.Y.Z
  with:
    name: coverage-unit
    path: coverage/unit.lcov
    retention-days: 7
```

Rules:
- Set **`retention-days`** explicitly. The default (90 days) is excessive for
  CI artifacts. Use 7–14 days for coverage reports, test results, and build
  artifacts that are only needed for the PR lifecycle.
- Use **`if: ${{ !cancelled() }}`** on upload and reporting steps so partial
  results survive a failing job (e.g. coverage from a test tier where some
  tests failed). **Never use `if: always()`** — it runs the step even when the
  workflow is cancelled, wasting runner time on a user-cancelled run.
  `!cancelled()` is the correct guard: it runs on success and failure but skips
  on cancellation.
- Name artifacts descriptively (`coverage-unit`, `build-output`) — the name
  is the only identifier in the GitHub UI and in downstream `download-artifact`
  steps.
- Use **`merge-multiple: true`** in `download-artifact` when merging multiple
  artifacts of the same pattern (`coverage-*`).

## Matrix strategies

Use `matrix:` for multi-version or multi-platform testing:

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [22, 24]
        os: [ubuntu-24.04-arm, macos-15]
      fail-fast: false
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@<sha>
        with:
          node-version: ${{ matrix.node-version }}
```

Rules:
- Set **`fail-fast: false`** when you want all matrix combinations to finish.
  The default (`true`) cancels remaining combinations when one fails, which
  hides failures on other platforms/versions.
- Keep the matrix small. Each entry is a separate job with its own runner
  startup, checkout, and dependency install overhead. A 3×3 matrix is 9 jobs.
- For CI gate workflows (PRs), test the **primary version only** (the one in
  production). Move multi-version testing to a scheduled workflow or a
  pre-release gate.

## Timeout management

Set `timeout-minutes` on every job:

```yaml
jobs:
  lint:
    runs-on: ubuntu-24.04-arm
    timeout-minutes: 10
```

The default timeout is **6 hours** per job — far too long for any CI gate.
A lint job should finish in under 5 minutes; a test suite in under 15. If a
job regularly approaches its timeout, something is wrong.

Recommended starting points:

| Job type | Timeout |
| -------- | ------- |
| Lint / typecheck | 10 min |
| Build | 15 min |
| Unit / integration tests | 15 min |
| E2E tests | 30 min |
| Fuzz tests | 30 min |
| Deployment | 20 min |

For long steps within a job (e.g. a build step that might hang), use the
`timeout-minutes` property on the individual step.

## Reusable workflows

For patterns repeated across multiple repositories, extract them into
**reusable workflows** (`workflow_call`):

```yaml
# .github/workflows/node-ci.yaml in the shared repo
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '24'

jobs:
  test:
    runs-on: ubuntu-24.04-arm
    steps:
      - uses: actions/checkout@<sha>
      - uses: actions/setup-node@<sha>
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm
      - run: npm ci --prefer-offline
      - run: npm test
```

```yaml
# Consumer workflow
jobs:
  ci:
    uses: org/shared-workflows/.github/workflows/node-ci.yaml@<sha> # vX.Y.Z
```

The same **SHA pinning rules** apply to reusable workflow references. Pin by
commit SHA with a version comment, never by tag or branch.

For smaller reusable units (a set of steps rather than an entire job), use
**composite actions**. The same pinning rules apply.
