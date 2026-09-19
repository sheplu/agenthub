You are reviewing a repository's CI gate workflows. Follow these instructions exactly.

## Task

1. Read `skill/SKILL.md` and follow its instructions for **reviewing** CI gate
   workflows, reading the files under `skill/references/` exactly as the skill
   directs you to.
2. Review the repository under `workspace/` against the skill. It is a Node.js
   project; its CI workflows are in `workspace/.github/workflows/`.

## Scope

- Judge only what is verifiable from the files under `workspace/`.
- Anything that cannot be verified from those files is **out of scope** — do
  NOT report it as a deviation. This includes: branch protection settings,
  GitHub repository configuration, whether per-repo numbers (coverage
  thresholds, package size budget, pinned tool versions) are the *right*
  values, and whether a pinned commit SHA really corresponds to the version in
  its comment. You may mention such assumptions in prose, outside the verdict
  lines.
- Do not modify any file. This is a read-only review.

## Output contract (mandatory)

End your final message with the review verdict in exactly this format:

- One line per deviation found, formatted as:
  `DEVIATION: <file>:<line> <short description>`
  with the file path relative to `workspace/`, for example:
  `DEVIATION: .github/workflows/sast.yaml:12 semgrep job runs on the wrong runner`
- If there are no deviations, output exactly this single line instead:
  `NO DEVIATIONS`

Do not wrap the verdict lines in a code block. Do not output a DEVIATION line
for out-of-scope observations, for suggestions the skill marks as optional, or
for stylistic preferences the skill does not mandate.
