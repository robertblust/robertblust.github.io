# One model, one artifact — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one parse of the pinned model the only parse, written to a committed
`model.json`, and render every derived page region as a pure function of that file.

**Architecture:** Two layers. `build/model.mjs` is alone in touching the network and the
parser: it resolves the pin, reads the model's files through `build/read.mjs`, parses them
with `parseInstance` and writes `model.json`. `build/pages.mjs` loads that file, refuses to
run if it names a commit other than the one `source.json` pins, and calls three renderers
that each write one kind of region and report which pages drifted.

**Tech Stack:** Node 22+ ESM, no framework. `companygraph-meta-model` v0.14.0 for the parser.
`node --test` for unit tests, matching `tools/dupes.test.mjs`. Playwright only in
`npm run verify`, which this plan does not change.

**Spec:** `docs/superpowers/specs/2026-09-08-one-model-artifact-design.md`

## Global constraints

- Branch is `one-model-artifact`, already created, spec already committed as `1d10cf6`.
- Node built-ins only in `build/pages.mjs` and the three renderers. They must run before
  `npm ci`, so no import may reach `node_modules`.
- `model.json` is committed, written with `JSON.stringify(data, null, 2)` and a trailing
  newline. The data block inside pages stays minified, `JSON.stringify(data)`.
- The data block's bytes must not change. `stage.js`, `card.js` and the timeline's reader are
  not touched.
- `GITHUB_TOKEN` is sent when present and never printed.
- Prose in Markdown follows `conventions/WRITING.md`: American English, spaced em-dash, no
  serial comma, sentence case headings. Run `sh conventions/conventions-check` before
  committing a Markdown change.
- Commit messages follow the git register in `conventions/WRITING.md`: subject under seventy
  characters, no type prefix, no trailing period, body of one to three paragraphs, a final
  line beginning `Verified:`, then the `Co-Authored-By` trailer.
- Do not merge. Open the pull request and stop.
- The local `~/git/robertblust/mental-model` checkout is at `dfcd34f` while `source.json` pins
  `66cd79d`, so `MENTAL_MODEL` will correctly refuse. `npm run model` needs the network.

## File structure

```
build/read.mjs        new      pin → Map(path → text). The only network or checkout access.
build/model.mjs       rewrite  read.mjs + parseInstance → model.json. Needs npm ci.
build/pages.mjs       new      loads model.json, guards the pin, runs the renderers.
build/block.mjs       new      renderer: the data block in model/ and timeline/.
build/principles.mjs  rewrite  renderer: vision and values as HTML. Loses its fetcher and parser.
build/jsonld.mjs      new      renderer: the three invariant nodes, nine pages.
build/sameas.mjs      delete   absorbed by jsonld.mjs.
build/renderers.test.mjs new   unit tests for the three renderers on fixtures.
model.json            new      the artifact, committed.
package.json          modify   scripts: pages, pages:check, test:build; remove principles, sameas.
.github/workflows/ci.yml modify  three model steps become two.
AGENTS.md             modify   the "Two pages carry one data block" section.
README.md             modify   the commands block.
verify/check.mjs      modify   one stale comment at line 128.
```

## Measured facts this plan relies on

All counted on 2026-09-08 and reproducible with the commands in each task.

| Fact | Value |
|---|---|
| The data block | 299,759 bytes, identical in `model/index.html` and `timeline/index.html` |
| `model.json` pretty-printed | 375,437 bytes |
| Vision and values reproduce the principles page | all 25 generated lines appear verbatim |
| Invariant JSON-LD nodes | `@graph[0..2]`, leading and contiguous on all nine pages |
| Page-specific nodes | `@graph[3..]` round-trip exactly through `JSON.stringify(node, null, 2)` |
| The only hand-formatting in the block | inline `{ "@id": … }` in the `Dataset` node, which is rewritten |

---

### Task 1: One reader, one parse, one artifact

Writes `model.json` and changes no page. The data block stays where it is, so nothing can
regress yet — this task is proved by showing the artifact reproduces the block exactly.

**Files:**
- Create: `build/read.mjs`
- Modify: `build/model.mjs` (replace its fetching and its page writing)
- Create: `model.json` (generated, committed)
- Modify: `package.json:15-19`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `readInstance({ repo, commit, sub }) => Promise<Map<string, string>>` from
  `build/read.mjs`. `model.json`, an object with keys `commit`, `root`, `rootId`, `types`,
  `entities`, `edges`, `repo` — the value every later task loads.

- [ ] **Step 1: Write `build/read.mjs`**

