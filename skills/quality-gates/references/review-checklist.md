# Quality Gates — Review checklist

Step-by-step procedure for reviewing the gate workflows (or a PR touching
them). Read
[conventions.md](conventions.md) first — every step below checks against it.

## Procedure

1. Read the three workflow files — `quality-gates.yaml`, `sast.yaml`,
   `dependency-scan.yaml` (flag any that is missing or misnamed, any extra
   gate workflow, or any gate job living in the wrong file).
2. Check the **workflow shape** of each file: exact workflow name,
   `pull_request` → `main` trigger, concurrency with
   `cancel-in-progress: true`, baseline `permissions: contents: read`.
3. Check **jobs** against the catalog: kebab-case IDs, exact display names,
   correct workflow file and runner per job (arm everywhere except Semgrep),
   no unexplained missing or extra jobs.
4. Check **every `uses:`** is SHA-pinned with a version comment.
5. Check **every external binary download** is version- and checksum-pinned.
6. Check **runtime setup** against the matching runtime reference (e.g.
   [runtimes/nodejs.md](runtimes/nodejs.md)): pinned runtime version,
   dependency cache enabled, reproducible lockfile install.
7. Check **coverage**: per-tier `coverage-<tier>` artifacts, merge job with
   correct `needs`/`if`, sticky comment with marker, thresholds configured.
8. Check **build**: pack dry-run present, max package size enforced.
9. Check **principles**: no `continue-on-error` outside the sticky comment
   step, no disabled/red-by-design jobs.

## Reporting

Report the result as a checklist: each convention as pass/deviation, with the
exact line and the fix for every deviation. Order deviations by severity —
supply-chain issues (unpinned actions/binaries) first, naming/cosmetic last.
