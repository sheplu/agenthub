# BBQ — Question categories

The six categories the interview must cover. Every category is either visited
(at least one settled point) or explicitly skipped with the user's
confirmation — see step 6 of
[interview-procedure.md](interview-procedure.md). Each category feeds a
specific section of the artifact defined in
[output-format.md](output-format.md).

Example probes are starting points, not scripts — adapt them to the subject
and its scale. For a small task, one question per relevant category may be
enough; for a project, each category can carry several rounds.

## 1. Goals & success criteria

*Feeds: Project brief (goals, success criteria).*

What the work must achieve and how anyone would know it did.

- "What becomes possible when this ships that is impossible today?"
- "Three months after launch, what number or observable fact tells you it
  worked?"
- "If you could only have one of these outcomes, which one?"

**Resolved** looks like: a ranked list of outcomes, each with an observable
success signal ("finance stops chasing renewals by hand; zero invoices
unpaid past 60 days over a quarter"). **Vague** looks like: "make billing
better", "improve the workflow" — push for the observable change.

## 2. Users & stakeholders

*Feeds: Project brief (users).*

Who touches the thing, who is affected by it, and who can veto it.

- "Name one real person who will use this. What do they do the moment before
  and the moment after?"
- "Who is harmed or inconvenienced if this works exactly as designed?"
- "Whose sign-off can stop this from shipping?"

**Resolved** looks like: named roles (or people) with their touchpoint and
what each needs from the system. **Vague** looks like: "the team",
"everyone" — push for one concrete person and their walkthrough.

## 3. Domain & language

*Feeds: Domain glossary.*

The terms the subject lives in, defined precisely enough that no two readers
picture different things.

- "You said `<term>` — define it as if to a new hire on day one."
- "Is a `<term A>` always a `<term B>`? When is it not?"
- "What word does the business use for this that the code doesn't, or vice
  versa?"

**Resolved** looks like: each load-bearing term has one precise meaning,
with its boundaries ("an *invoice* is one issued bill for one customer and
one billing period — a bill spanning several periods is a *statement*, not
an invoice"). **Vague** looks like: terms used interchangeably or defined by
example only — push for the boundary cases.

## 4. Architecture & integration

*Feeds: Decisions & constraints.*

How the work fits the systems that already exist — data in, data out,
runtime, and the seams it must not break.

- "What does this read from and write to? What already owns that data?"
- "What existing system does this replace, wrap, or feed?"
- "Where does it run, and who operates it at 3 a.m.?"
- "How fast, how available, how big — which numbers must it hit, measured
  where?"

Recon first: most architecture *facts* live in the codebase and configs —
ask the user only about the choices the environment cannot reveal.

**Resolved** looks like: named systems on each boundary and a stated
integration direction for each. **Vague** looks like: "it'll talk to the
API", "we'll host it somewhere" — push for which API, which host, whose
credentials.

## 5. Constraints & non-goals

*Feeds: Project brief (non-goals) and Decisions & constraints.*

The walls: what the solution must not do, must not use, and must not become.

- "What is this explicitly *not*? What adjacent problem are we refusing to
  solve?"
- "Any hard limits — budget, deadline, compliance, tech stack, headcount?"
- "What would make you reject an otherwise perfect solution?"

**Resolved** looks like: each constraint with its source and its cost of
violation ("customer data never leaves the EU region — legal requirement,
hard"). **Vague**
looks like: "keep it simple", "nothing too expensive" — push for the line
that must not be crossed and who drew it.

## 6. Edge cases & risks

*Feeds: Decisions & constraints and Open questions.*

Where the happy path ends: failure modes, rare-but-real scenarios, and the
assumptions most likely to be wrong.

- "What is the ugliest input or situation this must survive?"
- "What happens when `<the main dependency>` is down, slow, or wrong?"
- "Which of the answers you've given me are you least sure about?"

**Resolved** looks like: each named edge case has a decided behavior, or is
recorded as an open question with an owner. **Vague** looks like: "we'll
handle errors properly" — push for the specific scenario and the specific
behavior.
