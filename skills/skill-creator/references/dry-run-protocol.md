# Skill Creator — Dry-run protocol

How to test a drafted skill with the user before declaring it done. Runs
after the scaffold passes [validation-checklist.md](validation-checklist.md);
feedback lands as edits governed by
[authoring-workflow.md](authoring-workflow.md).

## Why

A skill is text; the only test is use. A draft that has never been exercised
against a realistic prompt ships its gaps to every future invocation. Dry
runs surface them while the author and the user are still in the same
conversation.

## Procedure

1. **Propose test prompts.** Offer 3 realistic prompts — the kind of thing
   a real user would type — together covering distinct triggers and every
   mode the skill has; each run needs its own approved prompt, so three keep
   the full budget runnable. The user approves, replaces, or adds prompts;
   run only approved ones.

2. **Run each dry run in-conversation.** Announce it with a visible boundary:

   ```
   — Dry run 1: "<prompt>" —
   ```

   Then role-play an agent whose only knowledge of the skill is **the drafted
   skill files** — narrate which file it reads first, which rules fire, and
   what it produces. Show would-be file outputs inline as fenced blocks.
   Two absolutes:
   - If the role-play needs knowledge the files do not contain, that is a gap
     in the skill — stop, name the gap, never improvise over it.
   - **Never write files or run state-changing commands inside a
     simulation.** A dry run that mutates anything is not a dry run.

3. **Collect feedback.** After each run, ask targeted questions: did the
   skill trigger on the right cue? Did it read the right reference first?
   Is the output the right shape? What is missing or wrong?

4. **Revise between runs.** Apply the feedback to the skill files before the
   next run and state each change made. Feedback that contradicts a confirmed
   intake answer goes back to the user as a question — never silently
   overwrite a confirmed decision.

5. **Finish on a clean run.** The final run should pass without triggering
   new revisions. If it does not, revise and run once more within budget.

## Rules

- **Budget: 2–3 runs**, one revision pass between consecutive runs. A skill
  still collecting feedback after three runs has an intake problem — go back
  to the interview, not into a fourth run.
- Each run uses a different approved prompt — re-running the same prompt
  tests the fix, not the skill.
- After the final revision, re-run
  [validation-checklist.md](validation-checklist.md) — feedback edits break
  conventions as easily as any other edit.
