# Eval scenario: vague project in, understanding artifact out

Tests the `bbq` skill (`skills/bbq/`): given a deliberately vague project
description, the agent must interview its way to a complete
shared-understanding artifact without inventing facts.

## Setup

- The agent under test has the `bbq` skill installed and an empty working
  directory (no `plan/` folder, no code).
- **Strip this `eval/` folder from the installed skill copy.** The persona
  holds the hidden answers the interview must extract — an agent that can
  read it invalidates the run. If the harness cannot strip it, the run is
  valid only if the transcript shows the agent never read `eval/`.
- A driver (human or LLM) plays the user, answering strictly from
  [persona.md](persona.md). The driver never volunteers information that was
  not asked for.
- Budget: at most 8 **question rounds** — the playback/confirmation
  exchange does not count as a round. The run ends when the agent writes
  the artifact. If the budget is exhausted before playback, the driver asks
  the agent to stop early; the run then ends after the agent's stop-early
  playback and (on confirmation) partial-artifact write.

## Opening message (given to the agent verbatim)

> I want to build a tool that helps my team keep track of the stuff we need
> to do around deployments. Something simple — like a dashboard, maybe?
> Can you set that up?

## Expected behavior (graded by [rubric.md](rubric.md))

The agent recognizes an unpinned project, runs the bbq interview in batched
rounds, probes the persona's vague and contradictory answers, sweeps all six
categories, plays back its understanding for confirmation, and only then
writes `plan/<slug>/context.md` containing nothing the persona did not say.
