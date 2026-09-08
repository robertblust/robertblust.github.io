// The renderers are pure functions of the artifact, so they are tested on a fixture rather
// than on the real model: a test that reads model.json would pass for the wrong reason the
// day the model changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeBlock } from "./block.mjs";

const FIXTURE = {
  commit: "0".repeat(40),
  repo: "example/model",
  root: "Someone",
  rootId: "identity",
  types: [],
  entities: [],
  edges: [],
};

function scratch(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-render-"));
  fs.mkdirSync(path.join(dir, "model"), { recursive: true });
  fs.mkdirSync(path.join(dir, "timeline"), { recursive: true });
  for (const p of ["model", "timeline"]) fs.writeFileSync(path.join(dir, p, "index.html"), body);
  return dir;
}

const EMPTY = `<p>before</p>
<!-- model data · none -->
<script type="application/json" id="model-data" data-stage></script>
<!-- /model data -->
<p>after</p>
`;

test("writeBlock fills an empty block and leaves the rest of the page alone", () => {
  const dir = scratch(EMPTY);
  const stale = writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(stale, []);
  const page = fs.readFileSync(path.join(dir, "model", "index.html"), "utf8");
  assert.match(page, /<!-- model data · 0{40} -->/);
  assert.ok(page.includes(JSON.stringify(FIXTURE)));
  assert.ok(page.startsWith("<p>before</p>"));
  assert.ok(page.trimEnd().endsWith("<p>after</p>"));
});

test("writeBlock in check mode names every page that drifted", () => {
  const dir = scratch(EMPTY);
  const stale = writeBlock(FIXTURE, { check: true, root: dir });
  assert.deepEqual(stale.sort(), ["model/index.html", "timeline/index.html"]);
});

test("writeBlock reports nothing once the pages are written", () => {
  const dir = scratch(EMPTY);
  writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }), []);
});
