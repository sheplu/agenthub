# BBQ — Output format

The artifact template and the rules for where it lives and how it evolves.
Write it only after the playback step of
[interview-procedure.md](interview-procedure.md) is confirmed.

## Path and slug

- One artifact per interview: `plan/<subject-slug>/context.md`, relative to
  the target project's root. The subfolder is deliberate — later documents
  about the same subject (plans, designs, ADRs) join it without renaming.
- **Slug**: kebab-case, 2–5 words, derived from the subject
  (`payment-refunds`, `search-reindexing`). Before creating a new slug,
  list the existing `plan/*/` subfolders — if one already covers the same
  subject under a different phrasing, reuse it instead of forking a
  duplicate. A project-level interview about the repo itself uses `project`.
- Create `plan/` and the subfolder if missing. If `context.md` exists,
  you are in re-run mode — see below; never overwrite it from scratch.

## Template

Omit any section with nothing in it — a small task rarely needs a glossary.
Keep every statement traceable to an interview answer or a recon fact; the
artifact records shared understanding, never the agent's invention.

```markdown
# <Subject> — Context

Interviewed: <user> · Updated: <YYYY-MM-DD> · Status: complete | partial

## Project brief

**Goal**: <ranked outcomes, one line each>
**Success criteria**: <observable signals, one per goal>
**Users**: <role — touchpoint — what they need>
**Non-goals**: <what this explicitly is not>

## Domain glossary

| Term | Meaning |
| --- | --- |
| <term> | <precise definition, including its boundaries> |

## Decisions & constraints

- **<Decision>** — <what was decided>. *Why*: <the reasoning captured in
  the interview>. *Source*: <user | recon | agent-recommended,
  user-delegated>.
- **<Constraint>** — <the wall>. *Source*: <who or what imposes it>.
  *Hardness*: hard | soft.

## Resolved questions

- **<Question>** → <the answer that settled it>.

## Open questions

- **<Question>** — deferred because <reason>. Owner: <who>. Revisit:
  <date or trigger>.
```

Section-to-category mapping: the brief is fed by *goals & success criteria*,
*users & stakeholders*, and *constraints & non-goals*; the glossary by
*domain & language*; decisions & constraints by *architecture &
integration*, *constraints & non-goals*, and *edge cases & risks*; open
questions by anything consciously deferred. A consciously skipped category
is noted in one line under Resolved questions ("skipped <category>: <why>").

## Update rules (re-run mode)

- **Update in place** — same file, same path. Never fork a v2 file.
- **Revised decisions keep their history**: rewrite the decision line to the
  new state and append `*(revised <YYYY-MM-DD>: was "<old decision>" —
  <why it changed>)*`. Never silently replace a recorded decision.
- **Dropped decisions** move to Resolved questions as "no longer holds:
  <why>" rather than being deleted.
- Answered open questions move to Resolved questions; new deferrals join
  Open questions with owner and revisit trigger.
- Bump the `Updated` date; flip `Status` to `complete` only when the re-run
  meets the same stop condition as a fresh interview: every question settled
  or consciously deferred, every category visited or explicitly skipped.