```js
// The one way this repository reads the model it pins. Both the artifact and, before this
// existed, the principles page needed the same thing — one commit's worth of files — and each
// had its own copy of how to get them, on a different GitHub endpoint. A second copy is a
// second thing to keep true, and no check held the two together.
//
// A local checkout when MENTAL_MODEL points at one whose HEAD is the pinned commit, otherwise
// GitHub: one call to the git trees API for the listing, then the raw files. No tarball, so
// nothing to untar and no dependency. GITHUB_TOKEN is sent if present and never printed.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function readLocal(dir, commit, sub) {
  const head = execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== commit) {
    throw new Error(`MENTAL_MODEL is at ${head.slice(0, 7)}, source.json pins ${commit.slice(0, 7)}`);
  }
  const root = path.join(dir, sub);
  const files = new Map();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else files.set(path.relative(root, p).split(path.sep).join("/"), fs.readFileSync(p, "utf8"));
    }
  };
  walk(root);
  return files;
}

async function readRemote(repo, commit, sub) {
  const headers = { "user-agent": "blust.ch model build" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`, { headers });
  if (!res.ok) throw new Error(`trees API: HTTP ${res.status}`);
  const { tree, truncated } = await res.json();
  if (truncated) throw new Error("trees API truncated the listing");
  const files = new Map();
  for (const e of tree) {
    if (e.type !== "blob" || !e.path.startsWith(sub)) continue;
    const raw = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${e.path}`, { headers });
    if (!raw.ok) throw new Error(`${e.path}: HTTP ${raw.status}`);
    files.set(e.path.slice(sub.length), await raw.text());
  }
  return files;
}

export function readInstance({ repo, commit, sub }) {
  return process.env.MENTAL_MODEL
    ? Promise.resolve(readLocal(process.env.MENTAL_MODEL, commit, sub))
    : readRemote(repo, commit, sub);
}
```

- [ ] **Step 2: Rewrite `build/model.mjs` to write the artifact and nothing else**

```js
// Writes the pinned model into `model.json`, or checks that the file there is still what that
// commit parses to — `npm run model` and `npm run model:check`.
//
// This is the only script in the repository that reaches the network or the parser. Everything
// else on this site is rendered from the file it writes, which is why the pages can be checked
// before `npm ci` has run and without GitHub being reachable.
//
// Pretty-printed because the file is committed and the point of committing it is review: a
// re-pin then shows which experience gained a field and which tagline was reworded, rather than
// one changed line of 300KB. The pages inline it minified, so their bytes do not move.
//
// The parser comes from `companygraph-meta-model`, pinned by tag. It implements the
// CompanyGraph conventions and lives in the repository that defines them, so a rule and its
// implementation cannot drift apart unseen. If the model gains a type or a section shape, the
// fix belongs there and arrives here as a version bump.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseInstance } from "companygraph-meta-model/instance";
import { readInstance } from "./read.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const OUT = path.join(ROOT, "model.json");

// R13: an instance's content lives in one container, and `model/` is it. Everything outside —
// `meta/`, `.companygraph/`, the READMEs at the root — is machinery, not the company.
const SUB = "model/";

const files = await readInstance({ repo, commit, sub: SUB });
// `repo` travels with the data because the stage draws more than one repository's model and the
// file link has to point at the right one. `sub` is where these files sit in the model's own
// repository, and the parser needs it: an entity's `path` is what a page turns into a link to
// the file on GitHub.
const data = { ...parseInstance(files, { sub: SUB }), commit, repo };
const text = JSON.stringify(data, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.log(`  ✗ model.json is not what ${repo}@${commit.slice(0, 7)} parses to — run: npm run model`);
    process.exit(1);
  }
  console.log(`  ✓ model.json is ${repo}@${commit.slice(0, 7)}: ${data.entities.length} entities, ${data.edges.length} edges`);
} else {
  fs.writeFileSync(OUT, text);
  console.log(`  wrote model.json: ${data.entities.length} entities, ${data.edges.length} edges from ${repo}@${commit.slice(0, 7)}`);
}
```

- [ ] **Step 3: Point the scripts at it**

In `package.json`, leave `model` and `model:check` as they are — they already run
`build/model.mjs`. Nothing to change in this step; confirm with:

Run: `node -e 'const s=require("./package.json").scripts; console.log(s.model, "|", s["model:check"])'`
Expected: `node build/model.mjs | node build/model.mjs --check`

- [ ] **Step 4: Generate the artifact**

Run: `npm run model`
Expected: `wrote model.json: 123 entities, 517 edges from robertblust/mental-model@66cd79d`

This needs the network. If GitHub rate-limits, export `GITHUB_TOKEN` first; never echo it.

- [ ] **Step 5: Prove the artifact reproduces the block byte-for-byte**

This is the whole point of the task. The block currently in the pages was produced by the old
code path; the artifact must serialize to exactly the same bytes.

Run:
```bash
node --input-type=module -e '
import fs from "node:fs";
const data = JSON.parse(fs.readFileSync("model.json", "utf8"));
const mine = JSON.stringify(data);
for (const p of ["model/index.html", "timeline/index.html"]) {
  const onPage = fs.readFileSync(p, "utf8")
    .match(/id="model-data" data-stage>([\s\S]*?)<\/script>/)[1];
  console.log(`  ${p}: ${mine === onPage ? "identical" : "DIFFERS"} (${onPage.length} bytes)`);
}'
```
Expected: `identical (299759 bytes)` for both.

If either differs, stop. It means the parser or the pin moved, and no later task is safe.

- [ ] **Step 6: Confirm the check catches a broken artifact**

Run: `printf '{}\n' >> model.json && npm run model:check; echo "exit: $?"`
Expected: `✗ model.json is not what … parses to — run: npm run model`, exit 1

Run: `npm run model && npm run model:check`
Expected: `✓ model.json is robertblust/mental-model@66cd79d: 123 entities, 517 edges`

- [ ] **Step 7: Commit**

```bash
git add build/read.mjs build/model.mjs model.json
git commit -F - <<'MSG'
The parsed model is a file, not only a page

Two scripts read the pinned commit, on two different GitHub endpoints, each with its own
checkout branch and its own token handling, and no check held the two together. One of
them then wrote its result only into rendered HTML, which left the other reading a page
to get at data.

build/read.mjs is now the one way this repository reads the model, and build/model.mjs is
the only script that reaches either the network or the parser. What it writes is
model.json, committed and pretty-printed, because the reason to commit a generated file is
that a re-pin shows in review as the fields that moved rather than as one changed line of
300KB. The pages still carry the block minified and their bytes have not moved.

Verified: model.json serializes to the 299,759 bytes already in model/index.html and
timeline/index.html; npm run model:check passes and fails on a corrupted file.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 2: The renderer layer, and the data block through it

Introduces `pages.mjs`, the pin guard and the first renderer. Ends with the data block written
from `model.json` and a clean `git diff`.

**Files:**
- Create: `build/block.mjs`
- Create: `build/pages.mjs`
- Create: `build/renderers.test.mjs`
- Modify: `package.json` (add `pages`, `pages:check`, `test:build`)

**Interfaces:**
- Consumes: `model.json` from Task 1.
- Produces: `writeBlock(data, { check }) => string[]` from `build/block.mjs`, returning
  repository-relative paths that did not match. `build/pages.mjs` as the orchestrator every
  later renderer registers with.

- [ ] **Step 1: Write the failing test**

Create `build/renderers.test.mjs`:

```js
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

function scratch(name, body) {
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
  const dir = scratch("empty", EMPTY);
  const stale = writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(stale, []);
  const page = fs.readFileSync(path.join(dir, "model", "index.html"), "utf8");
  assert.match(page, /<!-- model data · 0{40} -->/);
  assert.ok(page.includes(JSON.stringify(FIXTURE)));
  assert.ok(page.startsWith("<p>before</p>"));
  assert.ok(page.trimEnd().endsWith("<p>after</p>"));
});

