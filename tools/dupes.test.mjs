// The duplication sweep has been wrong by construction three times, and each error read as a
// clean result rather than as a failure. These tests pin the one part that decides what the
// tool is even allowed to see: which lines belong to the package and must not be counted.
import test from "node:test";
import assert from "node:assert/strict";
import { deFence, OPEN, CLOSE } from "./dupes.mjs";

const RUNTIME = "  /* ─── deck runtime · v4 · shared ─────────────────";
const RUNTIME_END = "  /* ─── end deck runtime ──────────────────────── */";
const LANG = "  /* ─── language · v2 · deck ───────────────────────";
const LANG_END = "  /* ─── end language ──────────────────────────── */";

test("a fence's markers and body are both blanked", () => {
  const out = deFence([RUNTIME, "generated();", RUNTIME_END, "mine();"]);
  assert.deepEqual(out, ["", "", "", "mine();"]);
});

test("a nested fence does not end the fence that contains it", () => {
  // The real shape in every deck: the language fence sits inside the deck runtime fence.
  // Treating the inner end marker as the outer one leaked 351 generated lines per deck into
  // the count, which put deck markup at the top of the consolidation list on a false number.
  const out = deFence([
    RUNTIME, "a();", LANG, "b();", LANG_END, "c();", RUNTIME_END, "mine();",
  ]);
  assert.deepEqual(out, ["", "", "", "", "", "", "", "mine();"],
    "everything up to and including the OUTER end marker belongs to the package");
});

test("text outside any fence survives", () => {
  const lines = ["one();", "two();"];
  assert.deepEqual(deFence(lines), lines);
});

test("the open marker requires a version, so prose about fences is not one", () => {
  assert.ok(OPEN.test(RUNTIME));
  assert.ok(!OPEN.test("  /* ─── the canvas ──────────────────────── */"),
    "unversioned section headings are the page's own, not the package's");
  assert.ok(!OPEN.test(RUNTIME_END), "an end marker must never open a fence");
  assert.ok(CLOSE.test(RUNTIME_END));
});

test("markers are recognised in HTML and JS comment syntax too", () => {
  const html = "<!-- ─── deck shell · v1 · shared ─────────────── -->";
  const htmlEnd = "<!-- ─── end deck shell ─────────────────────── -->";
  assert.deepEqual(deFence([html, "x();", htmlEnd, "mine();"]), ["", "", "", "mine();"]);
  assert.deepEqual(deFence(["// ─── theme · v3 · deck ───", "x();", "// ─── end theme ───", "mine();"]),
    ["", "", "", "mine();"]);
});
