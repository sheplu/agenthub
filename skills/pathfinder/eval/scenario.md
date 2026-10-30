# Eval scenario: vague large project in, scoped task graph out

Tests the `pathfinder` skill (`skills/pathfinder/`): given a deliberately
vague, large project description, the agent must scope it at the project
level and decompose it into a valid task graph without inventing facts.

## Setup

- The agent under test has the `pathfinder` skill installed and an empty
  working directory (no `plan/` folder, no code).
- **Strip this `eval/` folder from the installed skill copy.** The persona
  holds the hidden answers the scoping interview must extract — an agent
  that can read it invalidates the run. If the harness cannot strip it, the
  run is valid only if the transcript shows the agent never read `eval/`.
- A driver (human or LLM) plays the user, answering strictly from
  [persona.md](persona.md). The driver never volunteers information that was
  not asked for.
- Budget: at most **6 scoping rounds** and **2 decomposition rounds**
  (the DAG presentation + one refinement pass). The confirmation exchange
  does not count. If the budget is exhausted before the DAG is confirmed,
  the driver asks the agent to stop early; the run then ends after the
  agent's partial artifact write.

## Opening message (given to the agent verbatim)

> We need to rebuild our internal analytics pipeline. The current one is a
> mess of cron jobs and it can't keep up anymore. We also need a dashboard
> so the product team can actually see what's going on. Can you break this
> down into tasks for us?

## Expected behaviour (graded by [rubric.md](rubric.md))

The agent recognises a large, unscoped project. It runs the pathfinder
scoping interview in batched rounds covering all six project-level
categories, probes vague and contradictory answers, and closes scoping
before decomposing. It then proposes a full DAG with milestones, tasks,
dependencies, and a mermaid diagram. On the user's confirmation, it writes
`plan/<slug>/taskgraph.md` containing nothing the persona did not say or
the agent did not decide transparently.
