import type { HarnessAdapter } from "./types.ts";
import { claudeAdapter } from "./claude.ts";
import { codexAdapter } from "./codex.ts";
import { opencodeAdapter } from "./opencode.ts";
import { vibeAdapter } from "./vibe.ts";
import { createMockAdapter } from "./mock.ts";

/**
 * Build the adapter registry. The mock adapter is always registered (its
 * parseTranscript needs no state); running it requires --mock-dir.
 */
export function getAdapters(options: { mockDir?: string | null } = {}): Map<string, HarnessAdapter> {
  const adapters = new Map<string, HarnessAdapter>();
  for (const adapter of [claudeAdapter, codexAdapter, opencodeAdapter, vibeAdapter]) {
    adapters.set(adapter.name, adapter);
  }
  adapters.set("mock", createMockAdapter(options.mockDir ?? null));
  return adapters;
}
