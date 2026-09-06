# Quality Gates — Creation guide

How to bootstrap the workflow for a repo that has none. Read
[conventions.md](conventions.md) first — the workflow you produce must satisfy
all of it.

## Steps

1. Confirm the runtime and read its reference (default: Node.js —
   [runtimes/nodejs.md](runtimes/nodejs.md)). Verify the scripts/commands the
   jobs call exist; create missing ones as part of the same change — a job must
   never reference a script that does not exist.
2. Write `quality-gates.yaml` with the canonical shape and full job catalog.
3. Resolve **current** action versions and their commit SHAs yourself (from the
   actions' release pages); never copy pins blindly from another repo.
4. Resolve the current osv-scanner release and compute/verify its SHA256.
5. Set the sticky-comment marker to `<!-- <repo>-coverage-report -->`.
6. Raise the coverage-threshold and package-size-budget numbers with the
   maintainer — they are project decisions; do not invent them silently.
7. Verify every job passes before opening the PR: CI lands green or it does
   not land.
