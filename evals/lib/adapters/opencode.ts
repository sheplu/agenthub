import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { TranscriptInfo } from "../types.ts";
import type { BuildCommandOptions, HarnessAdapter, HarnessCommand } from "./types.ts";

const execFileAsync = promisify(execFile);

/**
 * opencode adapter.
 *
 * `opencode run` has no turn/price caps and no tool-restriction flag, so:
 * - prepare() drops an opencode.json into the sandbox denying edit/bash/
 *   webfetch (read tools stay available);
 * - `--auto` approves the rest so the non-interactive run never hangs on a
 *   permission prompt;
 * - the runner's wall-clock timeout is the only hard cap.
 *
 * Transcript: NDJSON events `{type, part}`. Relevant:
 *   {type:"text", part:{type:"text", text, messageID}}
 *   {type:"tool_use", part:{tool, state:{input:{filePath|path|pattern}}}}
 *   {type:"step_finish", part:{cost, tokens}}
 */
export const opencodeAdapter: HarnessAdapter = {
  name: "opencode",
  binary: "opencode",
  // Concurrent opencode instances fail with "database is locked".
  maxConcurrency: 1,

  async version(): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync("opencode", ["--version"]);
      return stdout.trim() || null;
    } catch {
      return null;
    }
  },

  async prepare(sandboxDir: string): Promise<void> {
    const config = {
      $schema: "https://opencode.ai/config.json",
      permission: {
        edit: "deny",
        bash: "deny",
        webfetch: "deny",
      },
    };
    await writeFile(join(sandboxDir, "opencode.json"), `${JSON.stringify(config, null, 2)}\n`);
  },

  buildCommand(opts: BuildCommandOptions): HarnessCommand {
    const argv = ["opencode", "run", "--format", "json", "--auto"];
    if (opts.model !== null) argv.push("-m", opts.model);
    argv.push(opts.promptText);
    return { argv, cwd: opts.sandboxDir };
  },

  parseTranscript(stdout: string): TranscriptInfo {
    // Text parts keyed by message, so finalText is the last message's text.
    const textByMessage = new Map<string, string[]>();
    let lastMessageId: string | null = null;
    let costUsd: number | null = null;
    let steps = 0;
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
      const part = (event["part"] ?? {}) as Record<string, unknown>;

      if (event["type"] === "text" && typeof part["text"] === "string") {
        const messageId = typeof part["messageID"] === "string" ? part["messageID"] : "?";
        const texts = textByMessage.get(messageId) ?? [];
        texts.push(part["text"]);
        textByMessage.set(messageId, texts);
        lastMessageId = messageId;
      } else if (event["type"] === "step_start") {
        steps += 1;
      } else if (event["type"] === "step_finish") {
        if (typeof part["cost"] === "number") costUsd = (costUsd ?? 0) + part["cost"];
      } else if (event["type"] === "tool_use" || event["type"] === "tool") {
        sawToolInfo = true;
        const state = (part["state"] ?? {}) as Record<string, unknown>;
        const input = (state["input"] ?? {}) as Record<string, unknown>;
        for (const key of ["filePath", "file_path", "path", "pattern"]) {
          if (typeof input[key] === "string") toolReads.push(input[key]);
        }
      }
    }

    const finalText = lastMessageId === null ? "" : (textByMessage.get(lastMessageId) ?? []).join("\n");
    return {
      finalText,
      turns: steps > 0 ? steps : null,
      costUsd,
      modelUsed: null,
      toolReads: sawToolInfo ? toolReads : null,
    };
  },
};
