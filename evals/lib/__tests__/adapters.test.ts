import assert from "node:assert/strict";
import { test } from "node:test";
import { opencodeAdapter } from "../adapters/opencode.ts";
import { vibeAdapter } from "../adapters/vibe.ts";
import type { BuildCommandOptions } from "../adapters/types.ts";

const commandOpts: BuildCommandOptions = {
  sandboxDir: "/tmp/sbx",
  fixture: "compliant",
  promptText: "review",
  model: null,
  maxTurns: 5,
  maxPriceUsd: 1,
};

test("opencode is pinned to the sandbox via --dir (cwd alone is not honored)", () => {
  const { argv, cwd } = opencodeAdapter.buildCommand(commandOpts);
  const dirIndex = argv.indexOf("--dir");
  assert.notEqual(dirIndex, -1, "--dir flag present");
  assert.equal(argv[dirIndex + 1], "/tmp/sbx");
  assert.equal(cwd, "/tmp/sbx");
});

test("opencode parseTranscript: search patterns are not reference reads", () => {
  const ndjson = [
    JSON.stringify({
      type: "tool_use",
      part: {
        type: "tool",
        tool: "grep",
        state: { status: "completed", input: { pattern: "skill/references/", path: "workspace" } },
      },
    }),
    JSON.stringify({
      type: "tool_use",
      part: {
        type: "tool",
        tool: "read",
        state: { status: "completed", input: { filePath: "/tmp/sbx/skill/references/conventions.md" } },
      },
    }),
  ].join("\n");
  const { toolReads } = opencodeAdapter.parseTranscript(ndjson);
  assert.ok(toolReads, "tool calls were seen");
  assert.ok(!toolReads.includes("skill/references/"), "grep pattern not counted as a read");
  assert.deepEqual(toolReads, ["workspace", "/tmp/sbx/skill/references/conventions.md"]);
});

test("vibe parseTranscript: search patterns are not reference reads", () => {
  const entries = JSON.stringify([
    { type: "effect", detail: { toolName: "grep", input: { pattern: "skill/references/", path: "workspace" } } },
    { type: "effect", detail: { toolName: "read", input: { filePath: "/tmp/sbx/skill/references/conventions.md" } } },
  ]);
  const { toolReads } = vibeAdapter.parseTranscript(entries);
  assert.ok(toolReads, "tool calls were seen");
  assert.ok(!toolReads.includes("skill/references/"), "grep pattern not counted as a read");
  assert.deepEqual(toolReads, ["workspace", "/tmp/sbx/skill/references/conventions.md"]);
});