test("writeBlock in check mode names every page that drifted", () => {
  const dir = scratch("stale", EMPTY);
  const stale = writeBlock(FIXTURE, { check: true, root: dir });
  assert.deepEqual(stale.sort(), ["model/index.html", "timeline/index.html"]);
});

test("writeBlock reports nothing once the pages are written", () => {
  const dir = scratch("clean", EMPTY);
  writeBlock(FIXTURE, { check: false, root: dir });
  assert.deepEqual(writeBlock(FIXTURE, { check: true, root: dir }), []);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test build/renderers.test.mjs`
Expected: FAIL, `Cannot find module` for `./block.mjs`

- [ ] **Step 3: Write `build/block.mjs`**

```js
// The data block, written into the two pages that carry it. Fenced by markers naming the
// commit, the way the token block is fenced by its version: a reader of the HTML can see which
// state of the model the page shows, and the check can find the block without parsing the page.
//
// Two pages carry it and it is one block — the model page draws it, the timeline lists one type
// out of it. Written by one loop so they cannot show different states of the model, and checked
// by the same loop so a page edited by hand goes red for both.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "model data";
const ID = "model-data";
const START = new RegExp(`<!-- ${MARKER} · (?:[0-9a-f]+|none) -->\\n<script type="application\\/json" id="${ID}" data-stage>`);
const END = `</script>\n<!-- /${MARKER} -->`;

export function writeBlock(data, { check = false, root = HERE } = {}) {
  const block = `<!-- ${MARKER} · ${data.commit} -->\n<script type="application/json" id="${ID}" data-stage>${JSON.stringify(data)}${END}`;
  const stale = [];
  for (const dir of ["model", "timeline"]) {
    const rel = `${dir}/index.html`;
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const start = page.search(START), end = page.indexOf(END);
    if (start < 0 || end < 0) throw new Error(`${rel} has no data block markers`);
    if (page.slice(start, end + END.length) === block) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, page.slice(0, start) + block + page.slice(end + END.length));
  }
  return stale;
}
```

- [ ] **Step 4: Run the test and make sure it passes**

Run: `node --test build/renderers.test.mjs`
Expected: PASS, 3 tests

- [ ] **Step 5: Write `build/pages.mjs`**

```js
// Renders `model.json` into every region of this site derived from the model — `npm run pages`
// and `npm run pages:check`.
//
// Node built-ins only, and no network. That is the property worth keeping: the parser is a
// dependency and is not on disk until `npm ci` has run, so a check that needed it could not run
// in the cheap half of CI. Everything here is a pure function of one committed file.
//
// The pin guard is what used to be a sentence in AGENTS.md saying which command to run first.
// An artifact that declares its own commit cannot be rendered stale, so the order of `npm run
// model` and `npm run pages` is now enforced by the data rather than remembered by a person.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeBlock } from "./block.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { repo, commit } = JSON.parse(fs.readFileSync(path.join(ROOT, "source.json"), "utf8"));
const ARTIFACT = path.join(ROOT, "model.json");

if (!fs.existsSync(ARTIFACT)) {
  console.error("  ✗ model.json is missing — run: npm run model");
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(ARTIFACT, "utf8"));
if (data.commit !== commit) {
  console.error(`  ✗ model.json is at ${data.commit.slice(0, 7)}, source.json pins ${commit.slice(0, 7)} — run: npm run model`);
  process.exit(1);
}

const check = process.argv.includes("--check");
const RENDERERS = [writeBlock];

const stale = RENDERERS.flatMap((write) => write(data, { check }));

if (check) {
  if (stale.length) {
    console.error(`  ✗ ${stale.join(", ")} no longer match model.json — run: npm run pages`);
    process.exit(1);
  }
  console.log(`  ✓ every derived region matches model.json at ${repo}@${commit.slice(0, 7)}`);
} else {
  console.log(`  wrote every derived region from model.json at ${repo}@${commit.slice(0, 7)}`);
}
```

- [ ] **Step 6: Add the scripts**

In `package.json`, inside `scripts`, after the two `model` entries:

```json
    "pages": "node build/pages.mjs",
    "pages:check": "node build/pages.mjs --check",
    "test:build": "node --test build/renderers.test.mjs",
```

- [ ] **Step 7: Prove the data block is unchanged**

Run: `npm run pages && git diff --stat`
Expected: no output from `git diff --stat`. The block was already correct, so rendering it
again must change nothing.

Run: `npm run pages:check`
Expected: `✓ every derived region matches model.json at robertblust/mental-model@66cd79d`

- [ ] **Step 8: Prove the pin guard**

Run:
```bash
cp source.json source.json.bak
node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync("source.json","utf8"));s.commit="a".repeat(40);fs.writeFileSync("source.json",JSON.stringify(s)+"\n")'
npm run pages:check; echo "exit: $?"
mv source.json.bak source.json
```
Expected: `✗ model.json is at 66cd79d, source.json pins aaaaaaa — run: npm run model`, exit 1

Run: `git diff --stat` — expected: no output, the backup restored `source.json` exactly.

- [ ] **Step 9: Commit**

```bash
git add build/block.mjs build/pages.mjs build/renderers.test.mjs package.json
git commit -F - <<'MSG'
Pages are rendered from the artifact, not from the model

The data block was written by the same script that fetched and parsed the model, so
checking a page meant reaching GitHub and having the parser installed. That is why the
model page's check had to sit below npm ci while its siblings sat above it, and why the
order the three build scripts ran in was load-bearing.

build/pages.mjs now renders from model.json with node built-ins and no network, and it
refuses to run when the artifact names a commit other than the one source.json pins. That
guard is the ordering rule AGENTS.md used to state in prose: an artifact that declares its
own commit cannot be rendered stale. The data block is the first renderer to move across;
its bytes are unchanged.

