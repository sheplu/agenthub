# BBQ — Interview procedure

The step-by-step procedure for running the interview. Consult
[question-categories.md](question-categories.md) while composing rounds and
[output-format.md](output-format.md) before writing the artifact.

## Parameters

1. **Subject** (required): the unit of work to understand — a project, a
   feature, or a single task. Infer it from the user's request; if the
   request mixes several subjects, ask which one to interview first.
2. **Mode** (inferred): list the existing `plan/*/` subfolders and match
   the subject against them by meaning — never by re-deriving the slug
   string, since the same subject can be phrased differently across runs.
   `re-run` when an existing folder covers the subject (reuse its slug);
   `fresh` otherwise. Slug rules live in
   [output-format.md](output-format.md).

## Procedure

1. **Recon.** Before asking anything, gather every fact the environment can
   answer: read the codebase, docs, configs, issue trackers, and anything
   else reachable. Facts are never questions for the user — asking the user
   something you could have looked up wastes their round and erodes trust in
   the interview. Long-running lookups do not block the interview: ask the
   questions that do not depend on them, and fold the results into a later
   round.

2. **Model the interview as a tree of open questions.** Every answer either
   settles a point or spawns follow-up questions that depend on it. At any
   moment, the askable set is exactly the questions whose prerequisites are
   already settled. A question whose answer depends on another question still
   open in the current round belongs to a later round.

3. **Ask in rounds.** Each round contains every currently askable question —
   batched, so the user answers in one pass instead of a ping-pong of
   singles. Format each question as:

   ```
   ❓ **Q<n>** — **<short title>**: <the question, with concrete options
   when the choice space is enumerable>

   ➡️ <your recommended answer, with a one-line reason>
   ```

   Always recommend. A recommendation gives the user something to push
   against and reveals your assumptions so they can be corrected. Number
   questions continuously across rounds (Q1…Qn) so answers stay
   addressable.

4. **Probe every vague answer.** A vague answer is recorded nowhere — it is
   pushed back in the next round. Techniques, by failure mode:
   - *Unquantified* ("fast", "cheap", "soon") → ask for the number and the
     condition: "fast meaning what, measured where?"
   - *Abstract* ("users", "the data") → ask for a named, concrete instance:
     "name one real user and walk me through their Tuesday."
   - *Deferred* ("we'll figure it out later") → ask what decision downstream
     depends on it; if something does, it cannot be deferred silently — it
     becomes a recorded open question with an owner.
   - *Assumed* (a claim stated as obvious) → ask for the counterexample:
     "what would have to be true for the opposite choice to be right?"
   - *Contradictory* (conflicts with an earlier answer or a recon fact) →
     quote both statements side by side and ask which one holds.

5. **Track resolution.** A branch is resolved when its answer is specific
   (someone else could act on it without asking a follow-up), testable (you
   could tell if the built thing violates it), and its follow-up questions
   have been identified and queued. Keep a running ledger of settled points,
   open questions, and consciously skipped areas — the playback and the
   artifact are built from it.

6. **Sweep the categories.** Before declaring the interview done, walk the
   six categories in [question-categories.md](question-categories.md). Any
   category with no settled points is either opened with a round of its own
   or explicitly skipped — by asking the user to confirm the skip, never by
   silently omitting it. "We consciously skipped X because Y" is a valid
   outcome; an unvisited category is not.

7. **Stop and play back.** The interview ends when every question is either
   settled or consciously deferred — recorded as an open question with an
   owner and a revisit trigger, never silently dropped — and every category
   is visited or skipped. Then present the complete
   understanding in one message — brief, glossary, decisions, open
   questions — and name the artifact path you intend to write. Ask the user
   to confirm or correct. Corrections re-open branches: fold them in and
   play back again. Do not write the artifact before confirmation.

8. **Write the artifact.** On confirmation, write
   `plan/<subject-slug>/context.md` per
   [output-format.md](output-format.md). Creating the folders is part of
   this step.

## Re-run mode

When the artifact already exists for the subject:

1. **Read the artifact** and treat every recorded decision as settled ground
   truth — do not re-ask settled questions from scratch.
2. **Analyze before asking.** Compare the artifact against the current state
   of the project (recon again) and against itself. Build a challenge list:
   decisions the code has since drifted from, constraints that may have
   expired, open questions past their date, and pairs of decisions that
   contradict each other.
3. **Open with a challenge round**: present the challenge list as the first
   round, each item with a recommendation (keep, revise, or drop).
4. **Interview only the deltas** — new ground and revised decisions follow
   the normal procedure from step 2 onward.
5. **Update in place** per the re-run rules in
   [output-format.md](output-format.md): revised decisions keep their
   history; nothing is silently rewritten.

## Edge cases

| Condition | Behavior |
| --- | --- |
| User answers "just decide" | Decide, state the decision and its reason in the next round, and record it as agent-recommended, user-delegated. |
| User wants to stop early | Play back what is settled, list every open question and unvisited category prominently, and — on the user's confirmation of that playback — write the artifact marked as partial. The confirmation gate holds even for partial artifacts. |
| Subject is trivially small | Run the sweep anyway — categories resolve in one round; skip freely but explicitly. Small subject, short interview, same rules. |
| User answers a question with a question | Answer it (it is either a fact you can find or a recommendation you already owe them), then re-ask yours. |
| Subject mixes several units of work | Split: interview the first subject to completion, then offer separate interviews (and separate artifacts) for the rest. |
