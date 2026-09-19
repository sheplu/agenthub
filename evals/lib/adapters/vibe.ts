import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TranscriptInfo } from "../types.ts";
import type { BuildCommandOptions, HarnessAdapter, HarnessCommand } from "./types.ts";

const execFileAsync = promisify(execFile);

/**
 * vibe adapter.
 *
 * Programmatic mode supports every guardrail natively: `--max-turns`,
 * `--max-price`, and `--enabled-tools` (glob patterns; everything else is
 * disabled in -p mode). No model flag exists — vibe always runs its default
 * model, so any explicit model request is rejected.
 *
 * Transcript (`--output json`): one JSON array of entries. Relevant:
 *   {type:"message", role:"assistant", content:[{type:"text", text}]}
 *   {type:"effect", detail:{toolName, input:{filePath|path|pattern}}}
 */
export const vibeAdapter: HarnessAdapter = {
  name: "vibe",
  binary: "vibe",

  async version(): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync("vibe", ["--version"]);
      return stdout.trim() || null;
    } catch {
      return null;
    }
  },

  buildCommand(opts: BuildCommandOptions): HarnessCommand {
    if (opts.model !== null) {
      throw new Error("vibe has no model flag; only the 'default' model is supported");
    }
    const argv = [
      "vibe",
      "-p",
      opts.promptText,
      "--output",
      "json",
      "--auto-approve",
      "--max-turns",
      String(opts.maxTurns),
      "--max-price",
      String(opts.maxPriceUsd),
    ];
    for (const tool of ["read*", "grep*", "glob*", "search*", "ls*", "list*"]) {
      argv.push("--enabled-tools", tool);
    }
    return { argv, cwd: opts.sandboxDir };
  },

  parseTranscript(stdout: string): TranscriptInfo {
    let entries: unknown;
    try {
      entries = JSON.parse(stdout);
    } catch {
      return { finalText: "", turns: null, costUsd: null, modelUsed: null, toolReads: null };
    }
    if (!Array.isArray(entries)) {
      return { finalText: "", turns: null, costUsd: null, modelUsed: null, toolReads: null };
    }

    let finalText = "";
    let assistantTurns = 0;
    const toolReads: string[] = [];
    let sawToolInfo = false;

    const collectPaths = (value: unknown): void => {
      if (typeof value !== "object" || value === null) return;
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (typeof val === "string" && /^(file_?path|path|pattern|absolute_path)$/i.test(key)) {
          toolReads.push(val);
        } else if (typeof val === "object" && val !== null) {
          collectPaths(val);
        }
      }
    };

    for (const entry of entries as Record<string, unknown>[]) {
      const type = entry["type"];
      if (type === "message" && entry["role"] === "assistant") {
        assistantTurns += 1;
        const content = Array.isArray(entry["content"]) ? entry["content"] : [];
        const texts = (content as Record<string, unknown>[])
          .filter((block) => block["type"] === "text" && typeof block["text"] === "string")
          .map((block) => block["text"] as string);
        if (texts.length > 0) finalText = texts.join("\n");
      } else if (type === "effect" || (typeof type === "string" && /tool/.test(type))) {
        sawToolInfo = true;
        const detail = (entry["detail"] ?? {}) as Record<string, unknown>;
        collectPaths(detail["input"] ?? entry);
      }
    }

    return {
      finalText,
      turns: assistantTurns > 0 ? assistantTurns : null,
      costUsd: null,
      modelUsed: null,
      toolReads: sawToolInfo ? toolReads : null,
    };
  },
};