Verified: node --test build/renderers.test.mjs passes 3 tests; npm run pages leaves git
diff empty; the guard fails as expected against a moved pin.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 3: The principles page loses its own parser

**Files:**
- Modify: `build/principles.mjs` (delete `parse()` and `readModel()`, keep the rendering)
- Modify: `build/pages.mjs` (register the renderer)
- Modify: `build/renderers.test.mjs` (add coverage)

**Interfaces:**
- Consumes: `writeBlock` pattern and the `pages.mjs` `RENDERERS` array from Task 2.
- Produces: `writePrinciples(data, { check, root }) => string[]`, same contract as `writeBlock`.

Background the implementer needs: `parseInstance` already yields the vision and every value as
entities carrying `name`, `tagline` and `sections[].text`. A section's text holds paragraphs
separated by a blank line, with hard-wrapped lines inside a paragraph. The old hand parser
joined a paragraph's lines with a space, so the replacement must do the same. This was
confirmed on 2026-09-08 to reproduce all 25 generated lines of the current page verbatim.

- [ ] **Step 1: Write the failing test**

Append to `build/renderers.test.mjs`:

```js
import { writePrinciples, paragraphs } from "./principles.mjs";

test("paragraphs splits on blank lines and unwraps each paragraph", () => {
  const text = "One line\nwrapped here.\n\nA second\nparagraph.";
  assert.deepEqual(paragraphs(text), ["One line wrapped here.", "A second paragraph."]);
});

test("paragraphs drops the empty trailing paragraph", () => {
  assert.deepEqual(paragraphs("Only this.\n\n"), ["Only this."]);
});

const PRINCIPLES_FIXTURE = {
  ...FIXTURE,
  entities: [
    { id: "vision", type: "vision", name: "One thing, everywhere",
      tagline: "A `tagline` with code.", path: "model/vision.md",
      sections: [{ heading: "What it means", text: "First para\nwrapped.\n\nSecond para." }] },
    { id: "values/b", type: "value", name: "Bee", tagline: "Bee tagline.",
      path: "model/values/b.md", sections: [{ heading: "In practice", text: "Bee body." }] },
    { id: "values/a", type: "value", name: "Ay", tagline: "Ay tagline.",
      path: "model/values/a.md", sections: [{ heading: "In practice", text: "Ay body." }] },
  ],
};

test("writePrinciples orders values by path, not by entity order", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-princ-"));
  fs.mkdirSync(path.join(dir, "principles"), { recursive: true });
  fs.writeFileSync(path.join(dir, "principles", "index.html"),
    "<div>\n    <!-- principles:start -->\n    old\n    <!-- principles:end -->\n</div>\n");
  writePrinciples(PRINCIPLES_FIXTURE, { check: false, root: dir });
  const page = fs.readFileSync(path.join(dir, "principles", "index.html"), "utf8");
  assert.ok(page.indexOf("Ay") < page.indexOf("Bee"), "a/ sorts before b/");
  assert.ok(page.includes('<code class="mono">tagline</code>'), "backticks become code");
  assert.ok(page.includes('<p class="lede">First para wrapped.</p>'));
  assert.ok(page.includes('<p class="lede">Second para.</p>'));
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test build/renderers.test.mjs`
Expected: FAIL, `writePrinciples is not exported` or a module resolution error

- [ ] **Step 3: Rewrite `build/principles.mjs`**

Delete `parse()` (lines 34-51), `readModel()` (lines 54-79), the `execFileSync` import and the
trailing write-or-check block. Keep `esc`, `inline`, `headline`, the two notes and the
provenance paragraph. Replace the file's header comment and its entry points with:

```js
// Renders the vision and the values into principles/index.html from the artifact.
//
// The page is derived, never written. That is the claim the vision itself makes: everything
// public about this work comes from one model, and when a surface disagrees the model is what
// gets corrected. A hand-copied page would be a surface free to drift, which is the failure this
// idea exists to prevent.
//
// Rendered to HTML rather than to a data block: a crawler and an assistant have to read this
// without running JS, which is the entire reason the page exists.
//
// It reads entities rather than Markdown. It used to carry its own parser for the vision and
// value files — eighteen lines that enforced none of the numbered rules and answered to no
// version — while the pinned parser was already producing the same fields for the same files.
// One reading of the model is the point of the artifact, and this was the second one.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const START = "<!-- principles:start -->";
const END = "<!-- principles:end -->";

// A section's text is one string: paragraphs separated by a blank line, hard-wrapped inside.
// The page wants one <p> per paragraph with the wrapping undone.
export function paragraphs(text) {
  return text.split(/\n\s*\n/).map((p) => p.split("\n").map((l) => l.trim()).join(" ").trim())
    .filter(Boolean);
}
```

Then replace `render(model)` so it takes the artifact, and add the exported writer:

```js
function render(data) {
  const v = data.entities.find((e) => e.type === "vision");
  if (!v) throw new Error("the model holds no vision entity");
  // Ordered by path, which is the file name, which is the order the folder listing gave before
  // the artifact existed. The page's order is therefore unchanged and stays a property of the
  // model rather than of this file.
  const values = data.entities.filter((e) => e.type === "value")
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const out = [];
  out.push(`    <div class="title">`);
  out.push(`      <h1>${headline(v.name)}</h1>`);
  out.push(`      <p class="tagline">${inline(v.tagline)}</p>`);
  out.push(`      <p class="note" data-de="${esc(NOTE_DE)}">${esc(NOTE_EN)}</p>`);
  out.push(`    </div>`);
  out.push(``);
  out.push(`    <section>`);
  out.push(`      <h2>${inline(v.sections[0].heading)}</h2>`);
  for (const p of paragraphs(v.sections[0].text)) out.push(`      <p class="lede">${inline(p)}</p>`);
  out.push(`    </section>`);
  out.push(``);
  out.push(`    <section>`);
  out.push(`      <h2 data-de="Werte">Values</h2>`);
  for (const x of values) {
    out.push(`      <article class="value">`);
    out.push(`        <h3>${inline(x.name)}</h3>`);
    out.push(`        <p class="tagline">${inline(x.tagline)}</p>`);
    for (const p of paragraphs(x.sections[0].text)) out.push(`        <p>${inline(p)}</p>`);
    out.push(`      </article>`);
  }
  out.push(`    </section>`);
  out.push(``);
  out.push(`    ${derived(data)}`);
  return out.join("\n");
}

export function writePrinciples(data, { check = false, root = HERE } = {}) {
  const rel = "principles/index.html";
  const file = path.join(root, rel);
  const page = fs.readFileSync(file, "utf8");
  const re = new RegExp(`${START}[\\s\\S]*?${END}`);
  if (!re.test(page)) throw new Error(`${rel} has no ${START} … ${END} block`);
  const next = page.replace(re, `${START}\n${render(data)}\n    ${END}`);
  if (next === page) return [];
  if (check) return [rel];
  fs.writeFileSync(file, next);
  return [];
}
```

