# The design package, and the stage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@robertblust/design`, move the stage (`stage.js`, `stage.css`, `d3`), the four fonts and the two stage checks into it, and adopt it in all three sites — which repairs a live rendering bug on companygraph.io and arms the cross-repo tripwire.

**Architecture:** The package is a code generator and a test library, never a runtime dependency: a deck opens from `file://` and GitHub Pages serves the repository tree, so anything a visitor downloads has to stay a committed file at its public path. `design sync` copies whole files from the package into a site; `design sync --check` fails CI when a committed copy has drifted. The stage checks are plain ESM imports that never reach a page. This plan covers only **whole-file** assets — the fence rewriter that tiers 2 and 2b need is a later plan, and nothing here parses HTML.

**Tech Stack:** Node 22+, ESM (`"type": "module"`), `node:test` with `node:assert/strict` (no test framework), Playwright (in the sites, not the package). Distributed as a **git dependency** from a public GitHub repository — no npm registry, no account, no publish step.

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md`

**This is plan 1 of 5.** Later plans, each its own document, in order: tier 2 (the fence rewriter and the prose-page fences), tier 3 (imported check code), tier 2b (the deck), tier 4 (the card harness) plus retiring the habit. Do not start them from this plan.

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include this section.

- **Package name:** `@robertblust/design`. **Repository:** `robertblust/design`, public, owned by the GitHub **user** `robertblust`.
- **Licence:** Apache 2.0 — matching `companygraph/meta-model` and `guestgraph/engine`.
- **Node:** `engines: { "node": ">=22" }`. All three sites' CI pins `node-version: "22"`.
- **Distribution: a git dependency, not the npm registry.** No npm account, no publish step, no `publish.yml`. A release is a git tag plus a GitHub Release. `robertblust/design` is public, so installs need no token, no login and no account.
- **Consuming sites pin an exact tag** — `"@robertblust/design": "github:robertblust/design#v0.1.0"`, never a `#semver:^0.1.0` range. House precedent: companygraph.io pins `"d3": "7.9.0"` exactly because d3's bytes are committed and served; this package is the same kind of thing. `npm ci` records the resolved commit SHA, so installs stay reproducible.
- **Semver:** a change to any generated/synced file is at least a **minor** (it makes every site's committed copy stale). A change needing a site edit beyond `npm run design` is a **major**, and so is dropping a file from a group, because `applySync` never deletes an orphan a site already has. Anything invisible to the sites is a patch.
- **Every release gets a git tag and a GitHub Release with notes** — Dependabot renders them into the PR body, and that PR is the only thing telling someone in another repository what changed.
- **No per-site override.** A site that must differ takes the file out of the package entirely and owns it. There is no local-override escape hatch.
- **The package is a `devDependency` in every site.** Nothing it contains may be fetched by a visitor at runtime.
- **`design:check` runs in CI after `npm ci`** (it needs the package) **and before `npm run verify`** (a stale file should fail on the cheap step).

## Repository paths

The three sites are separate clones. Absolute paths on this machine:

- `blust.ch` → `/Users/rob/git/robertblust/robertblust.github.io`
- `companygraph.io` → `/Users/rob/git/companygraph/companygraph.github.io`
- `guestgraph.io` → `/Users/rob/git/guestgraph/guestgraph.github.io`
- the new package → `/Users/rob/git/robertblust/design` (create it here)

## File Structure

**New — `robertblust/design`:**

| File | Responsibility |
| --- | --- |
| `package.json` | name, exports map, `files` allowlist, engines |
| `LICENSE` | Apache 2.0 |
| `README.md` | what it is, the rule, and the `file://` warning about `stage.js` |
| `lib/groups.mjs` | the manifest: which asset groups exist, and each file's destination path in a site |
| `lib/sync.mjs` | pure logic — read a site's config, plan the copies, apply or check them |
| `bin/design.mjs` | the CLI: `design sync`, `design sync --check`, exit codes, messages |
| `verify/stage.mjs` | the `graph` and `divider` checks, exported as `STAGE_CHECKS` |
| `assets/stage.js` | vendored from blust.ch — the copy that has `markH` |
| `assets/stage.css` | vendored (already byte-identical in cg and rb) |
| `assets/d3.v7.min.js` | vendored (already byte-identical) |
| `assets/fonts/*.woff2` | four faces, vendored (already byte-identical in all three) |
| `test/groups.test.mjs` | the manifest names real files and sane destinations |
| `test/sync.test.mjs` | plan/apply/check against throwaway trees |
| `test/assets.test.mjs` | the vendored `stage.js` is the repaired one, not the buggy one |
| `.github/workflows/ci.yml` | `npm test` on push and PR |

**Modified — each site:**

| File | Change |
| --- | --- |
| `package.json` | add the git devDependency and the `design` / `design:check` scripts |
| `design.config.json` | **new** — which asset groups this site takes |
| `verify/check.mjs` | delete the inline `graph` and `divider`, spread `STAGE_CHECKS` |
| `.github/workflows/ci.yml` | add the `design:check` step |
| `stage.js` | companygraph.io only — gains `markH` (the bug fix) |

---

### Task 1: Scaffold the package and its manifest

**Files:**
- Create: `/Users/rob/git/robertblust/design/package.json`
- Create: `/Users/rob/git/robertblust/design/LICENSE`
- Create: `/Users/rob/git/robertblust/design/.gitignore`
- Create: `/Users/rob/git/robertblust/design/lib/groups.mjs`
- Test: `/Users/rob/git/robertblust/design/test/groups.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `GROUPS`, an object whose keys are group names (`"fonts"`, `"stage"`) and whose values are arrays of `[packageRelativePath, siteRelativePath]` string pairs. `GROUP_NAMES`, a frozen array of the keys. Both imported by Task 2's `lib/sync.mjs` and Task 3's CLI.

- [ ] **Step 1: Create the repository and its first files**

```bash
mkdir -p /Users/rob/git/robertblust/design/{lib,bin,verify,assets/fonts,test}
cd /Users/rob/git/robertblust/design
git init -b main
```

**The path is load-bearing, not a preference.** `~/.gitconfig` carries three `includeIf`
blocks — `gitdir:~/git/robertblust/`, `~/git/guestgraph/`, `~/git/companygraph/` — that
point at `~/.gitconfig-flatland`. A repository created inside `~/git/robertblust/`
therefore authors as `robert.blust@flatland.ch`; one created anywhere else silently gets
the global default, `rob@likemagic.tech`, with no warning. Nothing on GitHub enforces the
author email — the ruleset rule that would is rejected on this plan — so confirm it before
the first commit:

```bash
cd /Users/rob/git/robertblust/design && git config user.email
```

Expected: `robert.blust@flatland.ch`. If it prints anything else, **stop and fix the path**
rather than setting the email locally — a one-off `git config user.email` in this repository
would work today and be missing from every fresh clone.

Write `.gitignore`:

```
node_modules/
*.tgz
```

Write `package.json`. The `exports` map is what lets a site write
`import { STAGE_CHECKS } from "@robertblust/design/verify/stage"`. The `files` allowlist
keeps what a site installs to just the four directories — npm honours it when packing from a
git install too. There is deliberately no `publishConfig`: `access` and `provenance` are
registry-only, and nothing here is published to a registry.

```json
{
  "name": "@robertblust/design",
  "version": "0.1.0",
  "description": "The design system shared by blust.ch, companygraph.io and guestgraph.io.",
  "license": "Apache-2.0",
  "type": "module",
  "repository": { "type": "git", "url": "git+https://github.com/robertblust/design.git" },
  "homepage": "https://github.com/robertblust/design#readme",
  "bugs": { "url": "https://github.com/robertblust/design/issues" },
  "engines": { "node": ">=22" },
  "files": ["lib", "bin", "verify", "assets"],
  "bin": { "design": "./bin/design.mjs" },
  "exports": {
    ".": "./lib/sync.mjs",
    "./groups": "./lib/groups.mjs",
    "./verify/stage": "./verify/stage.mjs"
  },
  "scripts": {
    "test": "node --test"
  }
}
```

Fetch the Apache 2.0 text into `LICENSE`:

```bash
curl -sS -o LICENSE https://www.apache.org/licenses/LICENSE-2.0.txt
```

- [ ] **Step 2: Write the failing test**

Create `test/groups.test.mjs`:

```javascript
// The manifest is the only place that knows where a shared file belongs inside a site.
// GitHub Pages serves the repository tree, so a destination path IS the file's public URL:
// getting one wrong does not fail a build, it 404s in production. Hence the assertions on
// shape — no absolute paths, no escapes, no duplicates.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GROUPS, GROUP_NAMES } from "../lib/groups.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("names exactly the two groups this release ships", () => {
  assert.deepEqual([...GROUP_NAMES].sort(), ["fonts", "stage"]);
});

