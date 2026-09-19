import type { TranscriptInfo } from "../types.ts";
import { probeVersion, type BuildCommandOptions, type HarnessAdapter, type HarnessCommand } from "./types.ts";

/**
 * Claude Code adapter.
 *
 * Invocation: `claude -p` reading the prompt from stdin, with
 * `--output-format stream-json --verbose` so the transcript exposes tool
 * calls (needed for the reference-loading metric). Read-only tools via
 * `--allowedTools`; anything else is auto-denied in print mode.
 *
 * Transcript: NDJSON. Relevant lines:
 *   {type:"system",subtype:"init", model?}
 *   {type:"assistant", message:{model, content:[{type:"text"|"tool_use",...}]}}
 *   {type:"result", result, num_turns, total_cost_usd, is_error}
 */
export const claudeAdapter: HarnessAdapter = {
  name: "claude",
  binary: "claude",

  async version(): Promise<string | null> {
    return probeVersion("claude");
  },

  buildCommand(opts: BuildCommandOptions): HarnessCommand {
    const argv = [
      "claude",
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--max-turns",
      String(opts.maxTurns),
      "--allowedTools",
      "Read",
      "Glob",
      "Grep",
    ];
    if (opts.model !== null) argv.push("--model", opts.model);
    return { argv, cwd: opts.sandboxDir, stdin: opts.promptText };
  },

  parseTranscript(stdout: string): TranscriptInfo {
    let finalText = "";
    let turns: number | null = null;
    let costUsd: number | null = null;
    let modelUsed: string | null = null;
    const toolReads: string[] = [];
    let sawToolInfo = false;

    for (const line of stdout.split("\n")) {
      if (!line.trim()) continue;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(line) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (event["type"] === "result") {
        if (typeof event["result"] === "string") finalText = event["result"];
        if (typeof event["num_turns"] === "number") turns = event["num_turns"];
        if (typeof event["total_cost_usd"] === "number") costUsd = event["total_cost_usd"];
      } else if (event["type"] === "assistant") {
        sawToolInfo = true;
        const message = event["message"] as Record<string, unknown> | undefined;
        if (message && typeof message["model"] === "string" && !message["model"].startsWith("<")) {
          modelUsed = message["model"];
        }
        const content = Array.isArray(message?.["content"]) ? message["content"] : [];
        for (const block of content as Record<string, unknown>[]) {
          if (block["type"] !== "tool_use") continue;
          const input = (block["input"] ?? {}) as Record<string, unknown>;
          // Path-like inputs only — a Grep *pattern* mentioning "references/"
          // is not evidence that a reference file was read.
          for (const key of ["file_path", "path"]) {
            if (typeof input[key] === "string") toolReads.push(input[key]);
          }
        }
      }
    }

    return { finalText, turns, costUsd, modelUsed, toolReads: sawToolInfo ? toolReads : null };
  },
};
