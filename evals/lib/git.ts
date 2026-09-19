import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface SkillVersion {
  /** Last commit touching the skill directory — the skill's "version". */
  sha: string | null;
  /** Uncommitted changes under the skill directory. */
  dirty: boolean;
  repoHead: string | null;
}

async function git(repoRoot: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", repoRoot, ...args]);
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Skill versions are implicit (no frontmatter version field): the identity
 * of what was benchmarked is the last commit touching skills/<name>/ plus a
 * dirty flag — recorded in every run's meta.json.
 */
export async function skillVersion(repoRoot: string, skillRelDir: string): Promise<SkillVersion> {
  const [sha, status, repoHead] = await Promise.all([
    git(repoRoot, ["log", "-1", "--format=%H", "--", skillRelDir]),
    git(repoRoot, ["status", "--porcelain", "--", skillRelDir]),
    git(repoRoot, ["rev-parse", "HEAD"]),
  ]);
  return {
    sha: sha || null,
    dirty: status !== null && status.length > 0,
    repoHead: repoHead || null,
  };
}
