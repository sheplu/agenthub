import assert from "node:assert/strict";
import { test } from "node:test";
import { cellId } from "../runner.ts";
import type { CellSpec } from "../types.ts";

const spec = (model: string | null): CellSpec => ({ suite: "s", harness: "oc", model, fixture: "f", runIndex: 0 });

test("cellIds are collision-free across lookalike model strings", () => {
  // Sanitizing alone is not injective — the raw model string must be
  // recoverably distinguishable, or persisted cells overwrite each other.
  assert.notEqual(cellId(spec("vendor/model")), cellId(spec("vendor-model")));
  assert.notEqual(cellId(spec("a:b")), cellId(spec("a_b")));
  assert.notEqual(cellId(spec("a b")), cellId(spec("a-b")));
});

test("cellIds are stable for the same model string", () => {
  assert.equal(cellId(spec("vendor/model")), cellId(spec("vendor/model")));
  assert.equal(cellId(spec("a:b")), cellId(spec("a:b")));
});

test("default-model cellIds keep the historical shape", () => {
  assert.equal(
    cellId({ suite: "s", harness: "mock", model: null, fixture: "compliant", runIndex: 1 }),
    "mock__default__compliant__r1",
  );
});
