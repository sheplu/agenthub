You are verifying a brag document against its source data. Follow these instructions exactly.

## Task

1. Read `skill/SKILL.md` and follow its instructions, reading the files under
   `skill/references/` exactly as the skill directs you to. Focus on the output
   format rules, categorization definitions, evidence requirements, and
   ongoing-work lifecycle.
2. Verify the brag document at `workspace/brag.md` against the source data in
   `workspace/source-data/` and the profile in `workspace/profile.json`.

This is a read-only verification task. Ignore the skill's bootstrap,
storage-write, and live data-gathering procedures (running `git` or `gh`):
the source data for the period is provided under `workspace/source-data/`.

## What to verify

Check every rule defined in the skill's references:

- **Evidence traceability**: every entry in `brag.md` must trace to a matching
  record in `source-data/`. An entry whose summary does not correspond to any
  commit, PR, issue, or review in the source data is a deviation.
- **Evidence links**: every entry must include an evidence link in brackets
  (`[<url>]` or `[<short-sha>]`). A missing link is a deviation.
- **Categorization**: each entry must be in the correct category per the
  definitions in the skill's `output-format.md`. A PR review listed under
  "Features" instead of "Reviews" is a deviation.
- **Ongoing-work correctness**: items in "Ongoing Work" must correspond to
  open/in-progress items in the source data. A merged or closed item still
  listed as ongoing is a deviation.
- **Document structure**: the document must follow the template in
  `output-format.md` — header block, period sections with categories, recap.
  Structural violations (missing header fields, wrong section order) are
  deviations.
- **No fabrication**: an entry whose summary does not correspond to any commit,
  PR, issue, or review in the source data is a deviation, as is any metric or
  quantified claim (percentages, counts, dollar amounts) that does not appear
  in the source data. Qualitative impact-note framing is not a deviation — the
  skill's level-aware framing rules explicitly allow it — unless it contradicts
  the source data.

## Scope

- Judge only what is verifiable from the files under `workspace/`.
- The source data files (`git-log.txt`, `prs-authored.json`,
  `prs-reviewed.json`, `issues-closed.json`, `prs-open.json`) represent the
  complete ground truth for this period. If an entry in `brag.md` has no
  matching record in these files, it is fabricated.
- **Direction of checking**: verify that every entry in `brag.md` traces to the
  source data (brag → source). Not every source record needs to appear as a
  brag entry — the author may legitimately omit trivial commits or minor items.
  Only flag entries that cannot be traced, not source records that were omitted.
- If the same defect appears in both an entry and the period recap, report it
  once, at the entry's line number.
- Do not report deviations about: MCP sources (none in the fixture), runtime
  behaviors (`.state.json` lifecycle), or the bootstrap procedure.
- Do not modify any file. This is a read-only review.

## Output contract (mandatory)

End your final message with the review verdict in exactly this format:

- One line per deviation found, formatted as:
  `DEVIATION: brag.md:<line> <short description>`
  with the line number in `brag.md` where the deviation occurs.
- If there are no deviations, output exactly this single line instead:
  `NO DEVIATIONS`

Do not wrap the verdict lines in a code block. Do not output a DEVIATION line
for stylistic preferences the skill does not mandate.
