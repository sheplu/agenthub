import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TranscriptInfo } from "../types.ts";
import type { BuildCommandOptions, HarnessAdapter, HarnessCommand } from "./types.ts";

const execFileAsync = promisify(execFile);

/**
 * Codex CLI adapter (OpenAI).
 *
 * `codex exec` reading the prompt from stdin (`-`), with `--json` for JSONL
 * events, `-s read-only` (native read-only sandbox — the tool restriction),
 * `--skip-git-repo-check` (the sandbox is not a git repo) and `--ephemeral`
 * (no session files persisted). No turn/price caps exist, so the runner's
 * wall-clock timeout is the only hard cap. `-m` supports the model axis.
 *
 * Transcript: JSONL. Relevant events:
 *   {type:"item.completed", item:{type:"agent_message", text}}
 *   {type:"item.completed", item:{type:"command_execution"|..., command|...}}
 *   {type:"turn.completed", usage:{input_tokens, output_tokens, ...}}
 */
export const codexAdapter: HarnessAdapter = {
  name: "codex",
  binary: "codex",

  async version(): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync("codex", ["--version"]);
      return stdout.trim() || null;
    } catch {
      return null;
    }
  },

  buildCommand(opts: BuildCommandOptions): HarnessCommand {
    const argv = [
      "codex",
      "exec",
      "--json",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--ephemeral",
      "--color",
      "never",
    ];
    if (opts.model !== null) argv.push("-m", opts.model);
    argv.push("-"); // read the prompt from stdin
    return { argv, cwd: opts.sandboxDir, stdin: opts.promptText };
  },

  parseTranscript(stdout: string): TranscriptInfo {
    let finalText = "";
    let turns = 0;
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

      if (event["type"] === "turn.completed") {
        turns += 1;
      } else if (event["type"] === "item.completed") {
        const item = (event["item"] ?? {}) as Record<string, unknown>;
        if (item["type"] === "agent_message" && typeof item["text"] === "string") {
          finalText = item["text"];
        } else if (item["type"] !== "agent_message" && item["type"] !== "reasoning") {
          // Tool-ish items: codex reads files through sandboxed shell
          // commands, so collect any path-like/command strings.
          sawToolInfo = true;
          for (const key of ["command", "path", "file_path", "pattern", "query"]) {
            if (typeof item[key] === "string") toolReads.push(item[key]);
          }
        }
      }
    }

    return {
      finalText,
      turns: turns > 0 ? turns : null,
      costUsd: null, // codex reports token usage, not dollars
      modelUsed: null,
      toolReads: sawToolInfo ? toolReads : null,
    };
  },
};
