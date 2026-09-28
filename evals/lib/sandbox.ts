import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface Sandbox {
  /** Sandbox root: contains skill/ (skill copy) and workspace/ (fixture copy). */
  dir: string;
  cleanup(): Promise<void>;
}

/**
 * Builds an isolated working directory for one cell. The agent gets a copy
 * of the skill and of the fixture, so runs can't contaminate each other or
 * the repo, and adapters can drop per-harness config (e.g. opencode.json)
 * without side effects.
 */
export async function createSandbox(opts: {
  skillDir: string;
  fixtureDir: string;
  keep?: boolean;
}): Promise<Sandbox> {
  const dir = await mkdtemp(join(tmpdir(), "agenthub-bench-"));
  await cp(opts.skillDir, join(dir, "skill"), { recursive: true });
  await cp(opts.fixtureDir, join(dir, "workspace"), { recursive: true });
  return {
    dir,
    cleanup: async () => {
      if (!opts.keep) await rm(dir, { recursive: true, force: true });
    },
  };
}