Move the provenance paragraph into a `derived(data)` function that takes `data.repo` and
`data.commit` instead of the module-level `repo` and `commit` from `source.json`, so the
renderer reads only the artifact. Its body is unchanged otherwise, including the single-quote
convention inside `data-de` and the `escAttr` that does not run the German through `esc`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `node --test build/renderers.test.mjs`
Expected: PASS, 7 tests

- [ ] **Step 5: Register the renderer**

In `build/pages.mjs`, add the import and extend the array:

```js
import { writePrinciples } from "./principles.mjs";
const RENDERERS = [writeBlock, writePrinciples];
```

- [ ] **Step 6: Prove the principles page is byte-identical**

Run: `npm run pages && git diff --stat`
Expected: no output. This is the task's whole claim — the hand parser and the pinned parser
produce the same page.

If `git diff` shows changes to `principles/index.html`, read them before doing anything else.
A difference in a paragraph break means `paragraphs()` is wrong; a difference in order means
the sort is.

- [ ] **Step 7: Confirm the check catches a hand edit**

Run:
```bash
node -e 'const fs=require("fs");const p="principles/index.html";fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("<p class=\"lede\">","<p class=\"lede\">EDITED "))'
npm run pages:check; echo "exit: $?"
git checkout principles/index.html
```
Expected: `✗ principles/index.html no longer match model.json — run: npm run pages`, exit 1

- [ ] **Step 8: Commit**

```bash
git add build/principles.mjs build/pages.mjs build/renderers.test.mjs
git commit -F - <<'MSG'
The principles page reads entities, not Markdown

This page carried its own eighteen-line Markdown parser for the vision and the value files.
The pinned parser was already producing the same fields from the same files, enforcing the
numbered rules as it went, and failing its own repository's CI if it cited a rule the
conventions do not define. The copy here enforced none of them and answered to no version.

It now renders from the artifact like every other derived region, which removes the second
reading of the model and, with it, the second GitHub endpoint this repository called. The
page's own words — the heading over the values, the note about language, the provenance
line — stay here, because the model owns the statements and this owns the frame.

Verified: node --test build/renderers.test.mjs passes 7 tests; npm run pages leaves
principles/index.html byte-identical, so git diff is empty; pages:check goes red on a hand
edit.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 4: Invariant JSON-LD nodes come from one definition

The one task that changes published output. Everything else in this plan is proved by an empty
diff; this one is proved by a diff that contains exactly what the spec predicted and nothing
else.

**Files:**
- Create: `build/jsonld.mjs`
- Delete: `build/sameas.mjs`
- Modify: `build/pages.mjs`, `build/renderers.test.mjs`, `package.json`

**Interfaces:**
- Consumes: the `write(data, { check, root }) => string[]` contract from Tasks 2 and 3.
- Produces: `writeJsonLd(data, { check, root }) => string[]`, and `alsoAt(data) => string[]`
  for the person's addresses.

Background the implementer needs, all measured on 2026-09-08:

- The three invariant nodes are `@graph[0]`, `[1]` and `[2]` — `Person`, `Dataset`, `WebSite` —
  leading and contiguous on all nine pages that carry a graph.
- `@graph[3..]` — `WebPage` and `BreadcrumbList` — round-trip exactly through
  `JSON.stringify(node, null, 2)`, so re-emitting the whole document leaves them untouched.
- The only hand-formatting anywhere in the block is the inline `{ "@id": … }` in the `Dataset`
  node, which this task rewrites, so nothing else reformats.
- Key order matters, because the check compares bytes. `Person` is `@type, @id, name, url,
  jobTitle, sameAs, subjectOf`. `WebSite` is `@type, @id, name, url, inLanguage, publisher`.
- The nine pages: `index.html`, `ideas/`, `model/`, `principles/`, `privacy/`, `talks/`,
  `timeline/`, `talks/mental-model/`, `talks/essential-complexity/`.

- [ ] **Step 1: Write the failing test**

Append to `build/renderers.test.mjs`:

```js
import { writeJsonLd, alsoAt } from "./jsonld.mjs";

const PROFILE_FIXTURE = {
  ...FIXTURE,
  root: "Someone",
  rootId: "identity",
  entities: [
    { id: "identity", type: "identity", name: "Someone", tagline: "", sections: [] },
    { id: "profiles/someone", type: "profile", name: "Someone", tagline: "",
      sections: [{ heading: "Also at", tables: [
        { columns: ["What", "URL"], rows: [["GitHub", "https://example.com/a"], ["Elsewhere", "https://example.com/b"]] }] }] },
  ],
};

test("alsoAt takes the URL column of the root profile's Also at table", () => {
  assert.deepEqual(alsoAt(PROFILE_FIXTURE), ["https://example.com/a", "https://example.com/b"]);
});

test("alsoAt throws rather than publishing an empty sameAs", () => {
  const bare = { ...PROFILE_FIXTURE, entities: [PROFILE_FIXTURE.entities[0],
    { ...PROFILE_FIXTURE.entities[1], sections: [] }] };
  assert.throws(() => alsoAt(bare), /Also at/);
});

