import assert from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { listSuites, loadSuite } from "../config.ts";

const suitesRoot = join(import.meta.dirname, "..", "..", "suites");

test("the quality-gates suite loads and is internally consistent", async () => {
  const suite = await loadSuite(suitesRoot, "quality-gates");
  assert.equal(suite.config.skill, "quality-gates");
  assert.equal(suite.fixtures.length, 9);
  assert.ok(suite.fixtures.includes("compliant"));
  assert.deepEqual(suite.expected["compliant"], []);
  assert.ok(suite.promptText.includes("DEVIATION:"));
  assert.ok(suite.promptText.includes("NO DEVIATIONS"));
  // every fixture has expectations and vice versa (loadSuite throws otherwise)
  assert.deepEqual(Object.keys(suite.expected).sort(), suite.fixtures);
});

test("unknown suites fail loudly", async () => {
  await assert.rejects(() => loadSuite(suitesRoot, "does-not-exist"), /no suite\.json/);
});

test("listSuites finds quality-gates", async () => {
  assert.ok((await listSuites(suitesRoot)).includes("quality-gates"));
});
