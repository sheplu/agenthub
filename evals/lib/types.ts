/**
 * Shared data model of the benchmarking framework.
 *
 * A benchmark run expands into a matrix of cells:
 *   harness x model x fixture x runIndex
 * Each cell spawns one agent, captures its transcript, and is scored
 * deterministically against the suite's expectations.
 */

/** suite.json — one benchmark suite per skill. */
export interface SuiteConfig {
  /** Suite name; must match the directory under evals/suites/. */
  name: string;
  /** Skill under skills/<name>/ this suite benchmarks. */
  skill: string;
  /** Prompt file (relative to the suite dir) imposing the output contract. */
  prompt: string;
  /** Expectations file (relative to the suite dir). */
  expected: string;
  /** Fixture directory (relative to the suite dir). */
  fixturesDir: string;
  /** Harnesses exercised by default (CLI --harness overrides). */
  harnesses: string[];
  /**
   * Models per harness. "default" means: pass no model flag, record what
   * the harness actually ran. CLI --model overrides for all harnesses.
   */
  models: Record<string, string[]>;
  /** Runs per cell for a trustworthy regression verdict (--regression). */
  regressionRuns: number;
  /** Wall-clock cap per cell, enforced by the runner (all harnesses). */
  timeoutSeconds: number;
  /** Turn cap, passed to harnesses that support it (claude, vibe). */
  maxTurns: number;
  /** Price cap in USD, passed to harnesses that support it (vibe). */
  maxPriceUsd: number;
}

/** One seeded defect the agent is expected to report for a fixture. */
export interface ExpectedFinding {
  /** Stable identifier used in reports. */
  key: string;
  /**
   * Regex sources (flags: i). A DEVIATION line matches this finding only
   * if it matches EVERY pattern — combine a file anchor and a defect
   * signature to stay robust to wording variance across models.
   */
  patterns: string[];
}

/** expected.json — fixture name to its seeded defects (empty = compliant). */
export type ExpectedMap = Record<string, ExpectedFinding[]>;

/** Coordinates of one cell in the matrix. */
export interface CellSpec {
  suite: string;
  harness: string;
  /** null = harness default model (no flag passed). */
  model: string | null;
  fixture: string;
  /** 0-based repetition index (--runs). */
  runIndex: number;
}

/** What an adapter could extract from a harness transcript (best-effort). */
export interface TranscriptInfo {
  /** Final assistant text, where the output contract lines must appear. */
  finalText: string;
  turns: number | null;
  costUsd: number | null;
  /** Model that actually ran, as reported by the harness. */
  modelUsed: string | null;
  /**
   * File paths the agent read (tool calls), used for the reference-loading
   * metric. null = this harness's transcript does not expose tool calls.
   */
  toolReads: string[] | null;
}

export type CellStatus = "ok" | "error" | "timeout";

/** Raw outcome of one cell, persisted as JSON under results/<run>/cells/. */
export interface CellResult {
  spec: CellSpec;
  status: CellStatus;
  startedAt: string;
  durationMs: number;
  exitCode: number | null;
  transcript: TranscriptInfo | null;
  /** Raw stdout capture, relative to the results dir. */
  rawOutputFile: string;
  error?: string;
}

/** Deterministic score of one cell. */
export interface CellScore {
  spec: CellSpec;
  /** Expected findings matched / expected findings (1.0 when none expected and none reported). */
  recall: number | null;
  /** Matching DEVIATION lines / all DEVIATION lines (null when the agent reported none and some were expected). */
  precision: number | null;
  matchedKeys: string[];
  /** DEVIATION lines that matched no expected finding (phantoms). */
  phantomLines: string[];
  deviationLineCount: number;
  /** Neither DEVIATION lines nor NO DEVIATIONS found in the final text. */
  contractViolation: boolean;
  /** Did the agent read skill/references/*? null = not detectable. */
  referencesRead: boolean | null;
  status: CellStatus;
  turns: number | null;
  costUsd: number | null;
  durationMs: number;
  modelUsed: string | null;
}

/** meta.json — provenance of a results directory. */
export interface RunMeta {
  startedAt: string;
  suite: string;
  argv: string[];
  node: string;
  skill: {
    name: string;
    /** Last commit touching skills/<name>/ (the skill "version"). */
    sha: string | null;
    /** Uncommitted changes under skills/<name>/. */
    dirty: boolean;
    repoHead: string | null;
  };
  harnessVersions: Record<string, string | null>;
  skippedHarnesses: string[];
}
