import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HarnessAdapter } from "./adapters/types.ts";
import { createSandbox, type Sandbox } from "./sandbox.ts";
import { skillVersion } from "./git.ts";
import type { CellResult, CellSpec, CellStatus, RunMeta } from "./types.ts";
import type { LoadedSuite } from "./config.ts";

export interface RunOptions {
  suite: LoadedSuite;
  adapters: Map<string, HarnessAdapter>;
  /** Harnesses to exercise (already resolved from CLI/suite config). */
  harnesses: string[];
  /** CLI --model override for every harness; null = use suite config. */
  modelsOverride: string[] | null;
  /** Fixture filter; empty = all suite fixtures. */
  fixtures: string[];
  runs: number;
  concurrency: number;
  timeoutSeconds: number;
  maxTurns: number;
  maxPriceUsd: number;
  repoRoot: string;
  resultsDir: string;
  keepSandbox: boolean;
  log: (line: string) => void;
}

export function cellId(spec: CellSpec): string {
  const model = (spec.model ?? "default").replaceAll("/", "-").replaceAll(":", "_").replaceAll(/\s+/g, "-");
  return `${spec.harness}__${model}__${spec.fixture}__r${spec.runIndex}`;
}

export function expandCells(opts: RunOptions, available: Set<string>): CellSpec[] {
  const fixtures = opts.fixtures.length > 0 ? opts.fixtures : opts.suite.fixtures;
  const perHarness: CellSpec[][] = [];
  for (const harness of opts.harnesses) {
    if (!available.has(harness)) continue;
    let models = opts.modelsOverride ?? opts.suite.config.models[harness] ?? ["default"];
    if (opts.adapters.get(harness)?.supportsModelFlag === false) {
      const dropped = models.filter((model) => model !== "default");
      if (dropped.length > 0) {
        opts.log(`skipping model override for '${harness}' (no model flag): ${dropped.join(", ")}`);
      }
      models = models.includes("default") || opts.modelsOverride === null ? ["default"] : [];
    }
    const cells: CellSpec[] = [];
    for (const model of models) {
      for (const fixture of fixtures) {
        for (let runIndex = 0; runIndex < opts.runs; runIndex++) {
          cells.push({
            suite: opts.suite.config.name,
            harness,
            model: model === "default" ? null : model,
            fixture,
            runIndex,
          });
        }
      }
    }
    if (cells.length > 0) perHarness.push(cells);
  }
  // Interleave round-robin across harnesses: with a maxConcurrency-limited
  // harness (opencode), a harness-major order would park every pool lane on
  // its limiter while other harnesses still have runnable cells.
  const interleaved: CellSpec[] = [];
  for (let i = 0; perHarness.some((cells) => i < cells.length); i++) {
    for (const cells of perHarness) {
      const cell = cells[i];
      if (cell !== undefined) interleaved.push(cell);
    }
  }
  return interleaved;
}

async function binaryAvailable(binary: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = spawn("/bin/sh", ["-c", `command -v ${JSON.stringify(binary)}`], { stdio: "ignore" });
    probe.on("close", (code) => resolve(code === 0));
    probe.on("error", () => resolve(false));
  });
}

