# PR Commit — Pull request rules

Branch, title, body, scope, and merge rules for pull requests. Consult this
before creating a branch and before opening or updating a PR. Commit-message
rules and the validation gates live in [commit-rules.md](commit-rules.md).

## Branch naming

One rule: **never use an AI-harness prefix** — no generated-looking branch
names like `claude/…`, `vibe/…`, `copilot/…`, `cursor/…`, `codex/…`,
`devin/…`, or any other tool-identifying prefix. Branches read as human work:
short, descriptive, otherwise unconstrained (e.g. `feat/pr-commit-skill`,
`fix-login-timeout`).

## Title

The PR title **is** a commit header: squash-merge makes it the final commit
on `main`. It follows every header rule from
[commit-rules.md](commit-rules.md) — `type(scope): subject`, the same type
list, ≤ 72 subject, lowercase first letter, no trailing period.

**Gate 3** checks the title against those **header rules only** — apply them
manually. Do not run a bare title through `--message`: under the hardened
preset it false-fails `body-required` (the CLI has no header-only mode). To
use the tool anyway, validate the title with the PR Summary appended as a
stand-in body — a faithful proxy for the squash commit under the merge
setting below.

## Body

Optimize for the reviewer's reading, not for a fixed shape. The baseline:

```markdown
## Summary

What changed and why, a few sentences at most. Closes #N.

## Breaking changes

Only include this section when something breaks: what breaks, who is
affected, how to migrate.
```

- **Summary** always; link the issue with `Closes #N` (or `Refs #N` when the
  PR does not fully resolve it).
- **Breaking changes** only when the PR actually breaks something — omit the
  section entirely otherwise.
- Beyond the baseline, add whatever genuinely helps *this* PR read faster:
  screenshots or captured output (required for UI or CLI behavior changes),
  a short architecture sketch, a testing note, extra sections. Length is not
  the enemy — noise is.
- The body must **bring what the diff cannot say**: motivation, trade-offs,
  context, visuals. Never re-explain the code change by change — reviewers
  read the diff; a body that narrates it is noise, however short.
- Keep the body **up to date**: when the PR changes direction or scope during
  review, update the description to match the final diff. A stale body is
  worse than a terse one.

## Scope

- **One concern per PR.** Split refactors from behavior changes; if the diff
  serves two purposes, make two PRs.
- Small and reviewable beats complete — stack PRs rather than growing one.
- Commits on the branch stay atomic (see
  [commit-rules.md](commit-rules.md)); the branch history should read as a
  sequence of deliberate steps.

## Process and merge strategy

1. **Self-review first**: read the full diff yourself before requesting
   review; fix what you would have flagged, and confirm the body still
   matches the final diff.
2. **Rebase, never merge**: keep the branch current by rebasing on `main`;
   no merge commits into the branch.
3. **Gate 2 before requesting review**: the whole branch validates clean
   (`--base origin/main`).
4. **Squash-merge to `main`** — the PR title becomes the commit header, so
   gate 3 already validated it. Configure the repository's squash-message
   setting to **"Pull request title and description"**: the merged commit is
   the one artifact no gate re-validates (GitHub creates and signs it at
   merge time), and this setting is what keeps a meaningful body on `main`
   instead of an auto-generated commit list or nothing.
5. Branch protection: merging requires green CI and at least one approving
   review.
