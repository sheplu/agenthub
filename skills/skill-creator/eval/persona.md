# Persona: the interviewee's hidden knowledge

The driver answers the agent's questions **only** from this file. Rules:

- Reveal a fact only when a question actually asks for it. Never volunteer.
- If asked something not covered here, answer "I don't know, you decide"
  (the agent should then decide, state its reasoning, and record the decision
  as delegated).
- Give the **first answer** listed for a fact; give the **probed answer**
  only if the agent pushes back on the first one.
- A question that carries the agent's own recommendation still asks for a
  fact — answer it from the fact's listed answers, not by confirming the
  recommendation. Only answers actually given earlier in the conversation
  are confirmable as pre-filled.
- Play the contradiction honestly: state both sides as written, and only
  resolve it if the agent surfaces the conflict explicitly.
- Confirmations and feedback are judgements, not facts — never answer them
  with "I don't know". When the agent presents pre-filled recon answers, a
  description draft, inspiration candidates, test prompts, or a dry-run
  output: respond per the scripted sections below; where unscripted, confirm
  if consistent with this file, and point at the specific discrepancy if not.

## Facts (revealed only when asked)

### Purpose

- Pain: changelog entries are written by hand at every release, formats
  drift, and entries get forgotten entirely when several PRs land between
  releases.
- Job: a `changelog` skill that drafts and updates `CHANGELOG.md` entries for
  a release from what was merged.
- The team maintains Node.js projects; releases are cut manually.

### Triggers

- Should fire on: "update the changelog", "write release notes", "prepare
  the release entry", and whenever a version-bump or release PR is being
  prepared.
- Must NOT fire on ordinary commits or commit-message writing — that is the
  `pr-commit` skill's job, and the two must not overlap.

### Format (vague answer — probe it)

- **First answer**: "just make it look professional."
- **Probed answer**: Keep a Changelog 1.1.0 — `## [x.y.z] - YYYY-MM-DD`
  version headings, entries grouped under Added / Changed / Deprecated /
  Removed / Fixed / Security, an `Unreleased` section kept on top, and
  version-compare links at the bottom of the file.

### Scope

- In: drafting or updating `CHANGELOG.md` from the history merged since the
  last release tag.
- Out: version bumping, tagging, publishing, GitHub Releases — "the skill
  writes the file, humans cut the release."
- **Contradiction (play both sides)**: when asked what goes into an entry —
  or which merged changes make the changelog, e.g. the scope question's
  borderline cases — say "every commit since the last tag gets a line."
  When asked about the audience, say "the changelog is for users — internal
  chores shouldn't show up." Resolution, only if the agent surfaces the
  conflict: only user-facing change types (feat, fix, perf, breaking) become
  entries; chore/ci/docs/test are excluded; squashed PR titles are the source
  of truth.

### Inspiration preferences (judgements — respond when proposed)

- Confirm this repo's `pr-commit` skill if proposed (closest domain sibling).
- Confirm at most one candidate from the public anthropics/skills catalog if
  proposed.
- Decline any sibling-project-on-disk or personal-GitHub candidate: "not
  those, they're a mess."
- Never name a candidate unprompted — the agent must propose; if asked an
  open "what should I look at?", answer "you tell me what's worth reading."

### Dry-run script (judgements — respond at the dry-run stage)

- Prompt approval: approve two of the three proposed prompts if they are
  realistic; replace the third — or, if fewer than three were proposed, the
  last one — with exactly: "prepare the changelog for the 2.3.0 release".
- Feedback after run 1: if the run guessed or **invented a release date**,
  point it out; if it read the date from the environment, asked, or stopped
  at the gap, acknowledge that instead. Either way, request that the skill
  files state the rule explicitly: dates are read or asked, never guessed.
- Feedback after run 2: breaking changes must always be listed first within
  a version entry, before the other categories. Request this as a rule in the
  skill files.
- Run 3: accept if both prior feedback items are visibly incorporated in the
  run; otherwise point at the one that is missing.

### Not covered (answer "I don't know, you decide")

- Monorepo or multi-package changelogs, emoji policy, pre-release versions,
  yanked releases, changelog linting tools, localization.
