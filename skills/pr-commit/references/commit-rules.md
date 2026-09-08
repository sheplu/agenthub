# PR Commit — Commit rules

The complete commit-message ruleset and the procedure that enforces it.
Consult this before drafting any commit message. The machine-checked rules
below are a faithful transcription of commit-sentinel's
[`hardened` preset](https://github.com/sheplu/commit-sentinel) — if the two
ever disagree, the preset source (`src/config/presets.ts`) wins and this file
must be updated.

## Message format

```
type(scope): subject

body explaining why the change is made, wrapped at 100 columns

BREAKING CHANGE: description of what breaks and how to migrate
```

- Header, blank line, body; footers (if any) come last, each `Token: value`
  or the git-trailer form `Token #ref` (e.g. `Closes #6`).
- A breaking change adds `!` after the scope — `type(scope)!: subject` — and
  **must** carry a `BREAKING CHANGE:` footer.

## Machine-checked rules (hardened preset, all at `error`)

| Rule | Requirement |
| --- | --- |
| `format` | Header parses as `type(scope): subject`. |
| `type-enum` | Type is one of: `feat`, `fix`, `build`, `ci`, `docs`, `perf`, `refactor`, `style`, `test`, `chore`, `revert`. |
| `scope-required` | A non-empty scope is present. |
| `scope-enum` | Pass-through by default (any scope) — a repo config may restrict the list. |
| `subject-max-length` | Subject ≤ 72 characters. |
| `subject-min-length` | Subject ≥ 1 character. |
| `subject-case` | Subject's first letter is lowercase (a non-alphabetic first character is acceptable; later words may capitalize, e.g. acronyms). |
| `header-max-length` | Entire header line ≤ 100 characters. |
| `body-required` | A non-empty body is present. |
| `body-max-line-length` | Every body line ≤ 100 characters. |
| `breaking-change` | A `!` marker requires a `BREAKING CHANGE:` footer; any such footer must have a non-empty description. |
| `author-email` | Pass-through by default (any email) — a repo config may pin a pattern. |
| `signed` | The commit carries a cryptographic signature (see [Signing](#signing)). |

## Convention rules (not yet machine-checked)

- **No trailing period** on the subject (tool gap — tracked upstream in
  [commit-sentinel#22](https://github.com/sheplu/commit-sentinel/issues/22)).
- **Body explains *why***, not just what — motivation, trade-offs, context a
  reviewer cannot get from the diff.
- **Atomic commits** — one logical change per commit; never mix a refactor
  with a feature or fix. If a change needs "and" to describe, split it.

## Validation procedure

Enforcement runs through commit-sentinel. Pick the invocation:

1. **Repo has `commit-sentinel.config.ts` in its root** — that config is a
   deliberate per-repo decision and wins. Run plain
   `npx @sheplu/commit-sentinel <args>`.
2. **No repo config** — enforce the hardened preset explicitly:
   `npx @sheplu/commit-sentinel --preset hardened <args>`.
   (The `--preset` flag is in development —
   [commit-sentinel#26](https://github.com/sheplu/commit-sentinel/issues/26);
   until it and the npm publication land, use the
   [manual fallback](#manual-fallback) below.)

Exit codes: `0` pass, `1` usage/config error, `2` rule failure.

### The gates

| Gate | When | Command |
| --- | --- | --- |
| **1** | Before `git commit` | `npx @sheplu/commit-sentinel --preset hardened --message "<full draft, header + body>"` |
| **1b** | After `git commit` | `npx @sheplu/commit-sentinel --preset hardened --commit HEAD` |
| **2** | Before opening/updating a PR | `npx @sheplu/commit-sentinel --preset hardened --base origin/main` |

The commands show the no-config invocation against a `main` default branch:
drop `--preset hardened` when the repo ships its own config (precedence
above), and substitute the repo's actual default branch in `--base`.

Gate 1b exists because `--message` validates content only — the git-metadata
rules (`signed`, `author-email`) need a real commit, so `--commit HEAD` closes
the gap. Gate 2 re-validates every commit on the branch including metadata.
Gate 3 (the PR title) applies the header rules only — see
[pr-rules.md](pr-rules.md).

On any failure: fix the message (`git commit --amend`, or reword via rebase
for older commits) and re-run the gate until it passes. **Never** bypass a
gate — no `--no-verify`, no "fix it in a follow-up", no proceeding on red.

### Manual fallback

When commit-sentinel cannot run (package not yet published to npm, offline,
or Node < 24), apply the gates yourself: check the drafted message against
**every row** of the two rule tables above, and confirm the commit is signed
after committing (`git log -1 --format=%G?` — anything except `N` means a
signature is present; this deliberately uses the presence semantics proposed
in [commit-sentinel#27](https://github.com/sheplu/commit-sentinel/issues/27),
counting unverifiable-here signatures the current tool rejects). Tell the
user validation was manual; do not mention it in the PR body.

## Signing

Sign with whatever the environment provides — all types satisfy the `signed`
rule:

- **GPG**: `git config commit.gpgsign true` (or `git commit -S`) with a GPG
  key configured as `user.signingkey`.
- **SSH**: `git config gpg.format ssh && git config user.signingkey
  ~/.ssh/id_ed25519.pub && git config commit.gpgsign true` — reuses an
  existing SSH key, no GPG needed.
- **gitsign** (Sigstore): keyless signing via OIDC, for environments with an
  identity provider but no long-lived keys.

**Stop condition**: if no signing key is available and none can be configured,
**stop and ask the user** — never create an unsigned commit. Include the SSH
quick-setup line above in the message; it is usually the cheapest unblock.

Known limitation: commit-sentinel currently treats `%G?` status `E`
(signature present but unverifiable — e.g. SSH signature with no
`gpg.ssh.allowedSignersFile`, or a GPG signature whose public key is not in
the validating keyring) as *unsigned*
([commit-sentinel#27](https://github.com/sheplu/commit-sentinel/issues/27)).
If gate 1b/2 fails on `signed` for a commit that is demonstrably signed
(`git log -1 --format=%G?` prints `E`), report it as this known limitation
rather than re-committing.
