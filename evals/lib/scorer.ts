import type { CellResult, CellScore, ExpectedFinding } from "./types.ts";

/**
 * Deterministic findings-matching scorer — no LLM judge.
 *
 * The suite prompt imposes the output contract: the agent's final message
 * ends with `DEVIATION: <file>:<line> <description>` lines, or the single
 * line `NO DEVIATIONS`. An expected finding is matched when one deviation
 * line satisfies every one of its regex patterns (case-insensitive).
 *
 *   recall    = matched expected findings / expected findings
 *               (1.0 when nothing was expected — the compliant fixture)
 *   precision = matching deviation lines / all deviation lines
 *               (phantom findings push it down; null when the agent
 *               reported nothing while findings were expected)
 */

export interface ContractOutput {
  deviationLines: string[];
  noDeviations: boolean;
}

// Tolerant of markdown decoration around the keywords (bullets, quotes,
// bold/italic markers, backticks, ordered-list numbering — the prompt numbers
// its own instructions, so `1. DEVIATION: …` is a plausible answer too):
// "**DEVIATION**: …" and "`NO DEVIATIONS`" are compliant answers, not
// contract violations.
const NUMBERING = /(?:\d+[.)][\s>]+)*/.source;
const DEVIATION_RE = new RegExp(`^[\\s>#*_\`-]*${NUMBERING}DEVIATION[*_\`]*:\\s*(.+)$`, "gim");
const NO_DEVIATIONS_RE = new RegExp(`^[\\s>#*_\`-]*${NUMBERING}NO DEVIATIONS[\\s*_\`.!]*$`, "im");

export function extractContract(finalText: string): ContractOutput {
  const deviationLines = [...finalText.matchAll(DEVIATION_RE)]
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean);
  return { deviationLines, noDeviations: NO_DEVIATIONS_RE.test(finalText) };
}

function findingMatches(line: string, finding: ExpectedFinding): boolean {
  return finding.patterns.every((pattern) => new RegExp(pattern, "i").test(line));
}

export function scoreCell(result: CellResult, expected: ExpectedFinding[]): CellScore {
  const base = {
    spec: result.spec,
    status: result.status,
    durationMs: result.durationMs,
    turns: result.transcript?.turns ?? null,
    costUsd: result.transcript?.costUsd ?? null,
    modelUsed: result.transcript?.modelUsed ?? null,
  };

  const finalText = result.transcript?.finalText ?? "";
  const { deviationLines, noDeviations } = extractContract(finalText);
  const contractViolation = result.status !== "ok" || (deviationLines.length === 0 && !noDeviations);

  if (contractViolation) {
    return {
      ...base,
      recall: 0,
      precision: 0,
      matchedKeys: [],
      phantomLines: deviationLines,
      deviationLineCount: deviationLines.length,
      contractViolation: true,
      referencesRead: referencesRead(result),
    };
  }

  const matchedKeys = expected
    .filter((finding) => deviationLines.some((line) => findingMatches(line, finding)))
    .map((finding) => finding.key);
  const phantomLines = deviationLines.filter((line) => !expected.some((finding) => findingMatches(line, finding)));

  const recall = expected.length === 0 ? 1 : matchedKeys.length / expected.length;
  let precision: number | null;
  if (deviationLines.length === 0) {
    // Reported nothing: vacuously precise for the compliant fixture,
    // undefined when findings were expected but none reported.
    precision = expected.length === 0 ? 1 : null;
  } else {
    precision = (deviationLines.length - phantomLines.length) / deviationLines.length;
  }

  return {
    ...base,
    recall,
    precision,
    matchedKeys,
    phantomLines,
    deviationLineCount: deviationLines.length,
    contractViolation: false,
    referencesRead: referencesRead(result),
  };
}

/** Did the agent read anything under skill/references/? null = undetectable. */
function referencesRead(result: CellResult): boolean | null {
  const reads = result.transcript?.toolReads;
  if (reads === null || reads === undefined) return null;
  return reads.some((path) => /skill\/references\//.test(path) || /(^|\/)references\//.test(path));
}

/** Mean of the non-null values; null when every value is null. */
export function meanOrNull(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}
