# Pathfinder — Scoping questionnaire

The six project-level categories the scoping phase must cover. Every
category is either visited (at least one settled point) or explicitly
skipped with the user's confirmation — see step 5 of
[decomposition-procedure.md](decomposition-procedure.md). Each category
feeds a specific part of the scope summary in the task graph artifact
defined in [task-graph-format.md](task-graph-format.md).

Pathfinder scoping asks "how does this shape the task breakdown?" — not
"what does this one task mean?" That deeper question is `bbq`'s job. The
categories here are project-global: they produce the context that makes
decomposition possible and the constraints that determine task boundaries.

Example probes are starting points, not scripts — adapt them to the project
and its scale. A small greenfield project may resolve in two rounds; a
multi-team platform migration may take several.

## 1. Business context & goals

*Feeds: scope summary (goals, success criteria, priority).*

What the project must achieve, who cares about it, and how anyone would know
it succeeded.

- "What becomes possible when this ships that is impossible today?"
- "Who is the primary beneficiary — end users, the team, the business?
  What changes for them on day one?"
- "If only one outcome ships, which one?"
- "What observable signal tells you the project worked — a metric, a
  behaviour change, a milestone?"
- "What is the strategic priority of this project relative to other work
  the team could do?"

**Resolved** looks like: ranked outcomes with observable success signals and
a named beneficiary. **Vague** looks like: "improve the workflow", "make it
better" — push for the observable change and the person who observes it.

## 2. Tech stack & architecture

*Feeds: scope summary (tech stack) and task boundaries.*

The technologies, systems, and patterns that determine where tasks
naturally split.

- "What languages, frameworks, and runtimes are you using or planning to
  use?"
- "What existing systems does this project touch, depend on, or replace?"
- "Where does it run — cloud provider, on-prem, hybrid? Who operates it?"
- "Is there an existing codebase to extend or is this greenfield?"
- "What architectural pattern are you following — monolith, microservices,
  serverless, event-driven?"
- "What data stores, queues, or external APIs are involved?"

These questions create natural task boundaries: a backend service, a
frontend app, an infra layer, a migration script, an API contract. Recon
the codebase first — most architecture facts live in code and configs.

**Resolved** looks like: named technologies, named systems on each
boundary, stated integration directions. **Vague** looks like: "we'll
figure out the stack later", "something modern" — push for the specific
technology and the reason for choosing it.

## 3. Team & resources

*Feeds: scope summary (team) and DAG parallelism.*

Who is working on this, what skills are available, and how capacity
constrains the plan.

- "How many people are working on this? What are their roles?"
- "What skills does the team have — and what skills are missing that
  might require external help or learning time?"
- "Is the team co-located or distributed? What's the collaboration model
  (pairing, code review, async)?"
- "Is anyone part-time or splitting time with other projects?"
- "Who can make technical decisions — and who needs to approve them?"

Team size and skills affect DAG shape: a team of two cannot parallelise
eight independent workstreams. Missing skills may require dedicated
learning/spike tasks.

**Resolved** looks like: named roles with skill areas and availability.
**Vague** looks like: "the team", "a few engineers" — push for the count,
the roles, and the constraints.

## 4. Timeline & phases

*Feeds: scope summary (timeline) and decomposition levels.*

When things must ship, what order they ship in, and what external dates
constrain the plan.

- "Is there a hard deadline? What happens if you miss it?"
- "Are there intermediate milestones — a demo, an internal launch, a
  beta?"
- "What is the MVP — the smallest subset that delivers value? What's
  stretch?"
- "Is there a release cadence or do you ship when ready?"
- "Are there external dependencies with their own timelines — a partner
  launch, a compliance audit, a conference?"

Timeline creates ordering constraints: MVP tasks before stretch tasks,
milestone A before milestone B. Hard deadlines create the stop condition
for "how fine-grained must the decomposition be?"

**Resolved** looks like: concrete dates or relative ordering (MVP by week
6, full launch by month 3) with consequences of missing them. **Vague**
looks like: "soon", "as fast as possible" — push for the date and the
consequence.

## 5. Project boundaries

*Feeds: scope summary (boundaries, non-goals).*

What is in scope, what is explicitly out, and what is deferred — the walls
that prevent decomposition from sprawling.

- "What is this project explicitly *not*? What adjacent problem are you
  refusing to solve?"
- "Is there a related project that this must not overlap with?"
- "What would make you reject an otherwise perfect solution?"
- "Are there features or components that are 'nice to have' vs 'must
  have'?"
- "What existing behaviour must not break?"

Boundaries prevent scope creep during decomposition. A task that falls
outside the boundary is not a task — it is a non-goal recorded in the scope
summary.

**Resolved** looks like: each boundary with a clear line and a reason
("ML-based recommendations are out of scope — they depend on a data
pipeline that does not exist yet"). **Vague** looks like: "keep it simple",
"nothing too fancy" — push for the specific feature or component that is
excluded and why.

## 6. Cross-cutting concerns

*Feeds: scope summary (cross-cutting) and dedicated tasks or acceptance
criteria.*

Things that affect every task: testing, CI/CD, documentation, security,
performance, observability. These either become their own tasks (e.g.
"set up CI/CD pipeline") or become acceptance criteria on other tasks
(e.g. "every endpoint must have integration tests").

- "What is the testing strategy — unit, integration, e2e? What coverage
  target?"
- "Is there CI/CD in place or does it need to be set up?"
- "Are there security requirements — authentication, authorisation,
  encryption, compliance?"
- "Are there performance targets — latency, throughput, availability?"
- "What documentation is expected — API docs, architecture decision
  records, user guides?"
- "Is there an observability requirement — logging, metrics, alerting?"

**Resolved** looks like: each concern with a stated approach and a
measurable target. **Vague** looks like: "we need good tests", "it should
be secure" — push for the specific strategy and the specific threshold.

---

## Using a `bbq` artifact

When `plan/<slug>/context.md` exists from a prior `bbq` interview:

1. **Read it** and treat every recorded decision as settled ground truth.
2. **Map its content** to the six pathfinder categories above. The bbq
   artifact covers some of these — goals, constraints, architecture — but
   typically lacks project-level concerns like team composition, timeline,
   phases, and cross-cutting strategies.
3. **Ask only what is missing**: skip categories already covered by the
   artifact; open rounds for categories the artifact does not address.
4. **Do not re-interview** what the artifact has settled. If a bbq decision
   contradicts something the current project state reveals, surface the
   contradiction explicitly — quote both, ask which holds — but do not
   silently re-derive.
