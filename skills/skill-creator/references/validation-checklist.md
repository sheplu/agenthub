# Skill Creator — Validation checklist

The pass/fail gate for a scaffolded or updated skill. Run it before
presenting a draft, and again after the final dry-run revision. The checks
enforce [skill-anatomy.md](skill-anatomy.md) — consult it for the reasoning
behind any check. On a foreign repo where anatomy's portability detection
found local conventions, substitute those for the house-specific rows and say
which rows were substituted.

## Structure checks

| # | Check |
| --- | --- |
| S1 | Directory name is kebab-case and equals the frontmatter `name`. |
| S2 | Frontmatter has exactly two fields: `name` and `description` — nothing else. |
| S3 | Description follows `<what it does> — use when <triggers>` and quotes at least two literal trigger phrases. |
| S4 | SKILL.md has exactly the four sections, in order: title + intro, `## Core rules at a glance`, `## References`, `## How to use`. |
| S5 | The References section opens with the verbatim line `Read these on demand — do not guess details from the summary above:`. |
| S6 | The references table is `\| File \| Read when \|` with relative markdown links. |
| S7 | Table/file bijection: every reference file appears in the table, every table row links to an existing file, every link resolves. |
| S8 | `references/` holds 2 to 4 files, kebab-case names. |
| S9 | SKILL.md is 52–88 lines by `wc -l`, frontmatter included. |
| S10 | `## How to use` has one bullet per mode, each naming the reference(s) to read first. |

## Content checks

| # | Check |
| --- | --- |
| C1 | No number, enumeration, template, or procedure that lives in a reference is restated in SKILL.md — the summary only points. |
| C2 | Every reference file starts with `# <Skill> — <Topic>` and a pointer paragraph naming sibling references where relevant. |
| C3 | Enumerations are tables; procedures are numbered steps. |
| C4 | The intro paragraph states the skill's relation to sibling skills (or that it has none). |
| C5 | Every constraint in the files traces to a user-confirmed intake answer or a decision explicitly recorded as delegated — no invented rules. |
| C6 | Update mode only: the diff is limited to the requested change — no rewrites of untouched sections. |

## Process checks

| # | Check |
| --- | --- |
| P1 | Recon (conversation + repo) ran before the first intake question, and its findings were presented as pre-filled answers. |
| P2 | Inspiration candidates were proposed and user-confirmed before being read in depth. |
| P3 | Dry runs were executed per the protocol and every feedback item is visible in the final files. |

## On failure

Fix the failing check, then re-run the **entire** checklist — a fix can break
a convention elsewhere (line budget, bijection). Never present a skill with a
failing check, and never report "mostly passing".