interface SpawnOutcome {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

function runProcess(
  argv: string[],
  opts: { cwd: string; env?: Record<string, string>; stdin?: string; timeoutMs: number },
): Promise<SpawnOutcome> {
  return new Promise((resolve) => {
    const [command, ...args] = argv;
    // detached: own process group, so a timeout can kill the harness AND
    // whatever subprocesses it spawned (shell tools, MCP servers).
    const child = spawn(command as string, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let timedOut = false;
    let settled = false;
    const settle = (exitCode: number | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString(), exitCode, timedOut });
    };
    const killGroup = (signal: NodeJS.Signals): void => {
      if (child.pid === undefined) return;
      try {
        process.kill(-child.pid, signal);
      } catch {
        child.kill(signal);
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup("SIGTERM");
      setTimeout(() => killGroup("SIGKILL"), 5000).unref();
    }, opts.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", () => settle(null));
    child.on("close", (code) => settle(code));
    // 'close' waits for the stdio pipes to drain; a surviving grandchild
    // holding them open would hang the cell forever. Fall back to 'exit'
    // plus a short drain grace period.
    child.on("exit", (code) => {
      setTimeout(() => settle(code), 2000).unref();
    });

    // EPIPE lands here when the process dies before consuming the prompt;
    // without a listener it would crash the whole run.
    child.stdin.on("error", () => {});
    if (opts.stdin !== undefined) child.stdin.write(opts.stdin);
    child.stdin.end();
  });
}

async function runCell(spec: CellSpec, opts: RunOptions): Promise<CellResult> {
  const adapter = opts.adapters.get(spec.harness) as HarnessAdapter;
  const id = cellId(spec);
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const rawOutputFile = join("cells", `${id}.out.txt`);
  let sandbox: Sandbox | null = null;

  try {
    // Inside the try: a sandbox failure (missing skill dir, fs error) must
    // mark this cell as error, not abort the whole matrix.
    sandbox = await createSandbox({
      skillDir: join(opts.repoRoot, "skills", opts.suite.config.skill),
      fixtureDir: join(opts.suite.suiteDir, opts.suite.config.fixturesDir, spec.fixture),
      keep: opts.keepSandbox,
    });
    await adapter.prepare?.(sandbox.dir);
    const command = adapter.buildCommand({
      sandboxDir: sandbox.dir,
      fixture: spec.fixture,
      promptText: opts.suite.promptText,
      model: spec.model,
      maxTurns: opts.maxTurns,
      maxPriceUsd: opts.maxPriceUsd,
    });

    const outcome = await runProcess(command.argv, {
      cwd: command.cwd,
      env: command.env,
      stdin: command.stdin,
      timeoutMs: opts.timeoutSeconds * 1000,
    });

    await writeFile(join(opts.resultsDir, rawOutputFile), outcome.stdout);
    if (outcome.stderr) {
      await writeFile(join(opts.resultsDir, "cells", `${id}.err.txt`), outcome.stderr);
    }

    const status: CellStatus = outcome.timedOut ? "timeout" : outcome.exitCode === 0 ? "ok" : "error";
    const transcript = outcome.stdout ? adapter.parseTranscript(outcome.stdout) : null;
    return {
      spec,
      status,
      startedAt,
      durationMs: Math.round(performance.now() - start),
      exitCode: outcome.exitCode,
      transcript,
      rawOutputFile,
      ...(status === "error" ? { error: (outcome.stderr || transcript?.finalText || "").slice(0, 500) } : {}),
    };
  } catch (cause) {
    return {
      spec,
      status: "error",
      startedAt,
      durationMs: Math.round(performance.now() - start),
      exitCode: null,
      transcript: null,
      rawOutputFile,
      error: cause instanceof Error ? cause.message : String(cause),
    };
  } finally {
    if (sandbox !== null) {
      await sandbox.cleanup();
      if (opts.keepSandbox) opts.log(`  sandbox kept: ${sandbox.dir} (${id})`);
    }
  }
}

async function pool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index] as T);
    }
  });
  await Promise.all(lanes);
  return results;
}

/** Semaphore for adapters that can't run concurrently (see maxConcurrency). */
class Limiter {
  private active = 0;
  private readonly queue: (() => void)[] = [];
  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) await new Promise<void>((release) => this.queue.push(release));
    this.active += 1;
    try {
      return await fn();
    } finally {
      this.active -= 1;
      this.queue.shift()?.();
    }
  }
}

export async function runMatrix(opts: RunOptions): Promise<{ cells: CellResult[]; meta: RunMeta }> {
  await mkdir(join(opts.resultsDir, "cells"), { recursive: true });

  const available = new Set<string>();
  const harnessVersions: Record<string, string | null> = {};
  const skippedHarnesses: string[] = [];
  for (const harness of opts.harnesses) {
    const adapter = opts.adapters.get(harness);
    if (!adapter) throw new Error(`unknown harness '${harness}' (known: ${[...opts.adapters.keys()].join(", ")})`);
    if (await binaryAvailable(adapter.binary)) {
      available.add(harness);
      harnessVersions[harness] = await adapter.version();
    } else {
      skippedHarnesses.push(harness);
      opts.log(`skipping harness '${harness}': binary '${adapter.binary}' not found on PATH`);
    }
  }

  const specs = expandCells(opts, available);
  const skill = await skillVersion(opts.repoRoot, `skills/${opts.suite.config.skill}`);
  const meta: RunMeta = {
    startedAt: new Date().toISOString(),
    suite: opts.suite.config.name,
    argv: process.argv.slice(2),
    node: process.version,
    skill: { name: opts.suite.config.skill, ...skill },
    harnessVersions,
    skippedHarnesses,
  };
  await writeFile(join(opts.resultsDir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);

  const limiters = new Map<string, Limiter>();
  for (const harness of available) {
    const max = opts.adapters.get(harness)?.maxConcurrency;
    if (max !== undefined) limiters.set(harness, new Limiter(max));
  }

  opts.log(`${specs.length} cell(s) across ${available.size} harness(es); concurrency ${opts.concurrency}`);
  let done = 0;
  const cells = await pool(specs, opts.concurrency, async (spec) => {
    const limiter = limiters.get(spec.harness);
    const result = limiter ? await limiter.run(() => runCell(spec, opts)) : await runCell(spec, opts);
    done += 1;
    opts.log(`[${done}/${specs.length}] ${cellId(spec)} → ${result.status} (${(result.durationMs / 1000).toFixed(1)}s)`);
    await writeFile(join(opts.resultsDir, "cells", `${cellId(spec)}.json`), `${JSON.stringify(result, null, 2)}\n`);
    return result;
  });

  return { cells, meta };
}
