# Skill Creator — Authoring workflow

The end-to-end procedure for creating a new skill or updating an existing
one. Shapes and conventions live in [skill-anatomy.md](skill-anatomy.md);
dry-run mechanics in [dry-run-protocol.md](dry-run-protocol.md); the final
gate in [validation-checklist.md](validation-checklist.md).

## Parameters

1. **Mode** (inferred from the request): `create` — a skill that does not
   exist yet; `update` — a change to an existing skill. When ambiguous
   ("improve our review skill" could be either), ask.
2. **Target repo** (default: the current working directory): where the skill
   will live. Run anatomy's portability detection before anything else when
   it is not this catalog.

## Create mode

1. **Recon.** Before asking the user anything, mine what is already
   available. Asking the user something recon could answer wastes a round.
   - *Conversation*: workflow steps already demonstrated in this session,
     tools and commands used, corrections and preferences the user stated,
     repeated patterns worth encoding. A "turn this into a skill" request
     means most answers are already in the transcript.
   - *Repo*: `git log` and files touching the domain, existing skills whose
     scope borders the new one (overlap must become an explicit boundary),
     docs or configs that constrain the skill.
   - Output: a pre-filled intake sheet — every answer tagged **confirmed**
     (stated in conversation), **inferred** (recon suggests it, needs
     confirmation), **conflicting** (contradictory signals — must ask), or
     **unknown** (must ask). An empty sheet is a valid outcome — never pad
     it.
   - Precedence: a later correction outranks an earlier demonstration — what
     the user said to stop doing is a **confirmed** "never", not a conflict.
     Only signals of equal authority that disagree are **conflicting**;
     surface both, never silently rank them.

2. **Intake interview.** Batched, numbered rounds — never one-question
   ping-pong. Present confirmed answers for a quick yes, inferred answers
   with your recommendation, and ask only the unknowns. Vague answers
   ("make it professional", "the usual") are prompts to probe — push for a
   named standard, a concrete example, a boundary. Contradictory answers are
   surfaced with both statements together, never silently resolved.

   | Area | Questions | Resolved when |
   | --- | --- | --- |
   | Purpose | What job does the skill do, for whom? What pain does it remove? | The job fits in one sentence. |
   | Triggers | Which phrases and situations should fire it? What must NOT fire it? | Trigger phrases are quotable; the not-trigger boundary names the sibling skill that owns it. |
   | Scope | What is in, what is out, what overlaps a sibling skill? | Every borderline case is assigned in or out. |
   | Modes | One workflow or several (author vs review, create vs update)? | Each mode has a name and an entry condition. |
   | Constraints | Hard rules — things it must always or never do? | Each constraint is testable and the user confirmed it. |
   | References | What detail (formats, catalogs, procedures) will the references need to hold? | The reference file list is sketchable. |

3. **Inspiration.** Propose named candidates from three pools, then read only
   what the user confirms — never read in depth on your own initiative:
   - skills already in the target repo or this catalog;
   - the public [anthropics/skills](https://github.com/anthropics/skills)
     catalog;
   - the user's own projects — sibling repos on disk or on their GitHub —
     that touch the domain.

   Offer 2–3 per relevant pool with a one-line reason each and mark a
   recommended pick; the user confirms which 2–3 total to use. Read the confirmed ones and note what to borrow
   (structure, rules, wording) and what to reject. If a remote pool is
   unreachable, say so and proceed with local candidates.

4. **Scaffold.** The scaffold is the skill's own files — SKILL.md and its
   references, pure instructions — never application code. It lands where the
   target repo keeps skills (`skills/`, `.claude/skills/`, or the detected
   equivalent); code the skill later produces belongs to the repo's normal
   layout, not to the skill folder. Order matters:
   1. Pick the name — kebab-case, check for collisions with existing skills.
   2. Draft the description per anatomy's trigger pattern and confirm it with
      the user — it is the skill's single most load-bearing sentence.
   3. Write the reference files first: they are where detail lives.
   4. Write SKILL.md last, so its summary genuinely defers to references that
      already exist.

5. **Validate.** Run every check in
   [validation-checklist.md](validation-checklist.md); fix and re-run until
   clean. Never present a draft with a failing check.

6. **Dry runs.** Hand off to [dry-run-protocol.md](dry-run-protocol.md) —
   2–3 simulated runs with user feedback and revisions between them.

7. **Finalize.** Present the final file tree and a one-paragraph summary of
   what changed since the first draft. Offer — do not force — an `eval/`
   folder for interview-style skills. For committing, follow the repo's
   commit conventions skill (`pr-commit` in this catalog) when one exists.

## Update mode

1. **Read the existing skill fully** — SKILL.md and every reference — before
   touching anything.
2. **Diff the request against the current state**: what exactly must change,
   and what the request does *not* ask for. An empty diff — the request is
   already satisfied — is a finding to report, not a prompt to invent
   changes.
3. **Classify the change**: trigger wording, a new rule, a new reference
   file, a restructure. The class decides where the edit lands.
4. **Apply minimally — no scope creep.** Touch nothing the request does not
   require. New detail goes into a reference; the summary gets at most a new
   pointer bullet. Rewrites of untouched sections are defects, not polish.
5. **Re-validate the whole skill** against
   [validation-checklist.md](validation-checklist.md) — an edit can break a
   convention far from where it landed (line budget, table bijection).
6. **Dry-run when behaviour changed**: at least one simulated run per
   [dry-run-protocol.md](dry-run-protocol.md). Pure wording fixes may skip
   this — say so explicitly.

## Shared rules

- **Facts vs decisions**: anything discoverable — the repo, its history,
  public docs — is the author's job to look up. Only judgment calls,
  preferences, and domain knowledge go to the user.
- **Delegated decisions are recorded**: when the user says "you decide",
  decide, state the reasoning, and mark the decision as delegated in the
  draft.
- **Plain-text mechanics**: the interview and the dry runs happen in ordinary
  markdown messages — no harness-specific question or form tools.
