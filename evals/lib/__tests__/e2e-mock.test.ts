import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { CellResult, RunMeta } from "../types.ts";

const execFileAsync = promisify(execFile);

const evalsRoot = join(import.meta.dirname, "..", "..");
const benchScript = join(evalsRoot, "bench.ts");
const mockDir = join(import.meta.dirname, "testdata", "mock");

/**
 * Full pipeline through the mock harness: run → sandbox → spawn → capture →
 * parse → score → report, at zero cost. Uses the real quality-gates suite
 * fixtures with canned transcripts covering the interesting outcomes.
 */
test("bench run with the mock harness produces scored cells and a report", async () => {
  const resultsDir = await mkdtemp(join(tmpdir(), "agenthub-bench-test-"));
  try {
    const fixtures = "compliant,tag-pinned-action,missing-cache,wrong-runner,coe-abuse,no-thresholds";
    await execFileAsync(process.execPath, [
      benchScript,
      "run",
      "--harness",
      "mock",
      "--mock-dir",
      mockDir,
      "--fixture",
      fixtures,
      "--results-dir",
      resultsDir,
    ]);

    const report = await readFile(join(resultsDir, "report.md"), "utf8");
    assert.ok(report.includes("| mock |"), "matrix row for the mock harness");
    assert.ok(report.includes("1.00/1.00"), "compliant cell scores perfectly");
    assert.ok(report.includes("0.50"), "partial scores rendered");
    assert.ok(report.includes("⚠CV"), "contract violation surfaced");
    assert.ok(report.includes("ERROR"), "failing harness surfaced");
    assert.ok(report.includes("Phantom findings"), "phantom section rendered");

    const cellFiles = (await readdir(join(resultsDir, "cells"))).filter((name) => name.endsWith(".json"));
    assert.equal(cellFiles.length, 6);
    const byFixture = new Map<string, CellResult>();
    for (const file of cellFiles) {
      const cell = JSON.parse(await readFile(join(resultsDir, "cells", file), "utf8")) as CellResult;
      byFixture.set(cell.spec.fixture, cell);
    }
    assert.equal(byFixture.get("compliant")?.status, "ok");
    assert.equal(byFixture.get("no-thresholds")?.status, "error");
    assert.equal(byFixture.get("compliant")?.transcript?.finalText.trim().endsWith("NO DEVIATIONS"), true);

    const meta = JSON.parse(await readFile(join(resultsDir, "meta.json"), "utf8")) as RunMeta;
    assert.equal(meta.suite, "quality-gates");
    assert.equal(meta.skill.name, "quality-gates");
    assert.ok(meta.skill.sha, "skill version SHA recorded");

    // score command re-renders the same results directory
    const { stdout } = await execFileAsync(process.execPath, [benchScript, "score", resultsDir]);
    assert.ok(stdout.includes("| mock |"));
  } finally {
    await rm(resultsDir, { recursive: true, force: true });
  }
});

test("missing harness binaries are skipped gracefully", async () => {
  const resultsDir = await mkdtemp(join(tmpdir(), "agenthub-bench-test-"));
  // A bin dir containing ONLY node: dirname(process.execPath) must not be on
  // PATH — npm-global shims like `claude` live right next to node, and this
  // test must never be able to spawn a real (paid) harness.
  const binDir = await mkdtemp(join(tmpdir(), "agenthub-bench-bin-"));
  await symlink(process.execPath, join(binDir, "node"));
  try {
    const path = `${binDir}:/usr/bin:/bin`;
    await execFileAsync(
      process.execPath,
      [
        benchScript,
        "run",
        "--harness",
        "claude,mock",
        "--mock-dir",
        mockDir,
        "--fixture",
        "compliant",
        "--results-dir",
        resultsDir,
      ],
      { env: { ...process.env, PATH: path } },
    );
    const meta = JSON.parse(await readFile(join(resultsDir, "meta.json"), "utf8")) as RunMeta;
    assert.deepEqual(meta.skippedHarnesses, ["claude"]);
    const cellFiles = (await readdir(join(resultsDir, "cells"))).filter((name) => name.endsWith(".json"));
    assert.equal(cellFiles.length, 1, "only the mock cell ran");
  } finally {
    await rm(resultsDir, { recursive: true, force: true });
    await rm(binDir, { recursive: true, force: true });
  }
});

test("dry-run prints the expanded matrix without spawning anything", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    benchScript,
    "run",
    "--harness",
    "mock",
    "--mock-dir",
    mockDir,
    "--runs",
    "2",
    "--dry-run",
  ]);
  assert.ok(stdout.includes("18 cell(s)"), `9 fixtures x 2 runs, got: ${stdout.split("\n")[0]}`);
  assert.ok(stdout.includes("mock__default__compliant__r1"));
});
