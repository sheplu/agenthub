#!/usr/bin/env node
/**
 * Skill benchmarking CLI — see evals/README.md.
 *
 *   node evals/bench.ts run [--suite <name>] [--harness a,b] [--fixture x,y]
 *                           [--runs N | --regression] [--model m1,m2]
 *                           [--concurrency N] [--timeout SEC] [--max-turns N]
 *                           [--max-price USD] [--mock-dir DIR] [--keep-sandbox]
 *                           [--results-dir DIR] [--dry-run]
 *   node evals/bench.ts score <results-dir>
 *   node evals/bench.ts list
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { getAdapters } from "./lib/adapters/index.ts";
import { listSuites, loadSuite } from "./lib/config.ts";
import { renderReport } from "./lib/report.ts";
import { cellId, expandCells, runMatrix } from "./lib/runner.ts";
import { scoreCell } from "./lib/scorer.ts";
import type { CellResult, CellScore, RunMeta } from "./lib/types.ts";

const evalsRoot = import.meta.dirname;
const repoRoot = dirname(evalsRoot);
const suitesRoot = join(evalsRoot, "suites");

const { values: flags, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    suite: { type: "string", default: "quality-gates" },
    harness: { type: "string" },
    fixture: { type: "string" },
    model: { type: "string" },
    runs: { type: "string" },
    regression: { type: "boolean", default: false },
    concurrency: { type: "string", default: "4" },
    timeout: { type: "string" },
    "max-turns": { type: "string" },
    "max-price": { type: "string" },
    "results-dir": { type: "string" },
    "mock-dir": { type: "string" },
    "keep-sandbox": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

function csv(value: string | undefined): string[] {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function usage(): never {
  console.log("usage: bench <run|score|list> — see evals/README.md");
  process.exit(2);
}

function scoreAll(suiteExpected: Record<string, { key: string; patterns: string[] }[]>, cells: CellResult[]): CellScore[] {
  return cells.map((cell) => scoreCell(cell, suiteExpected[cell.spec.fixture] ?? []));
}

async function commandRun(): Promise<void> {
  const suite = await loadSuite(suitesRoot, flags.suite);
  const adapters = getAdapters({ mockDir: flags["mock-dir"] ? resolve(flags["mock-dir"]) : null });
  const harnesses = csv(flags.harness).length > 0 ? csv(flags.harness) : suite.config.harnesses;
  const runs = flags.regression ? suite.config.regressionRuns : Number(flags.runs ?? "1");
  if (!Number.isInteger(runs) || runs < 1) throw new Error(`invalid --runs: ${flags.runs}`);

  const resultsDir = resolve(
    flags["results-dir"] ?? join(evalsRoot, "results", new Date().toISOString().replaceAll(/[:.]/g, "-")),
  );

  const options = {
    suite,
    adapters,
    harnesses,
    modelsOverride: csv(flags.model).length > 0 ? csv(flags.model) : null,
    fixtures: csv(flags.fixture),
    runs,
    concurrency: Number(flags.concurrency),
    timeoutSeconds: Number(flags.timeout ?? suite.config.timeoutSeconds),
    maxTurns: Number(flags["max-turns"] ?? suite.config.maxTurns),
    maxPriceUsd: Number(flags["max-price"] ?? suite.config.maxPriceUsd),
    repoRoot,
    resultsDir,
    keepSandbox: flags["keep-sandbox"],
    log: (line: string) => console.error(line),
  };

  if (flags["dry-run"]) {
    const specs = expandCells(options, new Set(harnesses));
    console.log(`${specs.length} cell(s):`);
    for (const spec of specs) console.log(`  ${cellId(spec)}`);
    return;
  }

  const { cells, meta } = await runMatrix(options);
  const scores = scoreAll(suite.expected, cells);
  const report = renderReport(meta, scores, options.fixtures.length > 0 ? options.fixtures : suite.fixtures);
  await writeFile(join(resultsDir, "report.md"), `${report}\n`);
  console.log(report);
  console.error(`\nresults: ${resultsDir}`);
}

async function commandScore(): Promise<void> {
  const resultsDir = positionals[1];
  if (!resultsDir) usage();
  const meta = JSON.parse(await readFile(join(resultsDir, "meta.json"), "utf8")) as RunMeta;
  const suite = await loadSuite(suitesRoot, meta.suite);
  const adapters = getAdapters({ mockDir: "(score)" });
  const cellFiles = (await readdir(join(resultsDir, "cells"))).filter((name) => name.endsWith(".json"));
  const cells: CellResult[] = [];
  for (const file of cellFiles.sort()) {
    const cell = JSON.parse(await readFile(join(resultsDir, "cells", file), "utf8")) as CellResult;
    // Re-parse the raw transcript so scoring reflects the current adapters,
    // not the ones in effect when the run happened.
    const adapter = adapters.get(cell.spec.harness);
    if (adapter) {
      try {
        const raw = await readFile(join(resultsDir, cell.rawOutputFile), "utf8");
        if (raw) cell.transcript = adapter.parseTranscript(raw);
      } catch {
        // raw output missing — keep the transcript stored at run time
      }
    }
    cells.push(cell);
  }
  const scores = scoreAll(suite.expected, cells);
  const fixtures = [...new Set(cells.map((cell) => cell.spec.fixture))].sort();
  const report = renderReport(meta, scores, fixtures);
  await writeFile(join(resultsDir, "report.md"), `${report}\n`);
  console.log(report);
}

async function commandList(): Promise<void> {
  const adapters = getAdapters({ mockDir: "(any)" });
  console.log("harnesses:");
  for (const adapter of adapters.values()) {
    const version = await adapter.version();
    console.log(`  ${adapter.name}: ${version ?? "NOT AVAILABLE"}`);
  }
  console.log("\nsuites:");
  for (const name of await listSuites(suitesRoot)) {
    const suite = await loadSuite(suitesRoot, name);
    console.log(`  ${name} (skill: ${suite.config.skill}, ${suite.fixtures.length} fixtures)`);
    console.log(`    fixtures: ${suite.fixtures.join(", ")}`);
  }
}

async function main(): Promise<void> {
  if (flags.help) usage();
  await mkdir(suitesRoot, { recursive: true });
  switch (positionals[0]) {
    case "run":
      return commandRun();
    case "score":
      return commandScore();
    case "list":
      return commandList();
    default:
      usage();
  }
}

main().catch((cause: unknown) => {
  console.error(`bench: ${cause instanceof Error ? cause.message : String(cause)}`);
  process.exit(1);
});
