/**
 * Replays a canned transcript file to stdout — the "agent process" of the
 * mock harness. Honors a `#EXIT: <code>` directive on the first line to
 * simulate harness failures. Zero cost, fully deterministic; used to test
 * the runner and scorer without spawning a real agent.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("usage: node mock-replay.ts <transcript-file>");
  process.exit(2);
}

const content = readFileSync(file, "utf8");
process.stdout.write(content);

const exitMatch = content.match(/^#EXIT:\s*(\d+)/);
process.exit(exitMatch ? Number(exitMatch[1]) : 0);
