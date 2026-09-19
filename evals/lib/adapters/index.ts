import type { HarnessAdapter } from "./types.ts";
import { claudeAdapter } from "./claude.ts";
import { opencodeAdapter } from "./opencode.ts";
import { vibeAdapter } from "./vibe.ts";
import { createMockAdapter } from "./mock.ts";

/** Build the adapter registry. mockDir enables the mock harness. */
export function getAdapters(options: { mockDir?: string | null } = {}): Map<string, HarnessAdapter> {
  const adapters = new Map<string, HarnessAdapter>();
  for (const adapter of [claudeAdapter, opencodeAdapter, vibeAdapter]) {
    adapters.set(adapter.name, adapter);
  }
  if (options.mockDir) {
    adapters.set("mock", createMockAdapter(options.mockDir));
  }
  return adapters;
}
