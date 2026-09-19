import type { TranscriptInfo } from "../types.ts";

export interface BuildCommandOptions {
  /** Sandbox root: contains skill/ and workspace/. Used as cwd. */
  sandboxDir: string;
  /** Fixture being exercised (mock adapter selects its canned file by it). */
  fixture: string;
  /** Full prompt text (the suite's prompt.md). */
  promptText: string;
  /** Model to request; null = harness default (pass no flag). */
  model: string | null;
  maxTurns: number;
  maxPriceUsd: number;
}

export interface HarnessCommand {
  argv: string[];
  cwd: string;
  env?: Record<string, string>;
  /** Text piped to the process's stdin (used to deliver the prompt). */
  stdin?: string;
}

/**
 * One adapter per harness CLI. Adapters own the flag vocabulary and the
 * transcript format; the runner owns spawning, timeouts, and persistence.
 */
export interface HarnessAdapter {
  name: string;
  /** Binary looked up on PATH for availability detection. */
  binary: string;
  /**
   * Max cells of this harness running at once (default: unlimited within
   * the global --concurrency). opencode needs 1: concurrent instances fight
   * over its SQLite database ("database is locked").
   */
  maxConcurrency?: number;
  /** Harness version string for provenance (null if undetectable). */
  version(): Promise<string | null>;
  /** Optional sandbox preparation (e.g. drop a permissions config file). */
  prepare?(sandboxDir: string): Promise<void>;
  buildCommand(opts: BuildCommandOptions): HarnessCommand;
  /** Best-effort parse: never throw — degrade fields to null instead. */
  parseTranscript(stdout: string): TranscriptInfo;
}