test("writeJsonLd replaces the leading three nodes and leaves the rest byte-identical", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-ld-"));
  const doc = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Person", "@id": "https://blust.ch/#person", name: "Stale" },
      { "@type": "Dataset", "@id": "https://blust.ch/#model", name: "Stale" },
      { "@type": "WebSite", "@id": "https://blust.ch/#website", name: "Stale" },
      { "@type": "WebPage", "@id": "https://blust.ch/#webpage", name: "Kept", about: { "@id": "https://blust.ch/#person" } },
    ],
  };
  fs.writeFileSync(path.join(dir, "index.html"),
    `<head>\n<script type="application/ld+json">\n${JSON.stringify(doc, null, 2)}\n</script>\n</head>\n`);
  writeJsonLd(PROFILE_FIXTURE, { check: false, root: dir, pages: ["index.html"] });
  const written = JSON.parse(fs.readFileSync(path.join(dir, "index.html"), "utf8")
    .match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/)[1]);
  assert.equal(written["@graph"].length, 4);
  assert.deepEqual(written["@graph"][3], doc["@graph"][3], "the page-specific node is untouched");
  assert.deepEqual(written["@graph"][0].sameAs, ["https://example.com/a", "https://example.com/b"]);
  assert.equal(written["@graph"][1].distribution.contentUrl, "https://blust.ch/model.json");
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test build/renderers.test.mjs`
Expected: FAIL, `Cannot find module` for `./jsonld.mjs`

- [ ] **Step 3: Write `build/jsonld.mjs`**

```js
// The JSON-LD nodes that do not vary from page to page, written into every page that carries a
// graph. That is the rule this file exists to keep: a node that is the same on every page is
// written from one definition, and a node that differs — WebPage, BreadcrumbList — is left
// alone. Nine hand-typed copies of one node is nine chances for eight of them to be right, and
// that had already happened: two pages described the person without an address the other seven
// carried, and the check passed because it held only the pages on its list. There is no list to
// be missing from now.
//
// The three nodes are the leading three entries of @graph on every page, so the whole block is
// re-emitted with them replaced and everything after them preserved. The nodes that stay carry
// no hand formatting, so re-emitting reproduces them byte for byte.
//
// The addresses are the model's; everything else is this site's own words. The model has no
// field for a job title or for what the dataset is, and inventing one would be a model change
// made to satisfy a renderer.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://blust.ch";

// Every page whose graph defines the person, rather than merely pointing at them.
const PAGES = ["index.html", "ideas/index.html", "model/index.html", "principles/index.html",
  "privacy/index.html", "talks/index.html", "timeline/index.html",
  "talks/mental-model/index.html", "talks/essential-complexity/index.html"];

// The person is the profile whose name is the root's — the company of one — and the addresses
// are the URL column of that profile's Also at table.
export function alsoAt(data) {
  const root = data.entities.find((e) => e.id === data.rootId);
  if (!root) throw new Error("the model has no entity at its rootId");
  const profile = data.entities.find((e) => e.type === "profile" && e.name === root.name);
  if (!profile) throw new Error(`the model holds no profile named ${root.name}`);
  const urls = (profile.sections || [])
    .filter((s) => s.heading === "Also at")
    .flatMap((s) => s.tables || [])
    .flatMap((t) => { const u = t.columns.indexOf("URL"); return u < 0 ? [] : t.rows.map((r) => r[u]); })
    .filter(Boolean);
  if (!urls.length) throw new Error("the profile has no Also at rows — the page would publish an empty sameAs");
  return urls;
}

