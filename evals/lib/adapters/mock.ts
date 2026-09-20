import { join } from "node:path";
import type { TranscriptInfo } from "../types.ts";
import type { BuildCommandOptions, HarnessAdapter, HarnessCommand } from "./types.ts";

/**
 * Mock harness: replays canned transcripts from a directory (`--mock-dir`),
 * one `<fixture>.txt` per fixture. Exercises the whole pipeline — spawn,
 * capture, parse, score, report — deterministically and at zero cost.
 *
 * Canned file format: optional directive lines first, then the final text.
 *   #EXIT: 1        simulate a failing harness process
 *   #TURNS: 3
 *   #COST: 0.012
 *   #MODEL: mock-1
 *   #READS: skill/references/conventions.md, workspace/...
 * A missing #READS means "transcript exposes no tool calls" (reported n/a).
 */
export function createMockAdapter(mockDir: string | null): HarnessAdapter {
  const replayScript = join(import.meta.dirname, "mock-replay.ts");

  return {
    name: "mock",
    binary: "node",

    async version(): Promise<string | null> {
      return `mock (${process.version})`;
    },

    buildCommand(opts: BuildCommandOptions): HarnessCommand {
      if (mockDir === null) {
        throw new Error("the mock harness needs --mock-dir <canned-transcripts-dir>");
      }
      const transcriptFile = join(mockDir, `${opts.fixture}.txt`);
      return {
        argv: ["node", replayScript, transcriptFile],
        cwd: opts.sandboxDir,
      };
    },

    parseTranscript(stdout: string): TranscriptInfo {
      let turns: number | null = null;
      let costUsd: number | null = null;
      let modelUsed: string | null = null;
      let toolReads: string[] | null = null;
      const textLines: string[] = [];

      for (const line of stdout.split("\n")) {
        const directive = line.match(/^#(EXIT|TURNS|COST|MODEL|READS):\s*(.*)$/);
        if (!directive) {
          textLines.push(line);
          continue;
        }
        const value = directive[2] ?? "";
        switch (directive[1]) {
          case "TURNS":
            turns = Number(value);
            break;
          case "COST":
            costUsd = Number(value);
            break;
          case "MODEL":
            modelUsed = value.trim() || null;
            break;
          case "READS":
            toolReads = value
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
            break;
        }
      }

      return { finalText: textLines.join("\n").trim(), turns, costUsd, modelUsed, toolReads };
    },
  };
}
