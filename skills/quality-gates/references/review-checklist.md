# Quality Gates — Review checklist

Step-by-step procedure for reviewing a workflow (or a PR touching one). Read
[conventions.md](conventions.md) first — every step below checks against it.

## Procedure

1. Read `.github/workflows/quality-gates.yaml` (flag if the file is missing,
   misnamed, or if gates are split across several workflow files).
2. Check the **workflow shape**: name `Quality Gates`, `pull_request` → `main`
   trigger, concurrency with `cancel-in-progress: true`, baseline
   `permissions: contents: read`.
3. Check **jobs** against the catalog: kebab-case IDs, exact display names,
   correct runner per job (arm everywhere except Semgrep), no unexplained
   missing or extra jobs.
4. Check **every `uses:`** is SHA-pinned with a version comment.
5. Check **every external binary download** is version- and checksum-pinned.
6. Check **Node setup**: `node-version: 24`, `cache: npm`,
   `npm ci --prefer-offline`.
7. Check **coverage**: per-tier `coverage-<tier>` artifacts, merge job with
   correct `needs`/`if`, sticky comment with marker, thresholds configured.
8. Check **build**: pack dry-run present, max package size enforced.
9. Check **principles**: no `continue-on-error` outside the sticky comment
   step, no disabled/red-by-design jobs.

## Reporting

Report the result as a checklist: each convention as pass/deviation, with the
exact line and the fix for every deviation. Order deviations by severity —
supply-chain issues (unpinned actions/binaries) first, naming/cosmetic last.
