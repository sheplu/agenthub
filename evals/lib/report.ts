import { meanOrNull } from "./scorer.ts";
import type { CellScore, RunMeta } from "./types.ts";

/**
 * Renders the run as a markdown report: a harness(/model) x fixture matrix
 * of recall/precision, then a per-harness summary. Scores are aggregated
 * over repeated runs (mean; worst shown when runs > 1 diverge).
 */

function fmt(value: number | null): string {
  return value === null ? "—" : value.toFixed(2);
}

function groupKey(score: CellScore): string {
  return `${score.spec.harness}${score.spec.model ? `/${score.spec.model}` : ""}`;
}

function cellText(scores: CellScore[]): string {
  if (scores.length === 0) return "·";
  const failures = scores.filter((score) => score.status !== "ok");
  if (failures.length === scores.length) {
    return scores[0]?.status === "timeout" ? "TIMEOUT" : "ERROR";
  }
  const violations = scores.filter((score) => score.contractViolation).length;
  const recall = meanOrNull(scores.map((score) => score.recall));
  const precision = meanOrNull(scores.map((score) => score.precision));
  let text = `${fmt(recall)}/${fmt(precision)}`;
  if (scores.length > 1) {
    const worst = Math.min(...scores.map((score) => score.recall ?? 0));
    text += ` (worst R ${worst.toFixed(2)})`;
  }
  if (violations > 0) text += ` ⚠CV×${violations}`;
  return text;
}

export function renderReport(meta: RunMeta, scores: CellScore[], fixtures: string[]): string {
  const groups = [...new Set(scores.map(groupKey))].sort();
  const lines: string[] = [];

  lines.push(`# Benchmark report — suite \`${meta.suite}\``, "");
  lines.push(`- **Skill**: \`${meta.skill.name}\` @ \`${meta.skill.sha ?? "unknown"}\`${meta.skill.dirty ? " (dirty)" : ""}`);
  lines.push(`- **Started**: ${meta.startedAt} · node ${meta.node}`);
  for (const [harness, version] of Object.entries(meta.harnessVersions)) {
    lines.push(`- **${harness}**: ${version ?? "unknown version"}`);
  }
  if (meta.skippedHarnesses.length > 0) {
    lines.push(`- **Skipped** (binary not found): ${meta.skippedHarnesses.join(", ")}`);
  }
  lines.push("");

  lines.push("## Matrix — recall/precision", "");
  lines.push(`| harness | ${fixtures.join(" | ")} |`);
  lines.push(`| --- | ${fixtures.map(() => "---").join(" | ")} |`);
  for (const group of groups) {
    const row = fixtures.map((fixture) =>
      cellText(scores.filter((score) => groupKey(score) === group && score.spec.fixture === fixture)),
    );
    lines.push(`| ${group} | ${row.join(" | ")} |`);
  }
  lines.push("", "`R/P` per cell (mean over runs). `⚠CV` = output-contract violation.", "");

  lines.push("## Summary", "");
  lines.push("| harness | cells | mean recall | mean precision | contract viol. | refs read | mean turns | total cost | total time |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const group of groups) {
    const groupScores = scores.filter((score) => groupKey(score) === group);
    const detectable = groupScores.filter((score) => score.referencesRead !== null);
    const refsRead =
      detectable.length === 0
        ? "n/a"
        : `${Math.round((100 * detectable.filter((score) => score.referencesRead).length) / detectable.length)}%`;
    const cost = groupScores.reduce((sum, score) => sum + (score.costUsd ?? 0), 0);
    const costText = groupScores.some((score) => score.costUsd !== null) ? `$${cost.toFixed(2)}` : "n/a";
    const totalSeconds = groupScores.reduce((sum, score) => sum + score.durationMs, 0) / 1000;
    lines.push(
      `| ${group} | ${groupScores.length} | ${fmt(meanOrNull(groupScores.map((score) => score.recall)))} | ` +
        `${fmt(meanOrNull(groupScores.map((score) => score.precision)))} | ` +
        `${groupScores.filter((score) => score.contractViolation).length} | ${refsRead} | ` +
        `${fmt(meanOrNull(groupScores.map((score) => score.turns)))} | ${costText} | ${totalSeconds.toFixed(0)}s |`,
    );
  }
  lines.push("");

  const phantoms = scores.filter((score) => score.phantomLines.length > 0);
  if (phantoms.length > 0) {
    lines.push("## Phantom findings", "");
    for (const score of phantoms) {
      lines.push(`- \`${groupKey(score)}\` on \`${score.spec.fixture}\` (run ${score.spec.runIndex}):`);
      for (const line of score.phantomLines) lines.push(`  - ${line}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