test("every listed source file exists in the package", () => {
  for (const name of GROUP_NAMES)
    for (const [from] of GROUPS[name])
      assert.ok(fs.existsSync(path.join(PKG, from)), `${name}: missing ${from}`);
});

test("no destination is absolute or escapes the site root", () => {
  for (const name of GROUP_NAMES)
    for (const [, to] of GROUPS[name]) {
      assert.ok(!path.isAbsolute(to), `${name}: ${to} is absolute`);
      assert.ok(!to.split("/").includes(".."), `${name}: ${to} escapes the site root`);
    }
});

test("no destination is claimed by two groups", () => {
  const seen = new Map();
  for (const name of GROUP_NAMES)
    for (const [, to] of GROUPS[name]) {
      assert.equal(seen.get(to), undefined, `${to} is claimed by ${seen.get(to)} and ${name}`);
      seen.set(to, name);
    }
});

test("the stage group carries the script, the stylesheet and the vendored d3", () => {
  const dests = GROUPS.stage.map(([, to]) => to).sort();
  assert.deepEqual(dests, ["d3.v7.min.js", "stage.css", "stage.js"]);
});

test("the fonts group carries all four faces, under fonts/", () => {
  const dests = GROUPS.fonts.map(([, to]) => to).sort();
  assert.deepEqual(dests, [
    "fonts/Bricolage-var.woff2",
    "fonts/InstrumentSans-var.woff2",
    "fonts/PlexMono-400.woff2",
    "fonts/PlexMono-600.woff2",
  ]);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd /Users/rob/git/robertblust/design && node --test test/groups.test.mjs`
Expected: FAIL — `Cannot find module '../lib/groups.mjs'`.

- [ ] **Step 4: Write the manifest**

Create `lib/groups.mjs`:

```javascript
// What this package hands to a site, and where each file belongs once it is there.
//
// The destination is relative to the site's root because GitHub Pages serves the repository
// tree: `stage.css` has to sit at `/stage.css` because that is the URL the pages link. There
// is no build step between the repository and the CDN, and this package does not introduce
// one — it copies files into the places the pages already name.
//
// A group is the unit a site opts into. guestgraph.io draws no graph, so it takes `fonts`
// and not `stage`; the day it grows one, it adds a word to its design.config.json.

export const GROUPS = {
  fonts: [
    ["assets/fonts/Bricolage-var.woff2",      "fonts/Bricolage-var.woff2"],
    ["assets/fonts/InstrumentSans-var.woff2", "fonts/InstrumentSans-var.woff2"],
    ["assets/fonts/PlexMono-400.woff2",       "fonts/PlexMono-400.woff2"],
    ["assets/fonts/PlexMono-600.woff2",       "fonts/PlexMono-600.woff2"],
  ],
  // stage.js is the one shared file that no deck loads — a deck draws static SVG. It is
  // reached only by served prose pages, through a plain <script src>. Nothing here may be
  // linked from a deck; see README.
  stage: [
    ["assets/stage.css",    "stage.css"],
    ["assets/stage.js",     "stage.js"],
    ["assets/d3.v7.min.js", "d3.v7.min.js"],
  ],
};

export const GROUP_NAMES = Object.freeze(Object.keys(GROUPS));
```

- [ ] **Step 5: Run the test — two should still fail**

Run: `node --test test/groups.test.mjs`
Expected: the four shape tests PASS; `every listed source file exists in the package` FAILS,
because `assets/` is still empty. That is correct — Task 4 vendors the files in. Leave it red.

- [ ] **Step 6: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add package.json LICENSE .gitignore lib/groups.mjs test/groups.test.mjs
git commit -m "The package, and the manifest of what it hands a site"
```

---

### Task 2: The sync engine

**Files:**
- Create: `/Users/rob/git/robertblust/design/lib/sync.mjs`
- Test: `/Users/rob/git/robertblust/design/test/sync.test.mjs`

**Interfaces:**
- Consumes: `GROUPS`, `GROUP_NAMES` from `lib/groups.mjs`.
- Produces:
  - `readConfig(siteRoot: string): { groups: string[] }` — reads `design.config.json`; throws `Error` with a readable message if the file is missing or names an unknown group.
  - `planSync(siteRoot: string, config: { groups: string[] }): Entry[]` where
    `Entry = { from: string, to: string, state: "same" | "differs" | "missing" }`.
    `from` is package-relative, `to` is site-relative. Sorted by `to`.
  - `applySync(siteRoot: string, entries: Entry[]): string[]` — writes every entry whose
    state is not `"same"`, creating parent directories; returns the `to` paths it wrote,
    sorted.
  - Task 3's CLI imports all three.

- [ ] **Step 1: Write the failing test**

Create `test/sync.test.mjs`:

```javascript
// The sync engine, against throwaway trees rather than against a real site — so these tests
// still mean something after the sites change.
//
// The three states are the whole contract. "missing" is a site that never had the file;
// "differs" is the drift this package exists to end; "same" is the steady state, and it must
// be the state a second run reaches, or `design:check` would fail every time it ran.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readConfig, planSync, applySync } from "../lib/sync.mjs";
import { GROUPS } from "../lib/groups.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// A throwaway site root, optionally seeded with files.
function site(files = {}, config) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-site-"));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  if (config !== undefined)
    fs.writeFileSync(path.join(root, "design.config.json"), JSON.stringify(config, null, 2));
  return root;
}

const read = (root, rel) => fs.readFileSync(path.join(root, rel));
const pkgBody = (from) => fs.readFileSync(path.join(PKG, from));

test("readConfig returns the declared groups", () => {
  const root = site({}, { groups: ["fonts"] });
  assert.deepEqual(readConfig(root), { groups: ["fonts"] });
});

test("readConfig explains a missing config rather than throwing ENOENT", () => {
  const root = site({});
  assert.throws(() => readConfig(root), /design\.config\.json/);
});

test("readConfig rejects a group this package does not ship", () => {
  const root = site({}, { groups: ["fonts", "confetti"] });
  assert.throws(() => readConfig(root), /confetti/);
});

test("a site with nothing yet reports every file missing", () => {
  const root = site({}, { groups: ["fonts"] });
  const entries = planSync(root, { groups: ["fonts"] });
  assert.equal(entries.length, GROUPS.fonts.length);
  assert.ok(entries.every((e) => e.state === "missing"), JSON.stringify(entries));
});

test("planSync only plans the groups the site declared", () => {
  const root = site({}, { groups: ["fonts"] });
  const dests = planSync(root, { groups: ["fonts"] }).map((e) => e.to);
  assert.ok(!dests.includes("stage.js"), "took the stage group without asking for it");
});

test("a file whose bytes already match reports same", () => {
  const [from, to] = GROUPS.stage[0];
  const root = site({ [to]: pkgBody(from) }, { groups: ["stage"] });
  const entry = planSync(root, { groups: ["stage"] }).find((e) => e.to === to);
  assert.equal(entry.state, "same");
});

test("a file edited in the site reports differs", () => {
  const [, to] = GROUPS.stage[0];
  const root = site({ [to]: "/* someone edited this locally */" }, { groups: ["stage"] });
  const entry = planSync(root, { groups: ["stage"] }).find((e) => e.to === to);
  assert.equal(entry.state, "differs");
});

test("applySync writes the package's bytes exactly, creating directories", () => {
  const root = site({}, { groups: ["fonts"] });
  const written = applySync(root, planSync(root, { groups: ["fonts"] }));
  assert.equal(written.length, GROUPS.fonts.length);
  for (const [from, to] of GROUPS.fonts)
    assert.deepEqual(read(root, to), pkgBody(from), `${to} does not match the package`);
});

test("applySync overwrites a locally edited file", () => {
  const [from, to] = GROUPS.stage[1];
  const root = site({ [to]: "// local edit" }, { groups: ["stage"] });
  applySync(root, planSync(root, { groups: ["stage"] }));
  assert.deepEqual(read(root, to), pkgBody(from));
});

test("a second run writes nothing and reports every file same", () => {
  const root = site({}, { groups: ["fonts", "stage"] });
  const config = { groups: ["fonts", "stage"] };
  applySync(root, planSync(root, config));
  const second = planSync(root, config);
  assert.ok(second.every((e) => e.state === "same"), JSON.stringify(second));
  assert.deepEqual(applySync(root, second), []);
});

test("planSync sorts by destination, so output order is stable", () => {
  const root = site({}, { groups: ["fonts", "stage"] });
  const dests = planSync(root, { groups: ["fonts", "stage"] }).map((e) => e.to);
  assert.deepEqual(dests, [...dests].sort());
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/rob/git/robertblust/design && node --test test/sync.test.mjs`
Expected: FAIL — `Cannot find module '../lib/sync.mjs'`.

- [ ] **Step 3: Write the sync engine**

Create `lib/sync.mjs`:

```javascript
// Copy whole files from this package into a site, and be able to say — without writing
// anything — whether the site's committed copies still match.
//
// Whole files only. The blocks that live inlined inside HTML need a fence rewriter, and that
// is a later release; nothing here parses markup. Keeping the two apart means this file can
// be trusted by inspection: it reads bytes, compares bytes, writes bytes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GROUPS, GROUP_NAMES } from "./groups.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const CONFIG_NAME = "design.config.json";

// What a site declares it takes. Deliberately tiny: a site should not be able to say
// anything here that changes what a file *contains*, only which files it wants.
export function readConfig(siteRoot) {
  const file = path.join(siteRoot, CONFIG_NAME);
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    throw new Error(
      `no ${CONFIG_NAME} in ${siteRoot} — create one, e.g. {"groups":["fonts"]}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
  const groups = parsed.groups;
  if (!Array.isArray(groups) || groups.some((g) => typeof g !== "string"))
    throw new Error(`${file} must carry a "groups" array of strings`);
  for (const g of groups)
    if (!GROUP_NAMES.includes(g))
      throw new Error(
        `${file} names the group ${JSON.stringify(g)}, which this package does not ship. ` +
        `Known groups: ${GROUP_NAMES.join(", ")}`);
  return { groups };
}

// Compare without writing. `state` is the entire vocabulary the CLI reports in.
export function planSync(siteRoot, config) {
  const entries = [];
  for (const group of config.groups)
    for (const [from, to] of GROUPS[group]) {
      const want = fs.readFileSync(path.join(PKG, from));
      const dest = path.join(siteRoot, to);
      let state;
      if (!fs.existsSync(dest)) state = "missing";
      else state = fs.readFileSync(dest).equals(want) ? "same" : "differs";
      entries.push({ from, to, state });
    }
  return entries.sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
}

// Write only what is not already right, so a no-op run leaves every mtime alone and `git
// status` stays quiet.
export function applySync(siteRoot, entries) {
  const written = [];
  for (const e of entries) {
    if (e.state === "same") continue;
    const dest = path.join(siteRoot, e.to);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(path.join(PKG, e.from)));
    written.push(e.to);
  }
  return written.sort();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/sync.test.mjs`
Expected: the tests that do not need real asset bytes PASS. Tests reading `pkgBody(...)` still
FAIL with ENOENT because `assets/` is empty until Task 4. Confirm the failures are all ENOENT
on `assets/`, and nothing else.

- [ ] **Step 5: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add lib/sync.mjs test/sync.test.mjs
git commit -m "Plan, apply and check whole-file copies into a site"
```

---

### Task 3: The CLI

**Files:**
- Create: `/Users/rob/git/robertblust/design/bin/design.mjs`
- Test: `/Users/rob/git/robertblust/design/test/cli.test.mjs`

**Interfaces:**
- Consumes: `readConfig`, `planSync`, `applySync` from `lib/sync.mjs`.
- Produces: an executable `design` with two forms — `design sync [--check] [--site <dir>]`.
  Exit `0` when everything matches (or was written), `1` when `--check` finds drift,
  `2` on a usage or config error. Sites invoke it through npm scripts.

- [ ] **Step 1: Write the failing test**

Create `test/cli.test.mjs`:

```javascript
// The CLI is what a person actually meets, and it meets them at the moment they are confused
// — a red Dependabot pull request in a repository they were not thinking about. So the exit
// codes and the wording are the contract, and they are tested like one.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { GROUPS } from "../lib/groups.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CLI = path.join(PKG, "bin", "design.mjs");

function site(files = {}, config) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-cli-"));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  if (config !== undefined)
    fs.writeFileSync(path.join(root, "design.config.json"), JSON.stringify(config));
  return root;
}

// execFileSync throws on a non-zero exit; normalise both outcomes into one shape.
function run(args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
    return { code: 0, out: stdout };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
}

test("sync writes the files and exits 0", () => {
  const root = site({}, { groups: ["fonts"] });
  const r = run(["sync"], root);
  assert.equal(r.code, 0, r.out);
  for (const [, to] of GROUPS.fonts) assert.ok(fs.existsSync(path.join(root, to)), to);
});

test("sync --check on a synced site exits 0 and writes nothing", () => {
  const root = site({}, { groups: ["fonts"] });
  run(["sync"], root);
  const before = GROUPS.fonts.map(([, to]) => fs.statSync(path.join(root, to)).mtimeMs);
  const r = run(["sync", "--check"], root);
  assert.equal(r.code, 0, r.out);
  const after = GROUPS.fonts.map(([, to]) => fs.statSync(path.join(root, to)).mtimeMs);
  assert.deepEqual(after, before);
});

test("sync --check exits 1 on a stale file and names it and the remedy", () => {
  const root = site({}, { groups: ["stage"] });
  run(["sync"], root);
  fs.writeFileSync(path.join(root, "stage.js"), "// edited by hand");
  const r = run(["sync", "--check"], root);
  assert.equal(r.code, 1);
  assert.match(r.out, /stage\.js/);
  assert.match(r.out, /npm run design/);
});

test("sync --check exits 1 when a declared file was never synced", () => {
  const root = site({}, { groups: ["fonts"] });
  const r = run(["sync", "--check"], root);
  assert.equal(r.code, 1);
  assert.match(r.out, /missing/i);
});

test("a missing config exits 2 and says which file to create", () => {
  const root = site({});
  const r = run(["sync"], root);
  assert.equal(r.code, 2);
  assert.match(r.out, /design\.config\.json/);
});

test("an unknown subcommand exits 2 and shows usage", () => {
  const root = site({}, { groups: ["fonts"] });
  const r = run(["frobnicate"], root);
  assert.equal(r.code, 2);
  assert.match(r.out, /usage/i);
});

test("--site targets another directory", () => {
  const root = site({}, { groups: ["fonts"] });
  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "design-cwd-"));
  const r = run(["sync", "--site", root], elsewhere);
  assert.equal(r.code, 0, r.out);
  assert.ok(fs.existsSync(path.join(root, GROUPS.fonts[0][1])));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/rob/git/robertblust/design && node --test test/cli.test.mjs`
Expected: FAIL — `Cannot find module .../bin/design.mjs`.

- [ ] **Step 3: Write the CLI**

Create `bin/design.mjs`:

```javascript
#!/usr/bin/env node
// design sync          write this package's files into the site
// design sync --check  compare only; exit 1 if any copy has drifted
//
// `--check` is what CI runs. It never writes, so a red build cannot be made green by the
// build itself — someone has to run `design sync` and commit, which is the whole point: the
// bytes a visitor downloads are in the repository, and they got there deliberately.
import path from "node:path";

import { readConfig, planSync, applySync, CONFIG_NAME } from "../lib/sync.mjs";

const USAGE = `usage: design sync [--check] [--site <dir>]

  sync            copy this package's files into the site
  sync --check    compare only, exit 1 if a copy has drifted (this is what CI runs)
  --site <dir>    the site root (default: the current directory)`;

function fail(message, code) {
  console.error(message);
  process.exit(code);
}

const argv = process.argv.slice(2);
if (argv[0] !== "sync") fail(USAGE, 2);

const check = argv.includes("--check");
const siteFlag = argv.indexOf("--site");
if (siteFlag !== -1 && !argv[siteFlag + 1]) fail(USAGE, 2);
const siteRoot = path.resolve(siteFlag === -1 ? process.cwd() : argv[siteFlag + 1]);

let config;
try {
  config = readConfig(siteRoot);
} catch (e) {
  fail(e.message, 2);
}

const entries = planSync(siteRoot, config);
const stale = entries.filter((e) => e.state !== "same");

if (check) {
  if (!stale.length) {
    console.log(`  ✓ ${entries.length} file(s) match @robertblust/design`);
    process.exit(0);
  }
  for (const e of stale)
    console.log(`  ✗ ${e.to}  ${e.state === "missing" ? "missing" : "differs from the package"}`);
  console.log(
    `\n  ${stale.length} file(s) are not what @robertblust/design ships.` +
    `\n  Run: npm run design` +
    `\n  Then re-run the card check (npm run og) if any page changed, and commit.` +
    `\n\n  If this site genuinely needs its own copy, take the group out of ${CONFIG_NAME}` +
    `\n  and own the file — there is no per-file override.`);
  process.exit(1);
}

const written = applySync(siteRoot, entries);
if (!written.length) {
  console.log(`  ✓ already in step — ${entries.length} file(s), nothing to write`);
} else {
  for (const to of written) console.log(`  → ${to}`);
  console.log(`\n  ${written.length} file(s) written. Review the diff and commit.`);
}
```

Make it executable:

```bash
chmod +x /Users/rob/git/robertblust/design/bin/design.mjs
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/cli.test.mjs`
Expected: as in Task 2, everything that does not need real asset bytes PASSES; the rest fail
with ENOENT on `assets/` until Task 4. Confirm no other kind of failure.

- [ ] **Step 5: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add bin/design.mjs test/cli.test.mjs
git commit -m "The CLI: sync, and the check CI runs"
```

---

### Task 4: Vendor the assets, and prove the stage is the repaired one

**Files:**
- Create: `/Users/rob/git/robertblust/design/assets/stage.js`
- Create: `/Users/rob/git/robertblust/design/assets/stage.css`
- Create: `/Users/rob/git/robertblust/design/assets/d3.v7.min.js`
- Create: `/Users/rob/git/robertblust/design/assets/fonts/` (four `.woff2` files)
- Test: `/Users/rob/git/robertblust/design/test/assets.test.mjs`

**Interfaces:**
- Consumes: `GROUPS` from `lib/groups.mjs`.
- Produces: the seven asset files that Tasks 1–3's tests already reference. No new exports.

**Why blust.ch is the source:** its `stage.js` is the repaired copy. companygraph.io's still
ends every connector at a flat `R_NODE` while drawing folders 4px taller, so a spine runs two
pixels inside every folder box and six inside the focused one. `stage.css`, `d3.v7.min.js` and
all four fonts are already byte-identical across the repositories, so their source does not
matter — but take them from the same place for one less thing to reason about.

- [ ] **Step 1: Write the failing test**

Create `test/assets.test.mjs`:

```javascript
// The vendored stage must be the repaired one.
//
// blust.ch and companygraph.io drifted by ten lines, and those ten lines are a bug fix that
// never travelled: `markH` — half a mark's HEIGHT, which is not half its width, because a
// folder's box is drawn 4px taller than a page's square. Vendor the wrong copy and this
// package would ship the bug to the repository that had already fixed it.
//
// So this is a guard, not a unit test: it asserts the identity of the bytes, not behaviour.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GROUPS, GROUP_NAMES } from "../lib/groups.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const asset = (rel) => fs.readFileSync(path.join(PKG, rel), "utf8");

test("stage.js carries markH — it is the repaired copy", () => {
  const js = asset("assets/stage.js");
  assert.match(js, /function markH\(/,
    "vendored stage.js has no markH: this is companygraph.io's buggy copy");
});

test("stage.js terminates spines at markH, never at a flat R_NODE", () => {
  const js = asset("assets/stage.js");
  const shape = js.slice(js.indexOf("function shape("));
  assert.ok(shape.includes("a.y + markH(a)"), "the spine's start still uses a flat half-width");
  assert.ok(!/a\.y \+ R_NODE/.test(shape), "a spine end still computes from R_NODE");
});

test("stage.js reads its data from a data-stage element, so it stays generic", () => {
  assert.match(asset("assets/stage.js"), /data-stage/);
});

test("every asset is non-empty", () => {
  for (const name of GROUP_NAMES)
    for (const [from] of GROUPS[name]) {
      const size = fs.statSync(path.join(PKG, from)).size;
      assert.ok(size > 0, `${from} is empty`);
    }
});

test("the vendored d3 is the pinned 7.9.0 build", () => {
  assert.match(asset("assets/d3.v7.min.js"), /\/\/ https:\/\/d3js\.org v7\.9\.0/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/rob/git/robertblust/design && node --test test/assets.test.mjs`
Expected: FAIL — ENOENT on `assets/stage.js`.

- [ ] **Step 3: Vendor the files in**

```bash
cd /Users/rob/git/robertblust/design
RB=/Users/rob/git/robertblust/robertblust.github.io
cp "$RB/stage.js"       assets/stage.js
cp "$RB/stage.css"      assets/stage.css
cp "$RB/d3.v7.min.js"   assets/d3.v7.min.js
cp "$RB/fonts/Bricolage-var.woff2"      assets/fonts/
cp "$RB/fonts/InstrumentSans-var.woff2" assets/fonts/
cp "$RB/fonts/PlexMono-400.woff2"       assets/fonts/
cp "$RB/fonts/PlexMono-600.woff2"       assets/fonts/
```

- [ ] **Step 4: Prove the vendored copies match what the sites already ship**

The three files below must be byte-identical to companygraph.io's, or this is not a
faithful extraction. `stage.js` must NOT match — companygraph's is the buggy one.

```bash
CG=/Users/rob/git/companygraph/companygraph.github.io
for f in stage.css d3.v7.min.js; do
  cmp -s "assets/$f" "$CG/$f" && echo "  ✓ $f identical to companygraph.io" \
                              || echo "  ✗ $f DIFFERS — stop and investigate"
done
for f in Bricolage-var InstrumentSans-var PlexMono-400 PlexMono-600; do
  cmp -s "assets/fonts/$f.woff2" "$CG/fonts/$f.woff2" && echo "  ✓ $f.woff2 identical" \
                                                     || echo "  ✗ $f.woff2 DIFFERS — stop"
done
cmp -s assets/stage.js "$CG/stage.js" \
  && echo "  ✗ stage.js matches companygraph — you vendored the BUGGY copy" \
  || echo "  ✓ stage.js differs from companygraph (expected: it is the repaired copy)"
```

Expected: six `✓ identical` lines, then `✓ stage.js differs from companygraph`.
If any line reports otherwise, stop — the assumption this plan rests on has changed.

- [ ] **Step 5: Run the whole suite — it should now be green**

Run: `node --test test/`
Expected: PASS, all files, including the Task 1–3 tests that were red for want of assets.

- [ ] **Step 6: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add assets test/assets.test.mjs
git commit -m "Vendor the stage, the fonts and d3 — taking the repaired stage.js"
```

---

### Task 5: Move the two stage checks into the package

**Files:**
- Create: `/Users/rob/git/robertblust/design/verify/stage.mjs`
- Create: `/Users/rob/git/robertblust/design/README.md`
- Test: `/Users/rob/git/robertblust/design/test/stage-checks.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `STAGE_CHECKS`, an object with exactly two keys, `graph` and `divider`, each an
  `async (page, spec) => string | null` in the site suites' existing shape — return a
  problem string, or `null` when there is nothing wrong. `spec.graph` is the id of the
  page's JSON data element; `spec.divider` is a boolean. Task 8, 9 and 10 import this as
  `import { STAGE_CHECKS } from "@robertblust/design/verify/stage"`.

**Source of truth:** blust.ch's `verify/check.mjs`. Its `graph` is companygraph's plus a
single 27-line insertion (the spine assertion) and its `divider` is byte-identical to
companygraph's. Neither references `SITE` or `BASE`, so both move unchanged.

- [ ] **Step 1: Write the failing test**

The checks themselves need a browser and a served site, so they are exercised for real by the
site suites in Tasks 8–10. What this package can assert alone is the *contract* — that both
checks exist, take the runner's shape, and that the spine assertion actually travelled.

Create `test/stage-checks.test.mjs`:

```javascript
// The two checks that guard the stage. They need Playwright and a served site to run, which
// this package has neither of — the site suites exercise them for real. What is asserted here
// is that they exist, that they match the shape the runner calls them with, and that the
// spine assertion — which lived in exactly one of the three repositories — is in the copy
// this package ships.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { STAGE_CHECKS } from "../verify/stage.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("ships exactly the two stage checks", () => {
  assert.deepEqual(Object.keys(STAGE_CHECKS).sort(), ["divider", "graph"]);
});

test("each check takes (page, spec), the shape the runner calls", () => {
  for (const [name, fn] of Object.entries(STAGE_CHECKS)) {
    assert.equal(typeof fn, "function", name);
    assert.equal(fn.length, 2, `${name} should take (page, spec)`);
    assert.equal(fn.constructor.name, "AsyncFunction", `${name} should be async`);
  }
});

test("graph carries the spine assertion — the fix that had not travelled", () => {
  const src = fs.readFileSync(path.join(PKG, "verify/stage.mjs"), "utf8");
  assert.match(src, /getPointAtLength/,
    "the spine assertion is missing: this is companygraph.io's older graph check");
  assert.match(src, /a spine ends inside a node instead of at its edge/);
});

test("neither check hardcodes a site or a base URL", () => {
  const src = fs.readFileSync(path.join(PKG, "verify/stage.mjs"), "utf8");
  assert.ok(!/https:\/\/(blust\.ch|companygraph\.io|guestgraph\.io)/.test(src),
    "a site origin leaked into a shared check");
  assert.ok(!/localhost:8000/.test(src), "a base URL leaked into a shared check");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/rob/git/robertblust/design && node --test test/stage-checks.test.mjs`
Expected: FAIL — `Cannot find module '../verify/stage.mjs'`.

- [ ] **Step 3: Extract the two checks**

Copy them out of blust.ch verbatim, wrapped in a module. Do not retype them — extract the
exact bytes, so the move cannot change behaviour:

```bash
cd /Users/rob/git/robertblust/design
RB=/Users/rob/git/robertblust/robertblust.github.io

{
  cat <<'HEADER'
// The stage's two checks, shared by every repository that draws one.
//
// They moved here from three separate copies of verify/check.mjs, where they had drifted:
// blust.ch's `graph` carried a 27-line assertion that no end of a spine may sit strictly
// within any node's rectangle, and companygraph.io's did not — while companygraph.io was the
// repository still rendering the bug it catches. Both halves of that fix, the repair in
// stage.js and the assertion here, now travel together or not at all.
//
// Neither check knows which site it is running against: `graph` takes the id of the page's
// data element from `spec.graph`, and `divider` needs nothing. That is why they could move
// unchanged.

export const STAGE_CHECKS = {
HEADER
  awk '/^  (async )?graph\(/{on=1} on{print; if(/^  \},$/)exit}'   "$RB/verify/check.mjs"
  echo
  awk '/^  (async )?divider\(/{on=1} on{print; if(/^  \},$/)exit}' "$RB/verify/check.mjs"
  echo "};"
} > verify/stage.mjs

node --check verify/stage.mjs && echo "  ✓ parses"
```

- [ ] **Step 4: Verify the extraction is byte-faithful**

The bodies in the package must be identical to the ones still in blust.ch:

```bash
cd /Users/rob/git/robertblust/design
RB=/Users/rob/git/robertblust/robertblust.github.io
for k in graph divider; do
  a=$(awk -v k="$k" '$0 ~ "^  (async )?" k "\\(" {on=1} on{print; if(/^  \},$/)exit}' "$RB/verify/check.mjs" | md5 -q)
  b=$(awk -v k="$k" '$0 ~ "^  (async )?" k "\\(" {on=1} on{print; if(/^  \},$/)exit}' verify/stage.mjs | md5 -q)
  [ "$a" = "$b" ] && echo "  ✓ $k extracted byte-for-byte" || echo "  ✗ $k CHANGED — stop"
done
```

Expected: two `✓` lines.

- [ ] **Step 5: Write the README**

Create `README.md`:

````markdown
# @robertblust/design

The design system shared by [blust.ch](https://blust.ch),
[companygraph.io](https://companygraph.io) and [guestgraph.io](https://guestgraph.io).

## The rule

> If a visitor downloads it and every copy is the same, it is generated into the
> repository and committed.
> If only CI runs it, it is imported from the package.
> If a visitor downloads it but every copy legitimately differs, only its *shape* is
> shared — as an assertion, not as bytes.

The three sites are static, ship no external assets, and are served straight from their
repository trees by GitHub Pages. So this package is **never a runtime dependency of a
published page**. It is a `devDependency` that copies files into a site and lends that
site's suite a few checks.

## In a site

```jsonc
// design.config.json
{ "groups": ["fonts", "stage"] }   // guestgraph.io takes ["fonts"] — it draws no graph
```

```jsonc
// package.json
"scripts": {
  "design": "design sync",
  "design:check": "design sync --check"
},
"devDependencies": { "@robertblust/design": "0.1.0" }   // exact, never ^
```

`npm run design:check` runs in CI after `npm ci` and before `npm run verify`.

## A warning about `stage.js`

`stage.js` is the one shared file no deck loads — a deck draws static SVG and has to open
from `file://` with no network. **Never link a deck to `stage.js` or `stage.css`.** They
are reached only by served prose pages, through a plain `<link>` and `<script src>`.

## Releasing

Tag, and let the workflow publish. Every release needs notes: Dependabot renders them into
the pull request it opens in three repositories, and that pull request is the only thing
telling someone there what changed.

A change to any synced file is at least a **minor** — it makes every site's committed copy
stale. A change needing a site edit beyond `npm run design` is a **major**.
````

- [ ] **Step 6: Run the whole suite**

Run: `node --test test/`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add verify/stage.mjs test/stage-checks.test.mjs README.md
git commit -m "The stage's two checks, with the spine assertion that had not travelled"
```

---
### Task 6: The package's CI

**Files:**
- Create: `/Users/rob/git/robertblust/design/.github/workflows/ci.yml`
- Create: `/Users/rob/git/robertblust/design/.github/dependabot.yml`

**Interfaces:**
- Consumes: `npm test` from Task 1's `package.json`.
- Produces: nothing other tasks import.

**There is no publish workflow.** Distribution is a git dependency, so a release is a tag and
nothing runs to make it happen. That removes the whole class of things a release pipeline can
get wrong — no OIDC, no token, no registry authentication, no tag-versus-manifest guard.

- [ ] **Step 1: Write the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  # The job id — `test` — is the status-check context a branch ruleset would require, not the
  # workflow name. If this repository ever gets a protect-main ruleset, it names `test`; rename
  # the job afterwards and the branch looks protected while nothing ever reports again. The
  # three sites hit exactly this and settled on the job id `verify`; this one differs because
  # it runs unit tests rather than a rendered-page suite, and that is the only reason.
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: "22"
      # No `npm ci`: this package has no dependencies, and having none is a property worth
      # keeping. Three sites install it, and every transitive dependency it took would land
      # in all three.
      - name: The sync tool still does what it says
        run: npm test
```

- [ ] **Step 2: Write the Dependabot config**

Create `.github/dependabot.yml`:

```yaml
# This package takes no runtime dependencies and intends to keep it that way — three sites
# install it, so anything it pulled in would land in all three. That leaves the actions.
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      actions:
        patterns:
          - "*"
```

- [ ] **Step 3: Verify the YAML parses and the suite still passes**

```bash
cd /Users/rob/git/robertblust/design
grep -c "	" .github/workflows/ci.yml .github/dependabot.yml
npm test 2>&1 | tail -6
```

Expected: both `grep -c` counts are `0` — a stray tab makes YAML fail to parse — and
`npm test` reports 35 passing, 0 failing.

- [ ] **Step 4: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add .github
git commit -m "CI, and Dependabot for the actions"
```

---

### Task 7: Create the repository, push, and tag v0.1.0

**Files:**
- Modify: none.

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: `robertblust/design` on GitHub at tag `v0.1.0`. Tasks 8-10 install from it.

**Why this task is now four steps rather than eight.** An earlier draft had this task claiming
a permanent npm scope, creating an account, enabling 2FA, publishing a throwaway bootstrap
version — npm cannot configure trusted publishing for a package that does not yet exist; its
own `npm trust` documentation says "The package you're configuring must already exist on the
npm registry" — deprecating that bootstrap, configuring OIDC, and only then publishing for
real. All of it existed to serve a registry this project turned out not to need. Distribution
is a git dependency now, so the release is a tag.

**Nothing in this task is irreversible.** A tag can be moved or deleted; a repository can be
made private or removed. That is a real change from the earlier draft, where a claimed npm
scope and a published version could never be taken back.

- [ ] **Step 1: Create the GitHub repository and push**

```bash
cd /Users/rob/git/robertblust/design
gh repo create robertblust/design --public \
  --description "The design system shared by blust.ch, companygraph.io and guestgraph.io" \
  --source . --remote origin --push
```

The repository must be **public**. Not for discoverability — nobody else wants this — but
because a private repository would make every install need a credential, in three separate
GitHub owners. Public means `npm ci` fetches it anonymously, and the three sites' CI needs no
secret of any kind.

- [ ] **Step 2: Confirm CI is green**

```bash
cd /Users/rob/git/robertblust/design
gh run list --limit 3
gh run watch <the CI run id> --exit-status --compact
```

Expected: the `CI / test` job passes, 35 tests. Do not tag a red commit.

`gh run watch` with no run id only works in an interactive terminal — non-interactively it
exits with `run ID required when not running interactively`. Take the id from `gh run list`.
Expect Dependabot Updates runs to appear alongside CI on the first push; they are not the run
you are watching.

- [ ] **Step 3: Tag and write the release notes**

The tag is the release. The notes are the only thing that reaches a person in another
repository — Dependabot renders them into the pull request body it opens there.

```bash
cd /Users/rob/git/robertblust/design
git tag v0.1.0
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0 — the stage, the fonts, and the two stage checks" --notes \
'First release. Sites adopting this take `stage.js`, `stage.css`, `d3.v7.min.js` and the four
web fonts from here instead of keeping their own copies, and import the `graph` and `divider`
checks.

**companygraph.io: this release changes what your stage renders.** `stage.js` gains `markH`,
so a connector now stops at the edge of the box it points at. It was ending two pixels inside
every folder and six inside the focused one. The `graph` check gains the assertion that
catches it.

After upgrading: `npm run design && npm run og`, then commit — the stage files are named by
`/model/` and `/example/`, so changing them marks those pages'"'"' share cards stale.'
```

- [ ] **Step 4: Verify a site can actually install it**

Prove the git dependency resolves before three repositories depend on it:

```bash
cd /tmp && rm -rf design-verify && mkdir design-verify && cd design-verify
npm init -y > /dev/null
npm install --save-dev --save-exact "github:robertblust/design#v0.1.0"
node -e '
  const { STAGE_CHECKS } = await import("@robertblust/design/verify/stage");
  console.log("  stage checks:", Object.keys(STAGE_CHECKS).sort().join(", "));
' --input-type=module
ls node_modules/@robertblust/design
npx design sync --check ; echo "  exit $?  (2 expected — no design.config.json here)"
```

Expected: `stage checks: divider, graph`; the installed directory contains `lib bin verify
assets package.json README.md LICENSE NOTICE` — note **no `test/`**, so the `files` allowlist
is honoured on a git install; and `design sync --check` exits **2** because this throwaway has
no config, which is the right answer.

**One thing to check in the lockfile, because it looks alarming and is fine.** npm records the
resolution as `git+ssh://git@github.com/robertblust/design.git#<sha>` — an SSH URL — even
though the specifier was the `github:` shorthand and even with local git config neutralised.
GitHub Actions runners carry no SSH key for github.com, so this looks like it would break CI in
all three sites. It does not: npm falls back to HTTPS for public hosted repositories. Verified
with a cold cache and SSH forcibly broken —
`GIT_SSH_COMMAND=/bin/false npm ci --cache /tmp/fresh` installs successfully. Do not "fix" this
by rewriting the specifier to a `git+https://` URL; the shorthand is correct and the SHA in the
lockfile is what makes the install reproducible.

Also confirm the dependency was written the way the plan expects:

```bash
grep -A2 devDependencies package.json
```

Expected: `"@robertblust/design": "github:robertblust/design#v0.1.0"`.

---

### Task 8: blust.ch adopts — the empty-diff proof

**Files:**
- Create: `/Users/rob/git/robertblust/robertblust.github.io/design.config.json`
- Modify: `/Users/rob/git/robertblust/robertblust.github.io/package.json`
- Modify: `/Users/rob/git/robertblust/robertblust.github.io/verify/check.mjs`
- Modify: `/Users/rob/git/robertblust/robertblust.github.io/.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `STAGE_CHECKS` from `@robertblust/design/verify/stage`, and the `design` CLI.
- Produces: nothing other repositories consume. This is the reference adoption — Tasks 9
  and 10 repeat its shape.

**The gate:** blust.ch is where every asset was vendored from, so `npm run design` must
produce an **empty** `git diff`. If it does not, the package is wrong and this task stops.

- [ ] **Step 1: Work on a branch**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
git checkout -b adopt-design-package
```

- [ ] **Step 2: Install the package and declare what this site takes**

The dependency is a git reference, not a registry version — `robertblust/design` is public, so
this needs no npm account, no login and no token, here or in CI. `npm ci` will record the
resolved commit SHA in the lockfile, so the install stays reproducible.

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
npm install --save-dev "github:robertblust/design#v0.1.0"
printf '{\n  "groups": ["fonts", "stage"]\n}\n' > design.config.json
```

Confirm the dependency was pinned exactly — a caret here would let a minor version arrive
without a visible line in `package.json`:

```bash
grep '"@robertblust/design"' package.json
```

Expected: `"@robertblust/design": "github:robertblust/design#v0.1.0"` — an exact tag, not
a `#semver:` range. `--save-exact` is not used because it means nothing for a git
specifier; the exactness comes from naming the tag.

- [ ] **Step 3: Add the two scripts**

In `package.json`, add to `"scripts"`, immediately after `"serve"`:

```json
    "design": "design sync",
    "design:check": "design sync --check",
```

- [ ] **Step 4: Run the sync and prove the diff is empty**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
npm run design
git status --porcelain -- stage.js stage.css d3.v7.min.js fonts/
```

Expected: **no output at all.** Every file already matched, so nothing was written.
If any file is listed, stop: the vendored copy in the package differs from this site's, which
means Task 4 took the wrong bytes.

- [ ] **Step 5: Verify `design:check` passes**

Run: `npm run design:check`
Expected: `✓ 7 file(s) match @robertblust/design`, exit 0.

- [ ] **Step 6: Import the stage checks instead of defining them**

In `verify/check.mjs`, extend the existing import block at the top:

```javascript
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "./design.mjs";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
```

Delete the inline `graph(page, spec) { … }` and `divider(page, spec) { … }` bodies from the
`CHECKS` object, and spread the imported pair in at the top of the object instead:

```javascript
const CHECKS = {
  ...STAGE_CHECKS,
  // …every other check in this file, unchanged…
```

Then confirm nothing was lost — the object must still expose both keys, and the file must no
longer define them itself:

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
grep -c "^  async graph(\|^  async divider(" verify/check.mjs
grep -n "STAGE_CHECKS" verify/check.mjs
```

Expected: the count prints `0`, and `STAGE_CHECKS` appears twice — once imported, once spread.

Do **not** try to import `check.mjs` to verify it: the file launches Chromium and runs the
whole page loop at module top level, so importing it runs the suite against whatever happens
to be on port 8000. Step 7 runs it properly.

- [ ] **Step 7: Run the full suite — it must be unchanged**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 1
npm run verify
kill %1
```

Expected: every page `✓`, exactly as before this task. `graph` and `divider` now come from the
package and must behave identically — blust.ch is where they came from.

- [ ] **Step 8: Wire `design:check` into CI**

blust.ch's `/model/` also names `../stage.css`, `../d3.v7.min.js` and `../stage.js`, so those
files are in its card recipe too. It does not matter for *this* task — the sync produced an
empty diff, so no card moved — but it will on the first release that changes a stage file:
`npm run design` and `npm run og` then belong in one commit. Leave the CI step order alone;
`og:check` before `npm ci` is deliberate and correct (see Task 10, Step 7).

In `.github/workflows/ci.yml`, add a step immediately after `- run: npm ci` and before
`- run: npx playwright install --with-deps chromium`:

```yaml
      # After npm ci because it needs the package; before the browser because a file that is
      # not what the package ships should fail on the cheap step, not on a rendered page.
      - name: The shared files are still what the package ships
        run: npm run design:check
```

- [ ] **Step 9: Commit and open the pull request**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
git add package.json package-lock.json design.config.json verify/check.mjs .github/workflows/ci.yml
git commit -m "Take the stage, the fonts and the stage checks from @robertblust/design"
git push -u origin adopt-design-package
gh pr create --title "<the commit subject>" --body-file <a body file you write>
```

**Do not use `--fill`.** It takes the pull request body from the commit *body*, and these
commits have single-line messages — so `--fill` yields a pull request with an empty description.
Write the body yourself. It must carry: what the change adopts; **the empty-diff evidence pasted
as actual command output** (that diff is the whole proof the extraction was faithful, and a
reader cannot check an assertion); what moved and what deliberately did not; and a line on each
file in the diff. This is the artefact someone reads before merging.

Stop here and wait for CI. Do not merge without an explicit go-ahead.

---

### Task 9: guestgraph.io adopts — fonts only

**Files:**
- Create: `/Users/rob/git/guestgraph/guestgraph.github.io/design.config.json`
- Modify: `/Users/rob/git/guestgraph/guestgraph.github.io/package.json`
- Modify: `/Users/rob/git/guestgraph/guestgraph.github.io/.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the `design` CLI. **Not** `STAGE_CHECKS` — guestgraph.io draws no graph, has no
  `stage.js`, no `stage.css` and no vendored `d3`, and its `check.mjs` defines neither
  `graph` nor `divider`.
- Produces: nothing.

**The gate:** an empty diff, as in Task 8. The four fonts are already byte-identical here.

- [ ] **Step 1: Work on a branch and install**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
git checkout -b adopt-design-package
npm install --save-dev "github:robertblust/design#v0.1.0"
printf '{\n  "groups": ["fonts"]\n}\n' > design.config.json
grep '"@robertblust/design"' package.json
```

Expected: `"@robertblust/design": "github:robertblust/design#v0.1.0"` — an exact tag, not
a `#semver:` range. `--save-exact` is not used because it means nothing for a git
specifier; the exactness comes from naming the tag.

- [ ] **Step 2: Add the two scripts**

In `package.json`, add to `"scripts"`, immediately after `"serve"`:

```json
    "design": "design sync",
    "design:check": "design sync --check",
```

- [ ] **Step 3: Run the sync and prove the diff is empty**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
npm run design
git status --porcelain -- fonts/
```

Expected: **no output.**

- [ ] **Step 4: Prove the stage group was not taken**

The site declared `["fonts"]`, so no stage file may have appeared:

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
ls stage.js stage.css d3.v7.min.js 2>&1 | head -3
npm run design:check
```

Expected: three `No such file or directory` lines, then
`✓ 4 file(s) match @robertblust/design`, exit 0.

- [ ] **Step 5: Run the full suite**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 1
npm run verify
kill %1
```

Expected: unchanged from before this task — nothing about this site's pages moved.

- [ ] **Step 6: Wire `design:check` into CI**

In `.github/workflows/ci.yml`, add a step immediately after `- run: npm ci`:

```yaml
      # After npm ci because it needs the package; before the browser because a file that is
      # not what the package ships should fail on the cheap step, not on a rendered page.
      - name: The shared files are still what the package ships
        run: npm run design:check
```

- [ ] **Step 7: Commit and open the pull request**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
git add package.json package-lock.json design.config.json .github/workflows/ci.yml
git commit -m "Take the web fonts from @robertblust/design"
git push -u origin adopt-design-package
gh pr create --title "<the commit subject>" --body-file <a body file you write>
```

**Do not use `--fill`.** It takes the pull request body from the commit *body*, and these
commits have single-line messages — so `--fill` yields a pull request with an empty description.
Write the body yourself. It must carry: what the change adopts; **the empty-diff evidence pasted
as actual command output** (that diff is the whole proof the extraction was faithful, and a
reader cannot check an assertion); what moved and what deliberately did not; and a line on each
file in the diff. This is the artefact someone reads before merging.

Stop and wait for CI. Do not merge without an explicit go-ahead.

---

### Task 10: companygraph.io adopts — and the spine bug is repaired

**Files:**
- Create: `/Users/rob/git/companygraph/companygraph.github.io/design.config.json`
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/package.json`
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/verify/check.mjs`
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/stage.js` (by sync — the fix)
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `STAGE_CHECKS` from `@robertblust/design/verify/stage`, and the `design` CLI.
- Produces: nothing.

**This is the one task in the plan that deliberately produces a non-empty diff**, and the
only one that changes what a visitor sees. The steps are ordered so the bug is *demonstrated*
before it is fixed: import the check first, watch `/model/` and `/example/` go red, then sync
`stage.js` and watch them go green. Do not reorder them — the red run is the evidence that the
repair was needed and that the assertion works.

- [ ] **Step 1: Work on a branch and install**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
git checkout -b adopt-design-package
npm install --save-dev "github:robertblust/design#v0.1.0"
printf '{\n  "groups": ["fonts", "stage"]\n}\n' > design.config.json
grep '"@robertblust/design"' package.json
```

Expected: `"@robertblust/design": "github:robertblust/design#v0.1.0"` — an exact tag, not
a `#semver:` range. `--save-exact` is not used because it means nothing for a git
specifier; the exactness comes from naming the tag.

- [ ] **Step 2: Add the two scripts**

In `package.json`, add to `"scripts"`, immediately after `"serve"`:

```json
    "design": "design sync",
    "design:check": "design sync --check",
```

- [ ] **Step 3: Import the stage checks — WITHOUT syncing yet**

In `verify/check.mjs`, extend the import block at the top:

```javascript
import { chromium } from "playwright";
import { DESIGN_CHECKS, SYSTEM_FACES } from "./design.mjs";
import { STAGE_CHECKS } from "@robertblust/design/verify/stage";
```

Delete the inline `graph(page, spec) { … }` and `divider(page, spec) { … }` bodies from the
`CHECKS` object and spread the imported pair in at the top instead:

```javascript
const CHECKS = {
  ...STAGE_CHECKS,
  // …every other check in this file, unchanged…
```

Verify the file no longer defines them:

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
grep -c "^  async graph(\|^  async divider(" verify/check.mjs
```

Expected: `0`.

- [ ] **Step 4: Run the suite and watch it go RED — this is the bug**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 1
npm run verify
kill %1
```

Expected: **FAIL on `/model/` and `/example/`**, with a message of the form
`graph: a spine ends inside a node instead of at its edge: <id> (x,y)`.

This is the live bug: `stage.js` here still terminates spines at a flat `R_NODE` while drawing
folder boxes 4px taller. **If the suite passes at this step, stop** — either the import did
not take effect, or the geometry is not what the spec measured, and the rest of this task is
built on a premise that no longer holds.

Record the failing output — it belongs in the pull request body.

- [ ] **Step 5: Sync, and see exactly one file change**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
npm run design
git status --porcelain -- stage.js stage.css d3.v7.min.js fonts/
```

Expected: exactly one line, ` M stage.js`. `stage.css`, `d3.v7.min.js` and the four fonts were
already identical and must not appear.

Confirm the change is the ten lines the spec described, and nothing else:

```bash
git diff --stat -- stage.js
git diff -- stage.js | grep -E "^[+-]" | grep -v "^[+-][+-]" | head -20
```

Expected: the diff adds `function markH(p)` and its comment, and replaces two `R_NODE`
terms in `shape()` with `markH(a)` / `markH(b)`. Nothing else.

- [ ] **Step 6: Run the suite again and watch it go GREEN**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 1
npm run verify
kill %1
```

Expected: every page `✓`, including `/model/` and `/example/`.

- [ ] **Step 7: Restamp the share cards — they WILL be stale**

An earlier draft of this plan said "`stage.js` is not part of any page's card recipe". **That
was wrong.** `og-recipe.mjs` walks every `src=`/`href=` a page names, and `/model/` and
`/example/` both carry `<link href="../stage.css">`, `<script src="../d3.v7.min.js">` and
`<script src="../stage.js">`. All three are in the recipe hash, so changing `stage.js` marks
those two cards stale by design.

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
npm run og:check
```

Expected: `/model/` and `/example/` reported stale. Run `npm run og` and include the
regenerated `og.png` and `og.sha` for both in **this same commit** — not a follow-up. The
`design:check` message tells you to do this ("Then re-run the card check…"); doing it in one
commit is what keeps it to a single CI round trip.

Note the ordering this depends on, which is correct as it stands and must not be "fixed":
`test:og` and `og:check` deliberately run *before* `npm ci` because they install nothing. At
Dependabot time that is exactly right — a bump changes only `package.json` and the lockfile,
which no page names, so `og:check` stays quiet and `design:check` is the step that goes red
with the actionable message. The cards only go stale once you have actually run
`npm run design`, which is this step.

- [ ] **Step 8: Verify `design:check` passes and wire it into CI**

Run: `npm run design:check`
Expected: `✓ 7 file(s) match @robertblust/design`, exit 0.

In `.github/workflows/ci.yml`, add a step immediately after `- run: npm ci` and before
`- name: The vendored d3 is the pinned build`:

```yaml
      # After npm ci because it needs the package; before the browser because a file that is
      # not what the package ships should fail on the cheap step, not on a rendered page.
      - name: The shared files are still what the package ships
        run: npm run design:check
```

- [ ] **Step 9: Commit and open the pull request**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
git add package.json package-lock.json design.config.json verify/check.mjs stage.js .github/workflows/ci.yml
git commit -m "Take the stage from @robertblust/design, and stop spines short of the box

stage.js here still ended every spine at a flat R_NODE while drawing a folder's box
4px taller than a page's square, so a connector ran two pixels inside every folder
and six inside the focused one. blust.ch fixed this and the fix never travelled;
neither did the graph check that catches it. Both arrive together now."
git push -u origin adopt-design-package
gh pr create --fill --body "$(cat <<'BODY'
Adopts `@robertblust/design@0.1.0` for the stage, the fonts and the two stage checks.

**This changes what `/model/` and `/example/` render.** `stage.js` gains `markH`, so a
connector now stops at the edge of the box it points at rather than inside it.

The `graph` check that catches this arrived in the same change, and failed before the
sync and passed after — see the commit for the geometry.

- `stage.css`, `d3.v7.min.js` and the four fonts were already byte-identical; only
  `stage.js` moved.
- `design:check` now runs in CI after `npm ci`.
BODY
)"
```

Stop and wait for CI. Do not merge without an explicit go-ahead.

---

## Done when

- `robertblust/design` is a public GitHub repository tagged `v0.1.0`, with a release carrying
  notes. Nothing is published to a registry and there is no npm account.
- All three sites carry a `design.config.json`, a devDependency pinned to that exact tag, and a
  `design:check` step in CI — and none of them needs a token or a login to install it.
- `verify/design.mjs` still exists three times — that is tier 3, a later plan. But `graph` and
  `divider` exist **once**.
- No spine on companygraph.io ends inside a node's box, and the check that says so runs in
  both repositories that draw a stage.
- Tagging a new version of the package makes Dependabot open a pull request in three
  repositories, and `design:check` makes it red until someone runs `npm run design`.

## Carried into Tasks 8-10 from the final review

Two things the whole-branch review surfaced that belong to the site adoptions, recorded here
so they are not lost between plans.

**Give the design package its own Dependabot group.** The spec asks for this explicitly — "so
a design change never arrives in the same pull request as a Playwright bump" — and the task
steps above do not do it. All three sites currently group `minor-and-patch` into one pull
request, and a design release is a **minor** by this package's own semver policy, so it would
land bundled with exactly what the spec wanted it kept apart from. Add to each site's
`.github/dependabot.yml`, inside the npm entry's `groups:`, a group matching
`@robertblust/design` ahead of the catch-all `minor-and-patch` group. The tripwire fires
either way; this is about the signal being readable.

**`d3.v7.min.js` gains a second owner on companygraph.io, and the two can deadlock.**
companygraph.io pins `"d3": "7.9.0"` in `dependencies`, and its `verify/instance.test.mjs`
asserts the committed `d3.v7.min.js` is byte-identical to `node_modules/d3/dist/d3.min.js`.
After Task 10, `design:check` asserts that same file matches the package. Both agree today —
verified — so adoption is safe. But afterwards: a Dependabot **d3** bump in companygraph.io
cannot be cleared without a matching design release, and a design release that bumps d3
cannot be cleared in companygraph.io without also editing its `package.json` — which by this
plan's own semver rule makes any d3 bump a **major**, not a minor. Write that down in the
package README's semver note when Task 10 lands, and expect the next d3 bump to be a
two-repository change.

## Not in this plan

Named here so they are not attempted: the fence rewriter and the 111 shared blocks (tokens,
header, language, head, prose kit); `verify/design.mjs` and the fourteen shared check bodies;
the deck; the card harness. Each has its own plan, in the order the spec's phases give.

**One piece of the spec's phase 0 is deliberately deferred rather than done here:** adding an
end fence to the four deck footers and reconciling their four copies by hand. It is
independent of everything in this plan — nothing here parses HTML — and it belongs with the
fence work it makes mechanical. It is the first task of plan 2. Do not let it fall out of
phase 0 unnoticed.
