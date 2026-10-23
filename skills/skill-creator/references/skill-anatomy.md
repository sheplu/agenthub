# Skill Creator — Skill anatomy

The canonical spec for what a skill in this catalog looks like — where a
published sibling diverges, this spec, not the sibling, is the rule. The
checkable rules here are enforced by
[validation-checklist.md](validation-checklist.md), its enforcement form.
Consult [authoring-workflow.md](authoring-workflow.md) for the order in which
to produce these pieces.

## Directory layout

```
skills/<name>/
  SKILL.md              required — the routing summary
  references/           required — 2 to 4 top-level topic files (see below)
    <topic>.md
  eval/                 optional — interactive eval (see below)
    persona.md
    rubric.md
    scenario.md
```

- The directory name is kebab-case and **equals the frontmatter `name`** — no
  exceptions, no aliases.
- No README, no scripts, no assets, no files at the top level besides
  `SKILL.md`.

## Frontmatter

| Field | Rule |
| --- | --- |
| `name` | Required. Kebab-case, equals the directory name. |
| `description` | Required. The discovery trigger — see below. |
| anything else | Forbidden. No `version` (the git SHA is the version), no author, no metadata, no tool lists. |

## Description as trigger

The description is the only text an agent sees before deciding to load the
skill — it is a trigger, not a synopsis. Pattern:

```
<what it does> — use when <trigger conditions, including quoted phrases>.
```

- One to two sentences — the `use when` clause may open its own sentence, as
  in the Good example below. Name what the skill does and the concrete
  situations that fire it, quoting the literal phrases users say ("review
  this PR", "update the changelog") where natural — undertriggering is the
  common failure, so be a little pushy.
- Keep the value YAML-safe: don't open the description with a quoted phrase,
  and no `: ` inside the unquoted scalar.

| Verdict | Example |
| --- | --- |
| Good | `Review or create a repository's CI gate workflows — quality gates, SAST, dependency scanning. Use when setting up CI, reviewing a workflow, or auditing a PR that touches CI configuration.` (the `quality-gates` description) |
| Bad | `Helps with API specs.` — no trigger conditions, no phrases, no scope; an agent cannot tell when to load it. |

## SKILL.md shape

The sections below, in this order — `## How to use` is required for skills
with more than one mode and may be omitted by single-mode skills. The quoted
strings are literal — other skills and evals match on them.

1. `# <Title>` + a short intro paragraph: what the skill is, its scope, and
   its relation to sibling skills in the catalog.
2. `## Core rules at a glance` — bullets, bold keywords where they aid
   scanning, optionally grouped under `###` subheadings. Each bullet states a
   rule and, where detail exists, points at the reference file holding it with
   deferral language ("exact limits live in `x.md`; do not restate them from
   this summary", "never guess them from this summary").
3. `## References` — opened by the verbatim line
   `Read these on demand — do not guess details from the summary above:`
   followed by a `| File | Read when |` table. Links are relative markdown
   links into `references/`. Every reference file appears in the table, and
   every table row points at an existing file — a bijection.
4. `## How to use` — short bullets, one per mode, each naming which
   reference(s) to read first. Required when the skill has more than one
   mode.

**Line budget: 52–88 lines inclusive** (`wc -l` — keep the trailing newline
or the count drops), frontmatter included. Approaching the ceiling means a
detail belongs in a reference, not that the budget should stretch; the floor
guards against a summary too thin to route by.

## Summary vs reference split

Every number, threshold, enumeration, template, and procedure lives in exactly
one reference file — the validation checklist, as this spec's enforcement
form, is the one sanctioned restatement. SKILL.md carries only bold-keyword
pointers. A detail stated in both places is a defect: the copies will drift,
and the summary copy will win by being loaded first.

## Reference file conventions

- 2 to 4 top-level files, kebab-case names describing the topic
  (`commit-rules.md`, `review-checklist.md`). A variant family (per-runtime,
  per-cloud) nests as a subdirectory under its topic — one file per variant
  (`runtimes/nodejs.md`) — outside the cap.
- Each starts with `# <Skill> — <Topic>` and a pointer paragraph: what the
  file covers and which sibling references to consult alongside it.
- Enumerations are tables; procedures are numbered steps; checklists are
  pass/fail tables or checkbox lists.
- A file needed by more than one mode is one file — never duplicated per
  mode.

## Tone

Terse, imperative, em-dash heavy. Hard constraints are absolutes — "never",
"always", "stop condition" — with a short why where it earns its lines.
Explain the reason behind a rule once, in its reference, not in every
restatement.

## Eval folder (optional)

Interview-style skills — those whose value is the conversation they run —
carry an `eval/` folder with three files: `scenario.md` (setup, the opening
message verbatim, round budgets, expected behaviour), `persona.md` (the
driver's hidden knowledge: facts revealed only when asked, first vs probed
answers, scripted feedback), and `rubric.md` (pass/fail must/should checks
over the transcript and the produced artifact). The scenario must instruct
stripping `eval/` from the installed skill copy and the eval checkout — an
agent that can read the persona invalidates the run. Deterministic,
output-contract skills use the `evals/suites/` benchmark framework instead
(see `evals/README.md`).

## Portability detection

This file describes *this* catalog's house style, and the style travels: the
skill may be invoked in any repository. On a foreign repo, before scaffolding:

1. Look for existing skills — `skills/`, `.claude/skills/`, or wherever the
   repo keeps them.
2. If any exist, read one or two and mirror **their** conventions: location
   (`skills/`, `.claude/skills/`, …), frontmatter fields, section names,
   layout, tone. State the detected differences to the user before drafting.
3. House style applies fully only where the target repo has no established
   pattern — it fills gaps, it never overrules a local convention.
