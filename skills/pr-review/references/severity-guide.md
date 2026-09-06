# PR Review — Severity guide

Severity definitions, category definitions, and the rules for filtering and
prioritizing findings. Consult this while classifying findings during the
[review procedure](review-procedure.md).

## Severities

| Severity | Meaning | Examples |
| --- | --- | --- |
| `blocker` | Will cause a bug, crash, data loss, or security vulnerability in production. Must be fixed before merge. | Null dereference on a reachable path; SQL injection; broken migration that loses data; race condition causing corruption; exposed secret. |
| `major` | Significant issue that does not immediately break production but will cause real problems — reliability, maintainability, or correctness risk. Should be fixed before merge. | Missing error handling on a network call; tautological assertion in a test; public API accepting unchecked input; resource leak under normal usage. |
| `minor` | Improvement worth making — cleaner, safer, or more maintainable — but not blocking merge. | Unnecessary type assertion; duplicated logic extractable into a helper; misleading variable name; missing edge-case test for a non-critical path. |
| `nit` | Style, naming, or trivial preference. Acceptable to ignore. | Import order; trailing whitespace; comment wording; slightly verbose expression that could be simplified. |

When uncertain between two adjacent severities, pick the lower one. A finding
inflated to `blocker` that is not one erodes trust in the review.

## Categories

| Category | Scope |
| --- | --- |
| `correctness` | Logic errors, wrong behavior, off-by-one, type mismatches, broken contracts, description-vs-code mismatches. |
| `security` | Injection, auth/authz bypass, secrets exposure, unsafe deserialization, missing input validation with security impact. |
| `error-handling` | Missing or swallowed errors, unhelpful error messages, missing retries where expected, panic/crash in library code. |
| `design` | API shape, abstraction level, coupling, separation of concerns, naming that misleads about responsibility. |
| `testing` | Missing tests for changed behavior, tautological assertions, flaky patterns, inadequate coverage of new code paths. |
| `performance` | Unnecessary allocations in hot paths, O(n²) where O(n) is straightforward, missing indexes, unbounded queries or collections. |
| `style` | Formatting, naming conventions, import order, comment quality — anything that does not affect runtime behavior. |

## Finding schema

Every finding must have exactly these six fields — no extra fields, no omissions:

- **`file:line`** — file path relative to the repo root and the primary line
  number. Omit for cross-file findings that span multiple locations.
- **severity** — one of: `blocker`, `major`, `minor`, `nit`.
- **category** — one of the seven categories defined above.
- **summary** — one sentence stating what is wrong.
- **why** — one or two sentences explaining the consequence or risk.
- **fix** — a concrete suggested fix: a code block or brief instruction. If no
  fix is obvious, say so explicitly rather than inventing a wrong one.

## Level filtering

| Level | Included severities | Typical use |
| --- | --- | --- |
| `quick` | blocker | Fast pass for CI-blocking issues only. |
| `standard` | blocker, major, minor | Default — thorough enough for a merge decision. |
| `thorough` | blocker, major, minor, nit | Full review including style and preference feedback. |

Apply the filter **after** the full review is complete — evaluate every finding
at every level, then drop findings whose severity is below the level's threshold
before composing the output. Never skip the review work itself based on level;
only the output is filtered.

## Prioritization and soft cap

Aim for 10–15 findings in the final output. If the review produces more after
level filtering, keep the most important:

1. All blockers — never drop a blocker.
2. Majors, then minors, then nits.
3. Within a severity tier, prioritize by category:
   security > correctness > error-handling > design > testing > performance >
   style.

A PR with more than 15 filtered findings likely has systemic issues. Note this
in the verdict summary and recommend the author address the root patterns rather
than listing every instance.
