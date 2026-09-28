import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ExpectedMap, SuiteConfig } from "./types.ts";

export interface LoadedSuite {
  config: SuiteConfig;
  expected: ExpectedMap;
  /** Fixture names (subdirectories of fixturesDir), sorted. */
  fixtures: string[];
  promptText: string;
  suiteDir: string;
}

function fail(suite: string, message: string): never {
  throw new Error(`suite '${suite}': ${message}`);
}

/** Loads and validates evals/suites/<name>/ (suite.json, expected.json, prompt, fixtures). */
export async function loadSuite(suitesRoot: string, name: string): Promise<LoadedSuite> {
  const suiteDir = join(suitesRoot, name);
  let raw: string;
  try {
    raw = await readFile(join(suiteDir, "suite.json"), "utf8");
  } catch {
    fail(name, `no suite.json found under ${suiteDir}`);
  }
  const parsed = JSON.parse(raw) as Partial<SuiteConfig>;

  for (const key of ["name", "skill", "prompt", "expected", "fixturesDir"] as const) {
    if (typeof parsed[key] !== "string" || parsed[key] === "") fail(name, `suite.json is missing "${key}"`);
  }
  if (parsed.name !== name) fail(name, `suite.json name "${parsed.name}" does not match directory`);
  if (!Array.isArray(parsed.harnesses) || parsed.harnesses.length === 0) {
    fail(name, 'suite.json needs a non-empty "harnesses" array');
  }

  const config: SuiteConfig = {
    name: parsed.name,
    skill: parsed.skill as string,
    prompt: parsed.prompt as string,
    expected: parsed.expected as string,
    fixturesDir: parsed.fixturesDir as string,
    harnesses: parsed.harnesses,
    models: parsed.models ?? {},
    regressionRuns: parsed.regressionRuns ?? 5,
    timeoutSeconds: parsed.timeoutSeconds ?? 300,
    maxTurns: parsed.maxTurns ?? 30,
    maxPriceUsd: parsed.maxPriceUsd ?? 1,
  };

  const expected = JSON.parse(await readFile(join(suiteDir, config.expected), "utf8")) as ExpectedMap;
  for (const [fixture, findings] of Object.entries(expected)) {
    if (!Array.isArray(findings)) fail(name, `expected["${fixture}"] must be an array`);
    for (const finding of findings) {
      if (typeof finding.key !== "string" || !Array.isArray(finding.patterns) || finding.patterns.length === 0) {
        fail(name, `expected["${fixture}"] has an entry without key/patterns`);
      }
      for (const pattern of finding.patterns) {
        try {
          new RegExp(pattern, "i");
        } catch {
          fail(name, `expected["${fixture}"].${finding.key}: invalid regex ${JSON.stringify(pattern)}`);
        }
      }
    }
  }

  const fixtureEntries = await readdir(join(suiteDir, config.fixturesDir), { withFileTypes: true });
  const fixtures = fixtureEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (fixtures.length === 0) fail(name, `no fixtures under ${config.fixturesDir}`);

  for (const fixture of fixtures) {
    if (!(fixture in expected)) fail(name, `fixture "${fixture}" has no entry in ${config.expected}`);
  }
  for (const fixture of Object.keys(expected)) {
    if (!fixtures.includes(fixture)) fail(name, `${config.expected} lists unknown fixture "${fixture}"`);
  }

  const promptText = await readFile(join(suiteDir, config.prompt), "utf8");
  return { config, expected, fixtures, promptText, suiteDir };
}

/** Lists suite names (subdirectories of evals/suites/ containing suite.json). */
export async function listSuites(suitesRoot: string): Promise<string[]> {
  const entries = await readdir(suitesRoot, { withFileTypes: true });
  const names: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      await readFile(join(suitesRoot, entry.name, "suite.json"), "utf8");
      names.push(entry.name);
    } catch {
      // not a suite
    }
  }
  return names.sort();
}
