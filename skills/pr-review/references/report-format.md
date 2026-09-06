# PR Review — Report format

Templates for composing the review output in each mode. Read
[severity-guide.md](severity-guide.md) first — the finding fields referenced
here are defined there.

## Local mode

### Output location

Write to `reviews/pr-review-<PR>.md` in the reviewed project's root directory,
where `<PR>` is the PR number (e.g. `reviews/pr-review-42.md`). Create the
`reviews/` directory if it does not exist. Overwrite if the file already exists.
Do not modify `.gitignore`.

### Template

````markdown
# PR Review: #<number> — <title>

**Repo:** <owner/repo>
**Branch:** <head> → <base>
**Status:** <open | merged | draft>
**Level:** <quick | standard | thorough>
**Verdict:** <approve | request changes | comment>

<1–2 sentence summary of the overall assessment.>

## Blockers

### 1. <summary>

- **File:** `<file>:<line>`
- **Category:** <category>
- **Why:** <consequence or risk>
- **Fix:**

```<lang>
<suggested fix>
```

## Majors

### 2. <summary>

...

## Minors

### 3. <summary>

...

## Nits

### 4. <summary>

...

## Cross-file observations

1. **[<severity> · <category>]** <summary>
   - **Why:** <consequence or risk>
   - **Fix:** <description or code block>
````

### Rules

- Group findings by severity in order: blockers, majors, minors, nits.
- Omit empty severity sections entirely — no "no findings" placeholder.
- Number findings sequentially across all sections (1, 2, 3, …) — do not
  restart numbering in each section.
- Fixes are regular fenced code blocks with a language tag — not GitHub
  suggestion syntax.
- Cross-file observations go in their own trailing section. Omit the section if
  there are no cross-file findings.

## Online mode

### Review body

The review body (the top-level text of the GitHub review) contains:

1. First line: `**Verdict:** <approve | request changes | comment>`
2. A 1–2 sentence summary.
3. An **Out-of-diff and cross-file findings** section, present only when there
   are findings whose lines fall outside the PR diff or cross-file observations.
   Each finding is a numbered item with all six fields. If this section is empty,
   omit it — the body is just the verdict and summary.

### Inline comments

Each finding whose line is within the PR diff becomes an inline comment on that
line. Format per comment:

- One line: the summary, prefixed with severity and category in bold.
  Pattern: `**<severity> · <category>**: <summary>`
- If a fix is available, add a GitHub suggestion block immediately after.
- Two lines are acceptable only when the "why" is essential context that cannot
  be inferred from the summary alone.

Example:

````
**blocker · correctness**: Null dereference when `user` is undefined.

```suggestion
if (user == null) return;
const name = user.name;
```
````

### Submission

Submit as a single GitHub review via `gh api` — not as individual comments. Use
the pulls reviews endpoint:

```
POST /repos/{owner}/{repo}/pulls/{number}/reviews
```

Set `event` to `COMMENT` — never `APPROVE` or `REQUEST_CHANGES`, since the
reviewer may be the PR author or the review is automated.

Inline comments go in the `comments` array of the request body, each with
`path`, `line`, and `body`. The `line` field refers to the line number in the
**new version** of the file (the right side of the diff). For deleted lines,
use `side: "LEFT"` with the old-file line number.

### Rules

- Never post more than one inline comment on the same line — merge findings for
  that line into a single comment.
- Inline comments only for lines present in the diff; everything else goes in
  the review body.
- Never create a GitHub issue.
- The GitHub API review event is always `COMMENT`, regardless of the verdict
  stated in the body.
