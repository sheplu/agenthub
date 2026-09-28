import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { TranscriptInfo } from "../types.ts";
import { probeVersion, type BuildCommandOptions, type HarnessAdapter, type HarnessCommand } from "./types.ts";

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
 * `--dir` pins the session to the sandbox: opencode resolves its project
 * directory on its own, and a real 1.18.31 run with only cwd set reviewed
 * the host repository instead (wrong tree, sandbox opencode.json never
 * applied) while still exiting 0 — silently invalid results.
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
    return probeVersion("opencode");
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
    // --dir, not just cwd: see the adapter notes above.
    const argv = ["opencode", "run", "--format", "json", "--auto", "--dir", opts.sandboxDir];
    if (opts.model !== null) argv.push("-m", opts.model);
    argv.push(opts.promptText);
    return { argv, cwd: opts.sandboxDir };
  },

  parseTranscript(stdout: string): TranscriptInfo {
    // Text parts keyed by part id (a re-emitted part replaces its earlier
    // text instead of duplicating it); finalText is the last message's text.
    const textParts = new Map<string, { messageId: string; text: string }>();
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
        const partId = typeof part["id"] === "string" ? part["id"] : `?${textParts.size}`;
        textParts.set(partId, { messageId, text: part["text"] });
        lastMessageId = messageId;
      } else if (event["type"] === "step_start") {
        steps += 1;
      } else if (event["type"] === "step_finish") {
        if (typeof part["cost"] === "number") costUsd = (costUsd ?? 0) + part["cost"];
      } else if (event["type"] === "tool_use" || event["type"] === "tool") {
        sawToolInfo = true;
        const state = (part["state"] ?? {}) as Record<string, unknown>;
        const input = (state["input"] ?? {}) as Record<string, unknown>;
        // Path-like inputs only — a grep/glob *pattern* mentioning
        // "skill/references/" is not evidence that a reference file was read.
        for (const key of ["filePath", "file_path", "path"]) {
          if (typeof input[key] === "string") toolReads.push(input[key]);
        }
      }
    }

    const finalText =
      lastMessageId === null
        ? ""
        : [...textParts.values()]
            .filter((entry) => entry.messageId === lastMessageId)
            .map((entry) => entry.text)
            .join("\n");
    return {
      finalText,
      turns: steps > 0 ? steps : null,
      costUsd,
      modelUsed: null,
      toolReads: sawToolInfo ? toolReads : null,
    };
  },
};
