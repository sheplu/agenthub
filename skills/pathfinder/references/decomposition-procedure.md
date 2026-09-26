# Pathfinder — Decomposition procedure

The end-to-end procedure for scoping a project and producing a task graph.
Consult [scoping-questionnaire.md](scoping-questionnaire.md) while
composing scoping rounds and [task-graph-format.md](task-graph-format.md)
before proposing the DAG and writing the artifact.

## Parameters

1. **Subject** (required): the project to scope and decompose. Infer it
   from the user's request. If the request describes multiple independent
   projects, ask which one to scope first — each project gets its own task
   graph.
2. **Mode** (inferred): list the existing `plan/*/` subfolders and match
   the subject against them by meaning. `re-run` when an existing folder
   contains a `taskgraph.md` that covers the same project (reuse its slug);
   `fresh` otherwise. Slug rules live in
   [task-graph-format.md](task-graph-format.md).

## Procedure

### Phase 1: Scoping

1. **Recon.** Before asking anything, gather every fact the environment can
   answer: read the codebase, docs, configs, existing `plan/*/context.md`
   artifacts from `bbq`, issue trackers, and anything else reachable. Look
   for existing architectural boundaries — packages, services, modules,
   deployment units — that suggest natural task splits. Facts are never
   questions for the user; asking the user something you could have looked
   up wastes a round and erodes trust.

2. **Check for a `bbq` artifact.** If `plan/<slug>/context.md` exists, read
   it and map its content to the six scoping categories in
   `scoping-questionnaire.md`. Mark the categories the artifact already
   covers. Only interview the user on what remains — see the "Using a `bbq`
   artifact" section in `scoping-questionnaire.md`.

3. **Interview in rounds.** Each round contains every currently askable
   scoping question — batched, so the user answers in one pass. Format each
   question as:

   ```
   ❓ **Q<n>** — **<short title>**: <the question, with concrete options
   when the choice space is enumerable>

   ➡️ <your recommended answer, with a one-line reason>
   ```

   Always recommend. Number questions continuously across rounds (Q1…Qn).
   Consult [scoping-questionnaire.md](scoping-questionnaire.md) for the
   six categories and their probes.

4. **Probe every vague answer.** Techniques mirror `bbq`:
   - *Unquantified* ("fast", "cheap", "soon") → ask for the number and the
     condition.
   - *Abstract* ("users", "the data") → ask for a named, concrete
     instance.
   - *Deferred* ("we'll figure it out later") → ask what downstream task
     depends on it.
   - *Assumed* (stated as obvious) → ask for the counterexample.
   - *Contradictory* (conflicts with an earlier answer or a recon fact) →
     quote both side by side and ask which holds.

5. **Sweep the categories.** Before declaring scoping done, walk the six
   categories in [scoping-questionnaire.md](scoping-questionnaire.md). Any
   category with no settled points is either opened with a round of its own
   or explicitly skipped — by asking the user to confirm the skip, never by
   silently omitting it.

6. **Close scoping.** Scoping is done when every category is either
   visited (at least one settled point) or explicitly skipped, and no
   scoping question remains open without a conscious deferral (owner and
   revisit trigger recorded). Announce the transition: "Scoping is
   complete — moving to decomposition."

### Phase 2: Decomposition

7. **Identify top-level milestones.** Based on the scoped context, propose
   3–7 top-level workstreams or milestones (level 1 in the task graph).
   These are the major columns of work — often aligned with timeline phases,
   architectural layers, or user-facing capabilities. Each milestone should
   be independently meaningful.

8. **Decompose into tasks.** Break each milestone into tasks (level 2).
   Each task should be a coherent, self-contained unit of work. Apply the
   granularity rule (see below) to decide whether a task needs further
   decomposition into subtasks (level 3). Do not go deeper than level 3 —
   if a level-3 subtask is still too large, it was a poorly scoped
   level-2 task; re-split at level 2 instead.

