# Skill benchmarking framework

Benchmarks the skills under `skills/` across coding-agent harnesses (claude,
codex, opencode, vibe) and models: does the skill work as expected, does a
new version degrade quality, and does it hold up equally across harnesses?
Runs locally, scores deterministically (no LLM judge), and prints a markdown
matrix.

## How it works

A **suite** benchmarks one skill (`suites/<name>/`). Each suite has:

| File | Purpose |
| --- | --- |
| `suite.json` | Skill under test, harness/model matrix, guardrails (`regressionRuns`, `timeoutSeconds`, `maxTurns`, `maxPriceUsd`). |
| `prompt.md` | The canonical task prompt, identical for every harness. It — not the skill — imposes the **output contract**: end with `DEVIATION: <file>:<line> <description>` lines, or `NO DEVIATIONS`. |
| `fixtures/<name>/` | Self-contained workspaces with known seeded defects (plus a `compliant` golden fixture that must yield zero deviations). |
| `expected.json` | Fixture → expected findings. A DEVIATION line matches a finding only if it matches **every** regex of that finding (case-insensitive) — combine a file anchor with a defect signature. |

A run expands **harness × model × fixture × runs** into cells. Each cell gets
an isolated temp sandbox containing `skill/` (copy of `skills/<name>/`) and
`workspace/` (copy of the fixture), spawns the harness CLI headlessly with
read-only tools, captures the transcript, and scores it:

- **recall** — expected findings matched / expected findings
- **precision** — matching DEVIATION lines / all DEVIATION lines (phantoms
  push it down; any finding on `compliant` drops it to 0)
- **reference loading** — did the agent read `skill/references/*`?
  (best-effort from transcript tool calls; `n/a` where undetectable)
- plus turns, cost, duration, and contract violations

Every run records provenance in `meta.json`: the skill's version (last commit
touching `skills/<name>/` + dirty flag) and each harness's version. Skills
carry no version field on purpose — the git SHA is the version.

## Usage

Requires Node ≥ 24 (TypeScript runs natively; `npm ci` only installs the
type-checking toolchain). Harnesses are detected on PATH and skipped
gracefully when missing.

```sh
node evals/bench.ts list                 # harness availability + suites
node evals/bench.ts run                  # full matrix, default 1 run/cell
node evals/bench.ts run --harness claude --fixture compliant
node evals/bench.ts run --regression     # runs/cell from suite regressionRuns (5)
node evals/bench.ts run --model sonnet   # model override (harness must support it)
node evals/bench.ts score <results-dir>  # re-render the report from raw cells
```

Useful flags: `--runs N`, `--concurrency N` (default 4), `--timeout SEC`,
`--max-turns N`, `--max-price USD` (vibe only), `--keep-sandbox`, `--dry-run`.

Results land in `evals/results/<timestamp>/` (gitignored): `meta.json`,
`cells/*.json` + raw transcripts, and `report.md`. Nothing is persisted as a
baseline in v1 — compare reports across runs; the recorded skill SHA tells
you which version each report measured.

### Guardrails per harness

| | turn cap | price cap | read-only tools | hard stop |
| --- | --- | --- | --- | --- |
| claude | `--max-turns` | — | `--allowedTools Read Glob Grep` | runner timeout |
| codex | — | — | `--sandbox read-only` (native) | runner timeout |
| opencode | — | — | sandbox `opencode.json` denies edit/bash/webfetch | runner timeout |
| vibe | `--max-turns` | `--max-price` | `--enabled-tools read*/grep*/glob*/…` | runner timeout |

### The mock harness

`--harness mock --mock-dir <dir>` replays canned transcripts
(`<fixture>.txt`, optional `#TURNS/#COST/#MODEL/#READS/#EXIT` directives) —
zero cost, fully deterministic. The test suite uses it to exercise the whole
pipeline: `npm test`.

## Adding a suite for another skill

1. `mkdir evals/suites/<skill>` with `suite.json`, `prompt.md`,
   `expected.json`, `fixtures/`.
2. Author the `compliant` fixture by *following the skill* — it must be
   correct per the skill's own references, or precision measurements are
   meaningless.
3. Derive each defect fixture from `compliant` with exactly one seeded
   defect, and describe it in `expected.json` with loose regexes (models word
   findings differently).
4. Keep the output contract in `prompt.md` — the scorer only understands
   `DEVIATION:` lines and `NO DEVIATIONS`.

## Interpreting the report

- `compliant` at `1.00/1.00` on a harness = the skill's precision baseline.
- A defect fixture's recall < 1 on one harness but not others = the skill
  relies on behavior that harness doesn't provide (often: it never read the
  references — check the refs-read column).
- `⚠CV` (contract violation) = the agent didn't follow the output format;
  a harness-capability signal, not a skill-quality one.
- For regression verdicts on a skill change, use `--regression` (mean over 5
  runs) — single runs are noisy.