function invariant(data) {
  return [
    {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: "Robert Blust",
      url: `${SITE}/`,
      jobTitle: "Software Engineer & Architect",
      sameAs: alsoAt(data),
      subjectOf: { "@id": `${SITE}/#model` },
    },
    {
      "@type": "Dataset",
      "@id": `${SITE}/#model`,
      name: "Robert Blust — mental model",
      description: "One person described in CompanyGraph: the profile, its experiences, the skills it claims and the evidence under each.",
      // The landing page, which is what url means on a Dataset. It used to name the source
      // repository, which sent every reader off-site rather than to the page that draws it.
      url: `${SITE}/model/`,
      license: "https://creativecommons.org/licenses/by/4.0/",
      creator: { "@id": `${SITE}/#person` },
      about: { "@id": `${SITE}/#person` },
      // The Markdown is what the model is; model.json is what this site serves. Two claims.
      isBasedOn: `https://github.com/${data.repo}`,
      distribution: {
        "@type": "DataDownload",
        contentUrl: `${SITE}/model.json`,
        encodingFormat: "application/json",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "Robert Blust",
      url: `${SITE}/`,
      inLanguage: "en",
      publisher: { "@id": `${SITE}/#person` },
    },
  ];
}

const RE = /(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/;

export function writeJsonLd(data, { check = false, root = HERE, pages = PAGES } = {}) {
  const nodes = invariant(data);
  const stale = [];
  for (const rel of pages) {
    const file = path.join(root, rel);
    const page = fs.readFileSync(file, "utf8");
    const m = RE.exec(page);
    if (!m) throw new Error(`${rel} carries no JSON-LD block`);
    const doc = JSON.parse(m[2]);
    if (!Array.isArray(doc["@graph"])) throw new Error(`${rel}'s JSON-LD has no @graph`);
    doc["@graph"] = [...nodes, ...doc["@graph"].slice(nodes.length)];
    const text = JSON.stringify(doc, null, 2);
    // It has to parse after the write as well as before it: this rewrites a region inside a
    // document that the rest of the site, and every crawler, reads as JSON.
    JSON.parse(text);
    const next = page.replace(RE, (all, open, _body, close) => open + text + close);
    if (next === page) continue;
    if (check) stale.push(rel);
    else fs.writeFileSync(file, next);
  }
  return stale;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `node --test build/renderers.test.mjs`
Expected: PASS, 10 tests

- [ ] **Step 5: Register it and delete its predecessor**

In `build/pages.mjs`:

```js
import { writeJsonLd } from "./jsonld.mjs";
const RENDERERS = [writeBlock, writePrinciples, writeJsonLd];
```

Then:
```bash
git rm build/sameas.mjs
```

In `package.json`, delete the `principles`, `principles:check`, `sameas` and `sameas:check`
entries. Leave `model`, `model:check`, `pages`, `pages:check` and `test:build`.

- [ ] **Step 6: Render, and read the diff line by line**

Run: `npm run pages && git diff --stat`

Expected: exactly nine files changed, all `index.html`, and no change to `model.json`,
`model/index.html`'s data block or `principles/index.html`'s prose block.

Run: `git diff -U0 -- '*.html' | grep '^[-+]' | grep -v '^[-+][-+]' | sort | uniq -c | sort -rn`

Expected, and nothing else:
- nine pages gaining `"isBasedOn"` and a `"distribution"` object of three lines
- nine pages losing `"encodingFormat": "text/markdown"` at node level
- nine pages changing `Dataset.url` from the repository to `https://blust.ch/model/`
- nine pages expanding the inline `"creator"` and `"about"` objects onto three lines each
- two pages — the decks — gaining `"https://substack.com/@robertblust"`

If any other line appears, stop and read it. A changed `WebPage` or `BreadcrumbList` line means
the slice index is wrong.

- [ ] **Step 7: Confirm nothing but JSON-LD moved**

Run: `git diff -- '*.html' | grep -c '^[-+]' && git diff --stat -- model.json`
Expected: a count consistent with step 6, and no output for `model.json`.

Run: `npm run pages:check`
Expected: `✓ every derived region matches model.json at robertblust/mental-model@66cd79d`

- [ ] **Step 8: Confirm the check catches a single-page edit**

This is the drift class that used to be invisible.

```bash
node -e 'const fs=require("fs");const p="talks/mental-model/index.html";fs.writeFileSync(p,fs.readFileSync(p,"utf8").replace("\"inLanguage\": \"en\"","\"inLanguage\": \"de\""))'
npm run pages:check; echo "exit: $?"
git checkout talks/mental-model/index.html
```
Expected: `✗ talks/mental-model/index.html no longer match model.json — run: npm run pages`,
exit 1

- [ ] **Step 9: Run the full suite**

Run: `npm run verify`
Expected: green. This matters more here than anywhere else in the plan, because the design
package's page checks resolve every `@id` in the graph and fetch every on-site URL demanding
HTTP 200 — so this run is what proves `https://blust.ch/model/` and `https://blust.ch/model.json`
are both actually served.

- [ ] **Step 10: Commit**

```bash
git add build/jsonld.mjs build/pages.mjs build/renderers.test.mjs package.json
git add index.html ideas/index.html model/index.html principles/index.html privacy/index.html
git add talks/index.html timeline/index.html talks/mental-model/index.html talks/essential-complexity/index.html
git commit -F - <<'MSG'
A node is written once, wherever it does not vary

Twenty-seven of this site's forty-four JSON-LD nodes were copies typed by hand, and two had
already fallen behind: both talk decks described the person without the Substack address
the other seven pages carried. The writer held seven pages because seven was the list it
was given, and a page that defines the person without being on the list is a page nothing
checks.

The rule is now that a node which does not vary from page to page is written from one
definition, and a node that does — WebPage, BreadcrumbList — is left alone. That deletes
build/sameas.mjs rather than extending it, because whole nodes need no sameAs regex and
there is no list to be missing from. The Dataset node also gains the download it never had:
model.json as a DataDownload, url moved to the page that draws the model, and the source
repository named as isBasedOn.

Verified: node --test build/renderers.test.mjs passes 10 tests; the diff is nine pages of
JSON-LD and nothing else; pages:check goes red on one page edited alone; npm run verify is
green, which resolves every @id and fetches every on-site URL in the graph.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

---

### Task 5: CI, and the documents that describe the mechanism

**Files:**
- Modify: `.github/workflows/ci.yml:42-54` and `:78-88`
- Modify: `AGENTS.md:643-654`
- Modify: `README.md` (the commands block)
- Modify: `verify/check.mjs:128` (one stale comment)

**Interfaces:** none. This task ships no code.

- [ ] **Step 1: Rewrite the CI steps**

In `.github/workflows/ci.yml`, replace the two steps at lines 42-54 with one:

```yaml
      # Every page this site derives from the model, held against the artifact it derives them
      # from. Before npm ci because it installs nothing: pages.mjs and its renderers are node
      # built-ins and one committed file, with no network. That is the whole reason the artifact
      # is committed — the check that catches a page edited by hand is also the cheapest step
      # in this job.
      - name: The derived pages still match the model
        run: npm run pages:check
```

And replace the step at lines 78-88 with:

```yaml
      # Whether the artifact is still what the pinned commit parses to. This cannot sit beside
      # the step above, because it is the one part of the build that imports the parser from
      # companygraph-meta-model, and that is not on disk until npm ci has run. Left up there it
      # fails every push with ERR_MODULE_NOT_FOUND, and a local run cannot catch that, because
      # node_modules is already on the machine.
      - name: model.json still matches the pinned commit
        run: npm run model:check
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Check the workflow parses and the order is right**

Run: `python3 -c 'import yaml,sys; d=yaml.safe_load(open(".github/workflows/ci.yml")); [print("  ",s.get("name") or s.get("run","")[:60]) for s in d["jobs"]["verify"]["steps"]]'`

Expected: `pages:check` appears before the `npm ci` step, `model:check` after it, and no step
named for `principles` or `sameas` remains.

- [ ] **Step 3: Rewrite the AGENTS.md section**

Replace the section at `AGENTS.md:643-654`, `## Two pages carry one data block`, with:

```markdown
## One artifact, and every derived page

`model.json` is the parsed model at the commit `source.json` pins, committed like the share
cards and the PDFs are. `npm run model` writes it and is the only script here that reaches
GitHub or the parser; `npm run pages` renders it into every page derived from it and reaches
neither. So re-pinning is `source.json`, then `npm run model`, then `npm run pages`, and
forgetting the last step is caught rather than shipped: `npm run pages` refuses to run when
the artifact names a commit other than the one pinned, and `npm run pages:check` holds every
page in CI before `npm ci` has run.

Twelve regions are derived. The data block in `/model/` and `/timeline/` is one block written
into two pages, so a red check names a page nobody touched: re-pin and forget `npm run pages`
and both go red together. The vision and the values are rendered as HTML into `/principles/`,
because a crawler has to read them without running JS. And the JSON-LD nodes that do not vary
from page to page — `Person`, `Dataset`, `WebSite` — are written into all nine pages that
carry a graph, while `WebPage` and `BreadcrumbList` differ per page and stay by hand. That
split is the rule: **a node that does not vary from page to page is written from one
definition.** Nine hand-typed copies is nine chances for eight of them to be right, which is
how two talk decks came to describe the person without an address the other seven pages
carried.
```

- [ ] **Step 4: Update the README commands block**

In `README.md`, in the `## Commands` block, replace any `principles` or `sameas` lines with:

```
npm run model          # fetch the pinned model and write model.json — needs the network
npm run model:check     # is model.json still what that commit parses to?
npm run pages            # render model.json into every derived page region
npm run pages:check       # do those pages still match model.json?
npm run test:build         # unit tests for the three renderers
```

And add one sentence after the paragraph that begins "Run `npm run verify` after any change":
"Run `npm run model` then `npm run pages` after moving the pin in `source.json`; `model.json`
and every page built from it are committed files, not generated on demand."

- [ ] **Step 5: Fix the stale comment**

In `verify/check.mjs:128`, change `npm run principles:check`'s business to
`npm run pages:check`'s business.

- [ ] **Step 6: Hold the prose to the conventions**

Run: `sh conventions/conventions-check`
Expected: `✓ every Markdown file follows WRITING.md`

- [ ] **Step 7: Prove the whole thing from a clean slate**

Run:
```bash
rm -f model.json && npm run pages; echo "exit: $?"
npm run model && npm run pages && npm run pages:check && npm run test:build && git diff --stat
```
Expected: the first command fails with `model.json is missing — run: npm run model`, exit 1;
then every command passes and `git diff --stat` is empty, because Task 4 already wrote what
these produce.

Run: `npm run verify`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add .github/workflows/ci.yml AGENTS.md README.md verify/check.mjs
git commit -F - <<'MSG'
CI checks every derived page before it installs anything

Three steps checked the model against the pages, and one of them reached GitHub from above
npm ci because the script it ran fetched the model itself. Now one step covers every derived
region on node built-ins and a committed file, and the only step that needs the network is
the one asking whether that file is still what the pinned commit parses to.

The documents catch up with the mechanism. AGENTS.md described two pages carrying one data
block and a sameAs written from the profile; it now describes one artifact, the twelve
regions rendered from it, and the rule that decides which JSON-LD nodes are written and
which are left alone.

Verified: npm run pages:check, npm run model:check, npm run test:build and npm run verify
all pass; conventions-check passes; git diff is empty after a full regenerate from a deleted
model.json.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
```

- [ ] **Step 9: Open the pull request and stop**

```bash
git push -u origin one-model-artifact
gh pr create --title "The model is parsed once, into a file" --body "$(cat <<'BODY'
Three scripts read the pinned model three different ways: two fetchers on two GitHub
endpoints, two Markdown parsers of which only one answered to the conventions, and a
renderer that scraped `model/index.html` for its input. The order they ran in was
load-bearing and lived only as a sentence in `AGENTS.md`.

One parse is now the only parse. `build/model.mjs` writes `model.json` and is alone in
touching the network or the parser; `build/pages.mjs` renders it into all twelve derived
regions on node built-ins, and refuses to run when the artifact and `source.json` name
different commits. `npm run pages:check` therefore covers every derived page from above
`npm ci`, where only two of the three old checks could sit and one of those needed GitHub.

Measuring for this found that twenty-seven of the site's forty-four JSON-LD nodes were
copies typed by hand, and that two had drifted: both talk decks described the person
without the Substack address the other seven pages carried. So the design takes a rule
rather than a list — a node that does not vary from page to page is written from one
definition — which deletes `build/sameas.mjs` instead of extending it. The `Dataset` node
also gains the download it never had, and its `url` now names the page that draws the model
rather than the source repository, which brings both URLs under the design package's
existing check that every on-site URL in the graph returns 200.

Every other derived region is byte-identical: the data block, and the principles page,
which now reads entities instead of running its own Markdown parser.

Design: `docs/superpowers/specs/2026-09-08-one-model-artifact-design.md`. Section 6 records
what is deliberately left for later, including the half of the rule that belongs in
`robertblust/design` as a check for the whole family.

Verified: `npm run model:check`, `npm run pages:check`, `npm run test:build`,
`npm run verify` and `conventions-check` all pass.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY
)"
```

Report the check result and stop. Merging is the owner's decision, and "open the pull request"
is not approval to merge.

---

## Self-review

**Spec coverage.** §2's artifact, its pretty-printing and the pages' minified block are Task 1.
The two layers and the pin guard are Task 2. The parser becoming the only reading is Task 3.
The page-invariant rule, the deck drift and the `Dataset` corrections are Task 4. §5's CI and
§6's documents are Task 5. §7's acceptance test runs in Task 4 step 6 and Task 5 step 7. §6's
follow-ons are recorded in the spec and are deliberately not tasks.

**Placeholders.** None. Every code step carries the code, every check step carries the command
and the expected output.

**Type consistency.** All three renderers export `write*(data, { check, root }) => string[]`
and are called identically from the `RENDERERS` array. `readInstance({ repo, commit, sub })`
returns a `Map`, which is what `parseInstance` takes. `paragraphs` and `alsoAt` are exported
for their tests and used internally by their own modules.

**One risk worth naming.** Task 4 is the only task that cannot be proved by an empty diff, so
its step 6 spells out every line the diff may contain. If a `WebPage` or `BreadcrumbList` line
appears there, the slice index is wrong and the task should stop rather than be committed.
