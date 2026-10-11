# Brag — Output format

Document structure, entry format, categorization rules, level-aware framing,
ongoing-work lifecycle, and recap rules. Read this before writing any entry to
`~/.brag/brag.md`.

## Document structure

```markdown
# Brag Document — <Name>

**Team:** <team>
**Level:** <level>
**Last updated:** <ISO date>

## Period: <start date> — <end date>

### Features
- **<summary>** — <impact note> [<evidence link>]

### Fixes
- ...

### Reviews
- ...

### Infrastructure
- ...

### Learnings
- ...

### Other
- ...

### Ongoing Work
- <item> — <status> [<evidence link>]

### Recap
<2–3 sentence conversational summary of this period.>

---

## Period: <earlier start> — <earlier end>
...
```

## Document rules

- Newest period at the top, immediately after the header block.
- Never rewrite or remove earlier periods — the document is append-only.
- Omit empty category sections entirely — no "nothing this period" placeholders.
- Separate period sections with a horizontal rule (`---`).
- Update the `Last updated` field in the header on every run.

## Entry format

Each entry is a single bullet point with three parts:

1. **Summary** (bold) — derived from the source record (commit subject, PR
   title, ticket summary). Never invented or embellished beyond what the source
   data says.
2. **Impact note** — a short phrase explaining *why it matters*, not what it
   does. Framed according to the user's level (see below).
3. **Evidence link** — the URL from the source record, in brackets. For git
   commits with no remote URL, use the short SHA: `[abc123d]`. For
   user-reported entries without a link, use `[user-reported]`.

Example: `- **Add retry logic to HTTP client** — Improved reliability for 3 downstream services [https://github.com/org/repo/pull/142]`

## Categories

| Category | What belongs here |
| --- | --- |
| Features | New capabilities, user-facing changes, shipped product work. |
| Fixes | Bug fixes, incident response, reliability improvements. |
| Reviews | PR reviews, design doc reviews, RFC feedback, code mentoring through review. |
| Infrastructure | CI/CD, tooling, developer experience, build systems, test infrastructure, dependency upgrades. |
| Learnings | Technologies learned, courses completed, conference talks given or attended, blog posts written, internal tech talks. |
| Other | Hiring, mentoring sessions, on-call rotations, cross-team coordination, process improvements, anything that doesn't fit above. |

**Splitting categories**: if a user accumulates 5+ entries in "Other" across
periods, suggest splitting into a named sub-category (e.g., "Mentoring",
"Hiring"). The user decides — never split silently.

## Level-aware framing

The **summary** is always factual — it comes directly from the source data. The
**impact note** is where framing varies by level. When the data does not support
a level-appropriate impact statement, use a neutral one — never inflate.

| Level | Emphasis | Example impact note |
| --- | --- | --- |
| `junior` | Learning, growth, first-time accomplishments | "First time owning a feature end-to-end" |
| `mid` | Independent delivery, quality, measurable scope | "Reduced p95 latency by 40% for the payments endpoint" |
| `senior` | Cross-team impact, mentoring, design leadership | "Designed the retry architecture adopted by 3 services" |
| `staff` | Organizational influence, technical strategy, multiplier effect | "Drove RFC that unified error handling across the platform" |
| `principal` | Company-wide impact, industry contribution, strategic direction | "Led architecture review that prevented $2M infrastructure commitment" |

**Rules:**
- The impact note is guidance, not a formula. If the data for a commit is just
  "fix typo in README", the impact note is minimal regardless of level.
- Never fabricate metrics (latency improvements, cost savings) that are not in
  the source data. If the source data contains numbers, use them. If not, frame
  qualitatively.
- For `junior` and `mid`, it is fine for many entries to have simple impact
  notes. Not everything needs to sound impressive.

## Ongoing-work section

Items move to "Ongoing Work" when source data shows:
- An open (not yet merged) PR authored by the user.
- An in-progress issue assigned to the user.
- Commits on a branch that has no merged PR yet.

**Lifecycle rules:**
1. When a subsequent run finds the item merged/closed/completed, move it to the
   appropriate category in the new period section and remove it from ongoing.
2. Never carry an ongoing item across more than 3 consecutive periods without
   flagging it to the user: "This item has been ongoing for 3+ periods — is it
   still active, or should it be archived?"
3. Ongoing items include a status note: `draft`, `in review`, `blocked`, or a
   freeform status the user provides.

## Recap section

Each period ends with a `### Recap` section: 2–3 sentences, written in second
person ("You shipped…", "You focused on…").

**Rules:**
- Mention the top 1–2 accomplishments by impact.
- Mention any patterns worth noting (heavy review week, infrastructure focus,
  new technology adoption, etc.).
- Never fabricate accomplishments not present in the entries above.
- Keep it conversational — this is for the user's quick reference, not a formal
  report.

## Review-prep mode

When the user asks for a review-prep summary (e.g., "help me prepare for my
performance review" or "summarize my recent brag entries"):

1. Read the existing `~/.brag/brag.md`.
2. Collect entries from the last N periods (default: all periods, or a count
   the user specifies).
3. Produce a **conversational narrative** suitable for pasting into a
   self-review or sharing with a manager. Structure:
   - Opening: one sentence on overall themes ("Over the last N weeks, you
     focused on…").
   - Key accomplishments: the top 3–5 entries by impact, expanded into full
     sentences with context. Group by theme, not by period.
   - Growth areas: any patterns in Learnings or mentoring entries.
   - Closing: a forward-looking sentence based on the Ongoing Work sections.
4. Use the level from `profile.json` to calibrate the narrative tone — a junior
   review-prep emphasizes growth and skill acquisition, a staff/principal
   review-prep emphasizes strategic impact and multiplier effect.
5. Never add new entries to `brag.md` in this mode — it is read-only. Do not
   update `.state.json`.
