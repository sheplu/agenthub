# PR Review — Review procedure

Step-by-step procedure for reviewing a pull request. Consult
[severity-guide.md](severity-guide.md) while classifying findings and
[report-format.md](report-format.md) when composing the output.

## Parameters

1. **PR ref** (required): a full GitHub URL
   (`https://github.com/owner/repo/pull/123`) or a bare PR number (`123`). When
   a bare number is given, infer the repository from the current checkout with
   `gh repo view --json nameWithOwner -q .nameWithOwner`.
2. **Output** (default: `local`):
   - `local` — write a Markdown report to `reviews/pr-review-<PR>.md` in the
     reviewed project's root directory.
   - `online` — post a GitHub review with inline comments via `gh`.
3. **Level** (default: `standard`): `quick`, `standard`, or `thorough` —
   controls which severity tiers appear in the output (see
   [severity-guide.md](severity-guide.md)).

## Procedure

1. **Parse parameters.** Resolve the PR ref to an owner/repo/number triple. If
   a bare number, infer the repo from the current checkout. If the ref is a full
   URL, extract owner, repo, and number from the path. Validate that
   `gh auth status` succeeds; if not, bail with a clear auth-failure message.

2. **Fetch PR metadata.** Run:
   ```
   gh pr view <number> --repo <owner/repo> \
     --json title,body,state,isDraft,baseRefName,headRefName,url,number,reviews,comments,files
   ```
   If the PR is not found, bail with a clear error. If the state is `MERGED`,
   note it — the review continues. If `isDraft` is true, note it.

3. **Check for empty diff.** If the `files` array is empty, report "nothing to
   review" and stop. No report file, no GitHub review.

4. **Read the PR description.** Use the `body` field as context for author
   intent. A mismatch between the description and the actual code changes is a
   valid finding — file it under `correctness`, severity based on impact, at
   most one such finding.

5. **Read existing comments and reviews.** Collect every inline and top-level
   comment from the `reviews` and `comments` fields. Two purposes:
   - **Dedup** — do not repeat feedback already given. If an existing comment
     addresses a concern you would raise, skip that finding.
   - **Context** — respect resolved discussions ("we agreed to keep this for
     now"). Factor discussion context into your assessment.

6. **Fetch the diff.** Run `gh pr diff <number> --repo <owner/repo>`. Parse the
   unified diff to identify changed files and changed lines within each file.

7. **Filter files.** Remove from the review set unless a change is
   security-critical:
   - **Lockfiles**: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`,
     `Cargo.lock`, `poetry.lock`, `go.sum`, `Gemfile.lock`, and equivalents.
   - **Generated code**: files with a `@generated`, `DO NOT EDIT`, or equivalent
     header; file extensions like `.g.dart`, `.pb.go`, `.gen.ts`.
   - **Doc-only changes**: pure-prose files (Markdown, plain text) with no
     executable code, unless the change is security-relevant (e.g. wrong API
     security documentation).
   - **Comment-only diffs**: hunks where every changed line is a code comment or
     whitespace.

8. **File-by-file pass.** For each remaining file, read the full file content —
   not just the diff hunks — to understand context, then review the changed
   hunks. For each issue found, record a finding with the fields defined in
   [severity-guide.md](severity-guide.md): `file:line`, severity, category,
   summary, why, fix. Review test files with the same rigor as production source
   — test bugs, tautological assertions, missing edge cases, and flaky patterns
   are real findings.

9. **Cross-file integration pass.** After completing all individual files, scan
   the collected changes as a whole for:
   - **Caller/callee contract changes** — a function signature, return type, or
     behavior changed in one file but callers in other changed files not updated.
   - **Consistency** — error-handling patterns, naming conventions, or code
     style applied in some changed files but not others within the same PR.
   - **Missing consumer updates** — a public API, type definition, or behavior
     changed without corresponding updates to tests, documentation, or
     downstream code that is also part of the PR.

   Cross-file findings span multiple locations — omit the `file:line` field and
   describe the affected files in the summary.

10. **Evaluate verdict and compose output.**
    - **Verdict rules**: `approve` if no blockers and no majors;
      `request changes` if at least one blocker; `comment` otherwise (majors but
      no blockers, or the reviewer has unresolved questions).
    - Always state the verdict.
    - Apply level filtering per [severity-guide.md](severity-guide.md) — drop
      findings below the level's threshold.
    - Enforce the soft cap per [severity-guide.md](severity-guide.md) — aim for
      10–15 findings, prioritized by severity then category.
    - Format and deliver the output per
      [report-format.md](report-format.md) for the chosen output mode.

## Edge cases

| Condition | Behavior |
| --- | --- |
| PR not found | Bail with error: "PR #N not found in owner/repo." No output. |
| `gh` auth failure | Bail with error: "GitHub authentication failed — run `gh auth login`." No output. |
| Empty diff | Report "Nothing to review — the PR has no file changes." Stop. |
| Merged PR | Review normally. Note "merged" in the status and summary. |
| Draft PR | Review normally. Note "draft" in the status and summary. |
