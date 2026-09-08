# GitHub Actions — Security

The full security hardening specification for GitHub Actions workflows. Read
this (entirely) before writing or reviewing any workflow.

## Action pinning

Every `uses:` directive must reference the action by its **full 40-character
commit SHA**, with the human-readable version noted in a trailing comment:

```yaml
- name: Checkout
  uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
```

A tag-pinned action (`@v7`, `@v7.0.1`) or branch-pinned action (`@main`) is
a deviation.

**Rationale.** Git tags are mutable — a compromised or careless upstream
maintainer can force-push a tag to point to arbitrary code. A commit SHA is
immutable: it pins the exact tree that was audited. The version comment is for
humans reading the file; the SHA is for machines executing it.

**Resolving a pin.** Look up the action's releases page and find the commit
SHA for the desired version. Never copy a pin from another repository without
verifying it — the source may be outdated or compromised.

**Updating a pin.** When bumping an action version, update both the SHA and
the comment in one change. A stale comment (SHA points to v6 but the comment
says v7) is a deviation.

**Scope.** The rule applies to every `uses:` — first-party GitHub actions
(`actions/*`), third-party actions, reusable workflows
(`org/repo/.github/workflows/ci.yaml@<sha>`), and composite actions. No
exceptions.

## Binary pinning

External binaries downloaded in `run:` steps must be **version-pinned and
SHA256-verified** before execution:

```yaml
- name: OSV Scan
  env:
    OSV_VERSION: 2.5.0
    OSV_SHA256: fe152e1a546af223e6c557cc3111a8bb3e5dc02fcbf7dbe95d26567c0f0041f2
  run: |
    set -euo pipefail
    curl -sSLo osv-scanner \
      "https://github.com/google/osv-scanner/releases/download/v${OSV_VERSION}/osv-scanner_linux_arm64"
    echo "${OSV_SHA256}  osv-scanner" | sha256sum -c -
    chmod +x osv-scanner
    ./osv-scanner --lockfile=package-lock.json
```

The pattern:
1. Store the version and expected SHA256 in `env:` variables.
2. Download the binary for the correct platform/architecture.
3. Verify the checksum with `sha256sum -c -` **before** making it executable.
4. Execute only after verification passes.

Deviations:
- `curl | bash` or `curl | sh` — executes arbitrary remote code.
- Downloading without checksum verification.
- Hardcoding the URL without a version variable (makes updates error-prone).

## Scanner and tool version pinning

Tools installed via package managers in CI must use an **exact version pin**,
never floating latest or a semver range:

```yaml
# Good — exact version
- name: Install Semgrep
  run: pipx install semgrep==1.75.0

# Bad — floating latest
- name: Install Semgrep
  run: pipx install semgrep

# Bad — semver range (any compatible version could be installed)
- name: Pin npm
  run: npm install -g npm@^11.16.0
```

**Exact means exact.** Semver range operators (`^`, `~`, `>=`) are
deviations — they allow a range of versions, breaking reproducibility. Only
`==` (pip/pipx), `@11.16.0` (npm), or the equivalent exact-version syntax for
the package manager qualifies.

This applies to every package manager used in CI: `pipx`, `pip`, `gem`,
`cargo install`, `go install`, `npm install -g`. A floating or range-pinned
install means different CI runs may use different versions, making it
impossible to audit what ran.

When a tool publishes container images, a **digest-pinned Docker image** is an
acceptable alternative to a version-pinned package install:

```yaml
- name: Semgrep Scan
  uses: docker://semgrep/semgrep:1.75.0@sha256:<digest>
  with:
    args: scan --config auto --error
```

## Permissions model

Every workflow must set a **minimal baseline** at the workflow level:

```yaml
permissions:
  contents: read
```

Jobs that need additional permissions elevate their own `permissions:` block:

```yaml
jobs:
  coverage-report:
    permissions:
      contents: read
      pull-requests: write    # needed: post sticky PR comment
    # …
```

Rules:
- Never set `permissions: write-all` or omit `permissions:` entirely (the
  default is overly broad on many repository configurations).
- Never elevate workflow-level permissions for a single job's needs — the
  elevation goes on the job.
- Every elevated permission must have a comment explaining what it is for.
- When a job no longer needs an elevated permission, remove it.

## Script injection prevention

Never interpolate GitHub context expressions (`${{ }}`) directly in `run:`
blocks. Untrusted input in expressions (PR titles, branch names, issue bodies,
commit messages) can inject arbitrary shell commands.

```yaml
# BAD — injectable
- name: Greet
  run: echo "Hello ${{ github.event.pull_request.title }}"

# GOOD — safe via environment variable
- name: Greet
  env:
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: echo "Hello ${PR_TITLE}"
```