9. **Wire dependencies.** Identify blocking edges between tasks. Only hard
   blocks: task B literally cannot start until task A's output exists.
   Soft preferences ("it would be nice to do A first") are not edges — they
   are noted in the task description if relevant. Keep the graph as
   parallel as possible; unnecessary edges reduce concurrency and create
   bottlenecks.

10. **Propose the full DAG.** Present the complete task graph to the user in
    one message. Include:
    - A mermaid diagram for the big-picture shape
    - The full task list with every field from the node schema
    - A suggested execution order (one valid topological sort)
    - Any open questions from scoping that affect decomposition

    Announce the intended artifact path: `plan/<slug>/taskgraph.md`.

11. **Validate and refine.** The user reviews the DAG and can:
    - Accept it as-is
    - Request re-decomposition of specific nodes ("split task X further")
    - Merge tasks ("combine A and B")
    - Add, remove, or reorder tasks
    - Adjust dependencies

    Incorporate feedback, re-present the affected parts, and confirm again.
    This loop runs until the user confirms the graph.

12. **Write the artifact.** On confirmation, write
    `plan/<slug>/taskgraph.md` per
    [task-graph-format.md](task-graph-format.md). Creating the folders is
    part of this step.

## Granularity rule

A task is a **leaf** (no further decomposition needed) when all four
conditions hold:

- **One session**: it can be completed in one focused working session —
  typically 1–4 hours of active work.
- **One PR**: it results in one pull request or one coherent commit — a
  single reviewable unit.
- **Self-contained criteria**: its acceptance criteria are testable without
  reference to sibling tasks in the graph.
- **Standalone context**: someone who has not seen the full project can
  understand what to do from the task's title, description, and acceptance
  criteria alone — no implicit knowledge required.

When in doubt, prefer smaller tasks. An overly granular graph is easier
to merge than an overly coarse one is to split.

## Stop condition

Decomposition is complete when:

- Every leaf task meets all four granularity conditions.
- Every dependency edge is justified — not defensive or speculative.
- The dependency graph is acyclic (no circular dependencies).
- The topological sort produces at least one valid execution path.
- No two tasks describe the same work (no duplicates).
- The user has confirmed the graph.

## Re-run mode

When `plan/<slug>/taskgraph.md` already exists for the subject:

1. **Read the artifact** and treat completed tasks as settled.
2. **Recon again**: compare the artifact against the current state of the
   project. Identify tasks that have been completed (mark them), tasks
   whose scope has changed, and new work that has emerged.
3. **Open with a status round**: present the analysis — completed tasks,
   changed tasks, new tasks — and ask the user to confirm before
   re-decomposing.
4. **Re-scope only the remaining work** — if the project's context has
   changed significantly, re-run the relevant scoping categories.
5. **Re-decompose** remaining and new tasks using the normal procedure from
   step 7 onward.
6. **Update in place** per the re-run rules in
   [task-graph-format.md](task-graph-format.md).

## Edge cases

| Condition | Behaviour |
| --- | --- |
| User answers "just decide" | Decide, state the decision and its reason in the next round, and record it as agent-recommended, user-delegated. |
| User wants to stop early | Present whatever is scoped and decomposed so far. Mark the artifact as `partial`. List uncovered scoping categories and undecomposed milestones prominently. Write the artifact only after confirmation. |
| Subject is trivially small | Run the category sweep anyway — categories resolve in one round; skip freely but explicitly. A small project may produce a flat task list with no subtasks; that is a valid graph. |
| User answers with a question | Answer it (it is either a fact you can find or a recommendation you already owe them), then re-ask yours. |
| Subject mixes independent projects | Split: scope and decompose the first project to completion, then offer separate runs (and separate artifacts) for the rest. |
| A task depends on an external event | Model it as a dependency on a "wait" task whose acceptance criterion is the event occurring. The wait task has effort S and no code. |
