# PR Commit — Pull request rules

Branch, title, body, scope, and merge rules for pull requests. Consult this
before creating a branch and before opening or updating a PR. Commit-message
rules and the validation gates live in [commit-rules.md](commit-rules.md).

## Branch naming

One rule: **never use an AI-harness prefix** — no branch generated-looking
names like `claude/…`, `vibe/…`, `copilot/…`, `cursor/…`, `codex/…`,
`devin/…`, or any other tool-identifying prefix. Branches read as human work:
short, descriptive, otherwise unconstrained (e.g. `feat/pr-commit-skill`,
`fix-login-timeout`).

## Title

The PR title **is** a commit header: squash-merge makes it the final commit
on `main`. It follows every header rule from
[commit-rules.md](commit-rules.md) — `type(scope): subject`, the same type
list, ≤ 72 subject, lowercase first letter, no trailing period — and is
validated through gate 3:

```
npx @sheplu/commit-sentinel --preset hardened --message "<PR title>"
```

(Same repo-config precedence and manual fallback as the commit gates.)

## Body

Short and focused — exactly these sections, nothing else:

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
- UI or CLI behavior changes: include a screenshot or captured output in the
  Summary.
- No other mandatory sections — a reviewer should grasp the PR from the
  Summary alone.

## Scope

- **One concern per PR.** Split refactors from behavior changes; if the diff
  serves two purposes, make two PRs.
- Small and reviewable beats complete — stack PRs rather than growing one.
- Commits on the branch stay atomic (see
  [commit-rules.md](commit-rules.md)); the branch history should read as a
  sequence of deliberate steps.

## Process and merge strategy

1. **Self-review first**: read the full diff yourself before requesting
   review; fix what you would have flagged.
2. **Rebase, never merge**: keep the branch current by rebasing on `main`;
   no merge commits into the branch.
3. **Gate 2 before requesting review**: the whole branch validates clean
   (`--base origin/main`).
4. **Squash-merge to `main`** — the PR title becomes the commit header, so
   gate 3 already validated it.
5. Branch protection: merging requires green CI and at least one approving
   review.