**Why environment variables are safe.** When set via `env:`, the value is
placed into the process environment by the runner before the shell starts.
The shell reads it as a variable, not as code to evaluate. When interpolated
via `${{ }}` in `run:`, the value is pasted into the shell script text before
execution — a title like `"; rm -rf / #` becomes part of the command.

**Safe expressions.** Some expressions are safe to use inline because their
values are controlled:
- `${{ github.sha }}` — always a hex SHA.
- `${{ github.run_id }}`, `${{ github.run_number }}` — always numeric.
- `${{ github.event.pull_request.base.ref }}` — the base branch name,
  controlled by the repository (not the PR author).
- `${{ matrix.* }}` — defined in your own workflow.
- `${{ secrets.* }}` — controlled by repo admins.

Even for safe expressions, routing them through `env:` is preferable for
readability and consistency.

## Secrets handling

- **Route secrets through `env:`**, never pass them as CLI arguments. CLI
  arguments are visible in `/proc/<pid>/cmdline` and may be logged by process
  monitoring tools.

  ```yaml
  # BAD — secret in CLI argument
  - run: deploy --token ${{ secrets.DEPLOY_TOKEN }}

  # GOOD — secret in environment
  - env:
      DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
    run: deploy --token "${DEPLOY_TOKEN}"
  ```

- **Never `echo` or `cat` a secret.** Even with `::add-mask::`, the
  plaintext exists in the runner's log buffer and may survive in build
  artifacts.
- **Use `::add-mask::`** for derived values (tokens obtained from an API
  call, decoded JWTs) so they are redacted if accidentally logged:
  ```yaml
  - run: |
      TOKEN=$(curl -s ... | jq -r .token)
      echo "::add-mask::${TOKEN}"
      echo "API_TOKEN=${TOKEN}" >> "$GITHUB_ENV"
  ```
- **Scope secrets to the job that needs them**, not the workflow. If only the
  deploy job needs `DEPLOY_TOKEN`, only the deploy job references it.
- For OIDC-capable targets, prefer OIDC over stored secrets (see below).

## Fork safety

### `pull_request` (safe default)

Workflows triggered by `pull_request` run in the **fork's context**: they
have read-only access to the base repository, no access to the base repo's
secrets, and their `GITHUB_TOKEN` has minimal permissions. This is the correct
trigger for CI gates on open-source repositories.

### `pull_request_target` (dangerous)

Workflows triggered by `pull_request_target` run in the **base repository's
context**: they have access to the base repo's secrets and a `GITHUB_TOKEN`
with the base repo's permissions. Use only when the workflow must write to the
base repo (labeling, commenting with elevated permissions) and **never check
out the PR's HEAD** (`github.event.pull_request.head.sha`) in this context —
doing so runs untrusted code with trusted credentials.

```yaml
# DANGEROUS — checking out untrusted code with base repo credentials
on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@<sha>
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # ← attacker-controlled
      - run: npm ci && npm test  # runs attacker's code with base repo secrets
```

### `workflow_run` (safe pattern for post-PR write actions)

For open-source repos that need write access after a PR event (posting
comments with artifacts, deploying PR previews):

```yaml
on:
  workflow_run:
    workflows: ["Quality Gates"]
    types: [completed]
```

The `workflow_run` trigger fires in the base repo context **after** the
referenced workflow completes. It can read the completed workflow's artifacts
and post results. The untrusted code has already finished executing in a
sandboxed `pull_request` context.

## OIDC and keyless authentication

For cloud provider authentication and package publishing, prefer **OpenID
Connect (OIDC)** over long-lived secrets:

```yaml
jobs:
  deploy:
    permissions:
      id-token: write   # needed: request OIDC token
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@<sha> # vX.Y.Z
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions
          aws-region: us-east-1
```

OIDC advantages:
- No stored secrets to rotate or leak.
- Each token is short-lived and scoped to the specific workflow run.
- The cloud provider can restrict which repos/branches/environments may assume
  which roles.

For artifact signing, **Sigstore/gitsign** provides keyless signing tied to
the OIDC identity — no GPG keys to manage.

## Dependency review (open-source)

For open-source repositories, add a dependency review step to PR workflows to
catch new vulnerable or restricted-license dependencies before merge:

```yaml
- name: Dependency Review
  uses: actions/dependency-review-action@<sha> # vX.Y.Z
  with:
    fail-on-severity: moderate
```

This complements lockfile scans (`osv-scanner`, `npm audit`) by catching
problems at the PR level, before the vulnerable dependency reaches the
lockfile on the default branch.
