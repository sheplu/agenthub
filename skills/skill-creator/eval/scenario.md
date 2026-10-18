# Eval scenario: a skill request in, a valid scaffolded skill out

Tests the `skill-creator` skill (`skills/skill-creator/`): given a vague
request to "build me a skill" for a domain, the agent must recon first,
interview in rounds, confirm inspiration before reading it, scaffold a
house-style skill, validate it, and dry-run it with the user — without
inventing facts.

## Setup

- The agent under test has the `skill-creator` skill installed and works in a
  checkout of this repository — the five published skills and the git history
  give the recon step real material to find.
- **Strip this `eval/` folder from the installed skill copy.** The persona
  holds the hidden answers the intake interview must extract — an agent that
  can read it invalidates the run. If the harness cannot strip it, the run is
  valid only if the transcript shows the agent never read `eval/`.
- A driver (human or LLM) plays the user, answering strictly from
  [persona.md](persona.md). The driver never volunteers information that was
  not asked for.
- Network access to github.com is optional: if unreachable, the inspiration
  step is graded on proposal and confirmation of local candidates only.
- Budget: at most **4 intake rounds** and **3 dry runs**, with one revision
  pass between consecutive runs. Confirmation exchanges (description sign-off,
  prompt approval, dry-run feedback) do not count as rounds. If the budget is
  exhausted, the driver asks the agent to stop and finalize; the run then ends
  after the agent's final validation pass.

## Opening message (given to the agent verbatim)

> Our changelog entries are all over the place — every release I rewrite them
> by hand and they never look the same twice. Can you build me a skill for
> that?

## Expected behaviour (graded by [rubric.md](rubric.md))

The agent recognises a create-mode request. It recons the repo before asking
anything — finding `pr-commit` as the domain-adjacent sibling — and presents
pre-filled intake answers. It interviews in batched rounds, probing the vague
format answer and surfacing the every-commit vs users-only contradiction. It
proposes named inspiration candidates from at least two pools and reads only
the ones the driver confirms. It scaffolds `skills/changelog/` per the house
anatomy (references first, SKILL.md last), shows a passing validation
checklist, then runs the dry runs on approved prompts — revising the files
after each feedback item — and finalizes with the file tree. The scaffolded
skill contains nothing the persona did not say or the agent did not record as
a delegated decision.
