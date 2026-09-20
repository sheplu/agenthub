import assert from "node:assert/strict";
import { test } from "node:test";
import { extractContract, meanOrNull, scoreCell } from "../scorer.ts";
import type { CellResult, ExpectedFinding } from "../types.ts";

function cell(finalText: string, overrides: Partial<CellResult> = {}): CellResult {
  return {
    spec: { suite: "s", harness: "mock", model: null, fixture: "f", runIndex: 0 },
    status: "ok",
    startedAt: new Date().toISOString(),
    durationMs: 10,
    exitCode: 0,
    transcript: { finalText, turns: 3, costUsd: 0.01, modelUsed: "m", toolReads: [] },
    rawOutputFile: "cells/x.out.txt",
    ...overrides,
  };
}

const finding = (key: string, ...patterns: string[]): ExpectedFinding => ({ key, patterns });

test("extractContract finds DEVIATION lines and NO DEVIATIONS", () => {
  const output = extractContract(
    "Some prose.\nDEVIATION: a.yaml:1 first\n  - DEVIATION: b.yaml:2 second\nnot a DEVIATION: inline",
  );
  assert.deepEqual(output.deviationLines, ["a.yaml:1 first", "b.yaml:2 second"]);
  assert.equal(output.noDeviations, false);

  assert.equal(extractContract("All good.\nNO DEVIATIONS").noDeviations, true);
  assert.equal(extractContract("no deviations").noDeviations, true);
});

test("markdown-decorated verdicts still satisfy the contract", () => {
  assert.equal(extractContract("**NO DEVIATIONS**").noDeviations, true);
  assert.equal(extractContract("`NO DEVIATIONS`").noDeviations, true);
  assert.equal(extractContract("> _NO DEVIATIONS._").noDeviations, true);

  const bold = extractContract("- **DEVIATION**: quality-gates.yaml:1 tag-pinned checkout");
  assert.equal(bold.deviationLines.length, 1);
  assert.match(bold.deviationLines[0] as string, /tag-pinned/);

  const boldColonInside = extractContract("**DEVIATION:** sast.yaml:5 wrong runner");
  assert.equal(boldColonInside.deviationLines.length, 1);

  // ordered-list numbering: the prompt itself numbers its instructions, so
  // `1. DEVIATION: …` is a plausible compliant answer, not a violation
  assert.equal(extractContract("1. NO DEVIATIONS").noDeviations, true);
  const numbered = extractContract("1. DEVIATION: quality-gates.yaml:23 checkout pinned by tag");
  assert.equal(numbered.deviationLines.length, 1);
  assert.match(numbered.deviationLines[0] as string, /checkout/);
  const parenNumbered = extractContract("2) DEVIATION: sast.yaml:5 wrong runner");
  assert.equal(parenNumbered.deviationLines.length, 1);
});

test("perfect recall and precision", () => {
  const score = scoreCell(cell("DEVIATION: quality-gates.yaml:23 checkout pinned by tag not sha"), [
    finding("tag-pin", "quality-gates", "checkout", "pin|sha|tag"),
  ]);
  assert.equal(score.recall, 1);
  assert.equal(score.precision, 1);
  assert.deepEqual(score.matchedKeys, ["tag-pin"]);
  assert.equal(score.contractViolation, false);
});

test("a finding must match every pattern of an entry", () => {
  const score = scoreCell(cell("DEVIATION: sast.yaml:5 checkout pinned by tag"), [
    finding("tag-pin", "quality-gates", "checkout"),
  ]);
  assert.equal(score.recall, 0);
  assert.equal(score.precision, 0); // the line matched nothing → phantom
  assert.deepEqual(score.phantomLines, ["sast.yaml:5 checkout pinned by tag"]);
});

test("phantom findings reduce precision, not recall", () => {
  const score = scoreCell(
    cell("DEVIATION: quality-gates.yaml:25 cache disabled\nDEVIATION: sast.yaml:9 imaginary problem"),
    [finding("cache", "quality-gates", "cach")],
  );
  assert.equal(score.recall, 1);
  assert.equal(score.precision, 0.5);
  assert.equal(score.phantomLines.length, 1);
});

test("partial recall over multiple expected findings", () => {
  const score = scoreCell(cell("DEVIATION: sast.yaml:17 semgrep on arm runner"), [
    finding("semgrep-runner", "sast", "runner|arm"),
    finding("lint-runner", "quality-gates", "lint", "runner"),
  ]);
  assert.equal(score.recall, 0.5);
  assert.equal(score.precision, 1);
});

test("compliant fixture: NO DEVIATIONS is a perfect score, any finding kills precision", () => {
  const clean = scoreCell(cell("NO DEVIATIONS"), []);
  assert.equal(clean.recall, 1);
  assert.equal(clean.precision, 1);

  const phantom = scoreCell(cell("DEVIATION: quality-gates.yaml:1 made-up issue"), []);
  assert.equal(phantom.recall, 1);
  assert.equal(phantom.precision, 0);
});

test("missing contract output is a violation scored 0", () => {
  const score = scoreCell(cell("I looked around and things seem fine overall."), [finding("x", "anything")]);
  assert.equal(score.contractViolation, true);
  assert.equal(score.recall, 0);
  assert.equal(score.precision, 0);
});

test("non-ok cells are contract violations", () => {
  const score = scoreCell(cell("NO DEVIATIONS", { status: "timeout" }), []);
  assert.equal(score.contractViolation, true);
  assert.equal(score.recall, 0);
});

test("expected findings but nothing reported: precision undefined", () => {
  const score = scoreCell(cell("NO DEVIATIONS"), [finding("x", "anything")]);
  assert.equal(score.recall, 0);
  assert.equal(score.precision, null);
  assert.equal(score.contractViolation, false);
});

test("reference-loading detection", () => {
  const readRefs = cell("NO DEVIATIONS");
  readRefs.transcript!.toolReads = ["/tmp/sbx/skill/references/conventions.md"];
  assert.equal(scoreCell(readRefs, []).referencesRead, true);

  const noRefs = cell("NO DEVIATIONS");
  noRefs.transcript!.toolReads = ["/tmp/sbx/workspace/a.yaml"];
  assert.equal(scoreCell(noRefs, []).referencesRead, false);

  const unknown = cell("NO DEVIATIONS");
  unknown.transcript!.toolReads = null;
  assert.equal(scoreCell(unknown, []).referencesRead, null);
});

test("meanOrNull skips nulls", () => {
  assert.equal(meanOrNull([1, 0, null]), 0.5);
  assert.equal(meanOrNull([null, null]), null);
});
