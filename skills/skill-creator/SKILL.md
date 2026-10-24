---
name: skill-creator
description: Create a new agent skill or update an existing one following the house conventions — recon from the conversation and repo, intake interview, confirmed inspiration reading, scaffold, validation, and in-conversation dry runs. Use when asked to "create a skill", "make a skill", "scaffold a skill", "update this skill", "turn this into a skill", or when a workflow demonstrated in the conversation should become reusable.
---

# Skill Creator

A skill for authoring and updating the other skills in a repository. It
encodes the house style established by `github-actions`, `openapi`,
`pr-commit`, `pr-review`, and `quality-gates` so contributors never
reverse-engineer it from examples. It sits upstream of every sibling skill —
they are its outputs — and it tests its own output: no skill it produces is
done until it has been validated and dry-run with the user.

## Core rules at a glance

- **Two modes**: **create** (interview → scaffold the skill files) and
  **update** (modify an existing skill, no scope creep). Both end in
  validation and dry runs.
- **Recon before asking**: mine the current conversation (workflows
  demonstrated, tools used, corrections made) and the target repo (git
  history, existing skills, domain files) to pre-fill intake answers —
  present them for confirmation, never ask cold what recon could answer.
- **Intake in rounds**: batched, numbered questions, each carrying a
  recommendation or an explicit lack of one. Vague answers are probed, never
  recorded; contradictions are surfaced with both statements together, never
  silently resolved. The question catalog lives in `authoring-workflow.md`.
- **Inspiration is confirmed, never assumed**: propose named candidates from
  the pools in `authoring-workflow.md` and read only those the user confirms,
  before drafting anything.
- **Anatomy is law**: exact frontmatter, trigger-style description, the
  fixed SKILL.md section shape, a capped reference set, a hard line budget.
  The full spec lives in `skill-anatomy.md` — never scaffold from memory of
  this summary.
- **Summary defers, never restates**: details live in the references;
  SKILL.md only points — the split rule and its one sanctioned exception
  live in `skill-anatomy.md`.
- **Validate before presenting**: run every check in
  `validation-checklist.md`; a failing check means fix and re-validate —
  never present "mostly passing". Pre-existing failures in update mode
  follow the workflow's report-don't-fix rule.
- **Dry runs before done**: simulated runs on user-approved test prompts,
  feedback after each, the skill revised between runs — budget and mechanics
  per `dry-run-protocol.md`. A skill is unfinished until it survives its dry
  runs.
- **Portable by detection**: this catalog's house style is the default; in a
  repo with its own skill conventions, detect and follow those instead —
  house style fills gaps, it never overrules a local convention.
- **Plain-text mechanics only**: the interview and the dry runs are ordinary
  markdown exchanges, and a dry run never mutates anything — mechanics live
  in `authoring-workflow.md` and `dry-run-protocol.md`.

The exact spec, question catalog, protocol, and checks live in the reference
files below — never guess details from this summary.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/skill-anatomy.md](references/skill-anatomy.md) | Always, before drafting or editing any SKILL.md or reference file — frontmatter rules, description-as-trigger pattern, the section shape, reference conventions, line budget, portability detection. |
| [references/authoring-workflow.md](references/authoring-workflow.md) | Starting a create or update run — recon steps, the intake question catalog, inspiration proposal and confirmation, scaffolding order, update-mode rules. |
| [references/dry-run-protocol.md](references/dry-run-protocol.md) | After a draft exists — proposing test prompts, role-playing the new skill, collecting feedback, revising between runs. |
| [references/validation-checklist.md](references/validation-checklist.md) | Before presenting a scaffolded or updated skill, and again after the final dry-run revision — the pass/fail checks. |

## How to use

- **Creating a skill**: read `authoring-workflow.md`; recon the conversation
  and repo; interview in rounds; confirm and read inspiration; scaffold in
  the workflow's step order, shaped per `skill-anatomy.md`; validate per
  `validation-checklist.md`; dry-run per `dry-run-protocol.md`; finalize.
- **Updating a skill**: read the update section and Shared rules of
  `authoring-workflow.md`, plus `skill-anatomy.md`; read the existing skill
  fully; apply only the
  requested change; re-validate the whole skill; dry-run when behaviour
  changed.
