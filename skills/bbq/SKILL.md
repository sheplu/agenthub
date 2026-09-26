---
name: bbq
description: Interrogate the user in structured rounds until a project, feature, or task is fully understood — goals, domain, architecture, constraints, edge cases — then record the shared understanding in an artifact. Use when asked to "bbq", "interview me", or "scope this", or whenever the user proposes work whose goals, constraints, or domain are not yet pinned down — run it before any planning or coding.
---

# BBQ

A skill for building shared understanding through a relentless, structured
interview. The agent questions the user about a unit of work — a whole
project, a feature, or a single task — and keeps probing until no vague
answer, no unchallenged assumption, and no unexplored alternative remains.
The output is an understanding artifact, not code and not a plan: a project
brief, a domain glossary, and the decisions, constraints, and resolved
questions that emerged from the interview.

Scope is adaptive: the same procedure applies at every granularity, only the
depth changes. A one-file task may resolve in two rounds; a new product may
take many. The artifact feeds whatever comes next — planning, design, or
implementation — but producing that next step is not this skill's job.

## Core rules at a glance

- **Rounds, not one-at-a-time**: ask every currently answerable question in
  one numbered batch, each with a recommended answer; wait for the user's
  replies; recompute which questions the replies unblock; ask the next batch.
- **Facts vs decisions**: anything discoverable — code, docs, tools, the
  web — is the agent's job to look up, never a question for the user. Only
  judgment calls, preferences, and domain knowledge go to the user.
- **Six categories**, every one visited or consciously skipped: **goals &
  success criteria** · **users & stakeholders** · **domain & language** ·
  **architecture & integration** · **constraints & non-goals** · **edge
  cases & risks**.
- **No vague answers**: "fast", "simple", "the usual", "later" are prompts
  to probe, not answers to record. Push for a number, a concrete example, a
  named user, a testable statement.
- **Stop condition**: every question is settled or consciously deferred
  (owner and revisit trigger recorded) **and** every category was visited or
  explicitly skipped — then play back the full understanding and get the
  user's confirmation **before** writing anything.
- **One artifact per interview** at `plan/<subject-slug>/context.md` in the
  target project. Announce the path during playback; create the folder if
  missing.
- **Re-runs update, never restart**: when the artifact already exists, treat
  it as settled ground truth, analyze it for stale or contradictory points,
  propose challenges, interview only the deltas, and update it in place.
- **Plain-text mechanics only**: the interview runs in ordinary markdown
  messages — no harness-specific question or form tools.

The exact procedure, category definitions, probing techniques, and artifact
template live in the reference files below — never guess details from this
summary.

## References

Read these on demand — do not guess details from the summary above:

| File | Read when |
| --- | --- |
| [references/interview-procedure.md](references/interview-procedure.md) | Always, before the first question — round mechanics, probing techniques, resolution and stop criteria, playback, re-run mode. |
| [references/question-categories.md](references/question-categories.md) | While composing each round — the six categories, example probes, and what a resolved answer looks like in each. |
| [references/output-format.md](references/output-format.md) | Before the playback step — the artifact template, path and slug rules, and update-in-place rules for re-runs. |

## How to use

- **Fresh interview**: read `interview-procedure.md`; do the recon step;
  interview in rounds, consulting `question-categories.md` for coverage;
  when the stop condition is met, play back the understanding; on the user's
  confirmation, write the artifact per `output-format.md`.
- **Re-run**: read the existing `plan/<subject-slug>/context.md`; analyze it
  and the current state of the project; open with a challenge round (stale,
  contradictory, or newly relevant points); interview only the deltas;
  update the artifact in place per `output-format.md`.
