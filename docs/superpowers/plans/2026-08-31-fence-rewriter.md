# The fence rewriter, and the 39 blocks that already carry a version — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach `@robertblust/design` to own blocks that live *inside* HTML, and move the three fenced contracts that are already byte-identical everywhere — `design tokens` (20 pages), `header contract` (16), `stage contract` (3) — to one source, so their `· vN` markers stop being a habit and become a machine check.

**Architecture:** The package gains a second kind of thing it manages. Whole files are copied (plan 1); fenced blocks are *rewritten in place* between markers the HTML already carries. Both are driven by the same `design sync` / `design sync --check` commands, so **no consuming site changes a script or a CI step** — adoption is a version bump and one command. The rewriter finds `/* ─── <name> · <vN> · … ───` … `/* ─── end <name> ─── */`, replaces everything between and including those lines, and reports per-fence rather than per-file.

**Tech Stack:** Node 22+, ESM, `node:test` with `node:assert/strict`, no dependencies. String and line manipulation only — **no HTML parser, no CSS parser, no regex over the whole document.**

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md`

**This is plan 2 of 5.** Plan 1 (`2026-08-30-design-package-and-stage.md`) is merged: the package exists at `v0.1.0`, all three sites consume it, and companygraph.io's stage bug is repaired.

### Why this plan is smaller than the spec's tier 2

Tier 2 names five fenced things. Only three of them are mechanical today, and the plan takes exactly those:

| Block | Copies | State | This plan? |
| --- | --- | --- | --- |
| `design tokens` | 20 | byte-identical; two variants differing by **one line** | **yes** |
| `header contract` | 16 | byte-identical, all sixteen | **yes** |
| `stage contract` | 3 | byte-identical, all three | **yes** |
| `deck footer` | 4 | **two things in one fence** — a 9-or-31-line lockup contract that has *not* drifted, plus a 150–162-line transport bar that has, four ways | no — plan 4 |
| language + storage | 20 | two dialects, needs a per-site parameter | no — plan 3 |
| prose typography kit | 16 | not a block yet — 54 common lines to carve out of 57–150 | no — plan 5 |

The three taken need no judgement: the bytes already agree, so the only question is whether the tool reproduces them. The three deferred each need a decision made before a tool can help, and each gets its own plan.

The deck footer is the clearest case. Its fence bundles a contract with a component: its own `FOOTER_VERSION` comment describes the lockup and its links, and then the fence goes on to hold the entire transport bar. Split at `.transport{`, the lockup half has **two** forms, each internally byte-identical (9 lines on companygraph.io and guestgraph.io, 31 on blust.ch's two decks — a real structural difference, not decay), while the transport half has **four**. So the fix is not reconciliation; it is cutting the fence in two, with the transport moving alongside the runtime and markup it belongs to. That is deck work, and where the cut falls is not knowable until the deck is pulled apart.

## Global Constraints

Copied from the spec and from plan 1. Every task's requirements implicitly include this section.

- **The package takes NO dependencies and NO devDependencies.** Three sites install it. Do not run `npm install`.
- `"type": "module"`, ESM only. Tests are `node:test` + `node:assert/strict`, no framework. `npm test` runs `node --test` with no arguments and must exit 0.
- **Distribution is a git dependency.** No npm registry, no account, no publish step. A release is a git tag plus a GitHub Release with notes.
- **Sites pin an exact tag**: `"@robertblust/design": "github:robertblust/design#v0.2.0"`.
- **Semver:** a change to any generated block is at least a **minor** — it makes every site's committed copy stale. A change needing a site edit beyond `npm run design` is a **major**.
- **No per-site override.** A site that must differ takes the block out of the package and owns it.
- **`design sync --check` must never write.** A CI check that can repair itself is not a check.
- **A deck opens from `file://` with no network.** Nothing here may add a `<link>`, a `<script src>`, or any external reference to a deck. The rewriter only ever replaces bytes already inlined in the page.
- Merge with `gh pr merge --merge`, **never `--squash`** — GitHub re-authors a squash commit to whoever pressed the button.

## Repository paths

- package → `/Users/rob/git/robertblust/design` (public: `github.com/robertblust/design`)
- `blust.ch` → `/Users/rob/git/robertblust/robertblust.github.io`
- `companygraph.io` → `/Users/rob/git/companygraph/companygraph.github.io`
- `guestgraph.io` → `/Users/rob/git/guestgraph/guestgraph.github.io`

## The two token variants, exactly

This is the only non-uniform thing in the plan, and it is one line. A prose page closes its
`:root` inside the fence; a deck leaves it open and adds its own tokens after the end marker.

**Prose page** (16 pages):

```css
  :root{
    --ground:#0C0E13; …
    --c-path:#B8D0FF;
  }
  /* ─── end design tokens ─────────────────────────────────────────────── */
```

**Deck** (4 pages):

```css
  :root{
    --ground:#0C0E13; …
    --c-path:#B8D0FF;
  /* ─── end design tokens ─────────────────────────────────────────────── */

    /* deck-only … */
    --warn:#e0705e; --slab:#16181d; --lcd:#0a0b0e;
  }
```

Identical but for the `  }` line before the end marker. The package emits the shared body; the
variant decides whether the closing brace is appended.

## The gate: what the first sync is allowed to change

Plan 1's gate was an empty diff. **This plan's gate cannot be, and pretending otherwise would
hide a real change.** The fence's own comment prose currently says *"keep in step across every
repository that shares them"*, describing a habit that is being replaced; the spec requires it to
say what to do instead. And the token fence gains a variant word so the tool knows which form to
emit. Both are inside the fence, and both are the point of the plan.

So the gate is sharper than "empty", and it is mechanically checkable:

> **After `npm run design`, the diff may touch only lines inside a fence comment. Not one CSS
> declaration — no property, no value, no selector — may change on any page.**

Each adoption task (5, 6, 7) carries the exact command that proves it, plus a second check that
compares the extracted `--token:value;` declarations against `git show HEAD:` for the same file.
Any CSS movement means the rewriter is wrong and the task stops.

## File Structure

**Package — new:**

| File | Responsibility |
| --- | --- |
| `lib/fences.mjs` | the manifest: which fences exist, their source file, their variants |
| `lib/rewrite.mjs` | pure text: find a fence in a document, replace its body, report what it found |
| `blocks/tokens.css` | the canonical token block, fence lines included, without the closing brace |
| `blocks/header.css` | the canonical header contract, fence lines included |
| `blocks/stage.css` | the canonical stage contract fence — 30 lines, **not** `assets/stage.css` |
| `versions.json` | per-block content versions: `{"tokens":"v4","header":"v2","stage":"v2"}` |
| `test/rewrite.test.mjs` | the parser against hand-built documents, including the nasty cases |
| `test/fences.test.mjs` | the manifest names real files; every block carries its own fence lines |

**Package — modified:**

| File | Change |
| --- | --- |
| `lib/sync.mjs` | gains `planFences` / `applyFences` beside the existing file functions |
| `bin/design.mjs` | reports fences as well as files; exit codes unchanged |
| `README.md` | a section on what a fence is and how a page opts in |

**Sites — modified:** only `package.json` and `package-lock.json` (the version bump) and the
fenced HTML the tool rewrites. **No script and no CI change in any site.**

---

### Task 1: The fence rewriter — finding and replacing one block

**Files:**
- Create: `/Users/rob/git/robertblust/design/lib/rewrite.mjs`
- Test: `/Users/rob/git/robertblust/design/test/rewrite.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces, all pure and synchronous, imported by Tasks 2 and 3:
  - `findFence(text: string, name: string): {start: number, end: number, version: string, variant: string|null, body: string} | null` — line indices are 0-based and **inclusive** of both marker lines. Returns `null` when the page carries no such fence.
  - `replaceFence(text: string, name: string, block: string): string` — returns the document with that fence's lines swapped for `block`. Throws if the fence is absent or unterminated.
  - `FenceError` — the Error subclass both throw, carrying `.name === "FenceError"`.

**The format, stated once.** An opening line is `/* ─── <name> · <version> · <rest> ───`,
indented by two spaces inside a `<style>`. A closing line is `/* ─── end <name> ─── */` with any
run of box-drawing characters. `<version>` is `v` followed by digits. `<rest>` may name a variant
as its first word (`page`, `deck`) or may be prose.

- [ ] **Step 1: Write the failing test**

Create `test/rewrite.test.mjs`:

```javascript
// The fence parser, against documents built by hand rather than against the real sites — so
// these tests still mean something after every page changes.
//
// What it must never do is as important as what it must do. It edits pages that a deck opens
// from file:// with no network, and a parser that silently matched the wrong region would
// rewrite live CSS. So every failure mode here is a throw, not a best guess.
import { test } from "node:test";
import assert from "node:assert/strict";

import { findFence, replaceFence, FenceError } from "../lib/rewrite.mjs";

const doc = (...lines) => lines.join("\n");

const PAGE = doc(
  "<style>",
  "  body{color:red}",
  "  /* ─── design tokens · v3 · page ───────────────────────────────────",
  "     some prose about the block",
  "  */",
  "  :root{",
  "    --ground:#0C0E13;",
  "  }",
  "  /* ─── end design tokens ─────────────────────────────────────────── */",
  "  main{display:block}",
  "</style>",
);

test("finds a fence and reports its line span, inclusive of both markers", () => {
  const f = findFence(PAGE, "design tokens");
  assert.equal(f.start, 2);
  assert.equal(f.end, 8);
});

test("reads the version and the variant off the opening line", () => {
  const f = findFence(PAGE, "design tokens");
  assert.equal(f.version, "v3");
  assert.equal(f.variant, "page");
});

test("reports variant null when the opening line carries prose instead", () => {
  const p = PAGE.replace("· page ───", "· keep in step across every repository ───");
  assert.equal(findFence(p, "design tokens").variant, null);
});

test("the body excludes neither marker — it is the whole block", () => {
  const f = findFence(PAGE, "design tokens");
  assert.ok(f.body.startsWith("  /* ─── design tokens"));
  assert.ok(f.body.trimEnd().endsWith("*/"));
  assert.ok(f.body.includes("--ground:#0C0E13;"));
});

test("returns null for a fence the page does not carry", () => {
  assert.equal(findFence(PAGE, "header contract"), null);
});

test("does not confuse one fence for another with a shared prefix", () => {
  const two = doc(
    "  /* ─── stage contract · v1 · x ───",
    "  .a{}",
    "  /* ─── end stage contract ─── */",
    "  /* ─── stage · v1 · x ───",
    "  .b{}",
    "  /* ─── end stage ─── */",
  );
  assert.equal(findFence(two, "stage").start, 3);
  assert.equal(findFence(two, "stage contract").start, 0);
});

test("replaceFence swaps the whole block and leaves every other line alone", () => {
  const out = replaceFence(PAGE, "design tokens", doc(
    "  /* ─── design tokens · v4 · page ───",
    "  */",
    "  :root{ --ground:#000; }",
    "  /* ─── end design tokens ─── */",
  ));
  assert.ok(out.includes("  body{color:red}"), "content before the fence was disturbed");
  assert.ok(out.includes("  main{display:block}"), "content after the fence was disturbed");
  assert.ok(out.includes("--ground:#000;"));
  assert.ok(!out.includes("--ground:#0C0E13;"));
});

test("replaceFence is idempotent — replacing with what is already there changes nothing", () => {
  const f = findFence(PAGE, "design tokens");
  assert.equal(replaceFence(PAGE, "design tokens", f.body), PAGE);
});

test("an opening marker with no closing marker throws rather than guessing", () => {
  const broken = doc(
    "  /* ─── design tokens · v3 · page ───",
    "  :root{ --ground:#0C0E13; }",
    "</style>",
  );
  assert.throws(() => findFence(broken, "design tokens"),
    e => e.name === "FenceError" && /end design tokens/.test(e.message));
});

test("replacing a fence the page does not carry throws", () => {
  assert.throws(() => replaceFence(PAGE, "header contract", "x"),
    e => e.name === "FenceError" && /header contract/.test(e.message));
});

test("a document with CRLF line endings round-trips without corrupting them", () => {
  const crlf = PAGE.replace(/\n/g, "\r\n");
  const f = findFence(crlf, "design tokens");
  assert.equal(replaceFence(crlf, "design tokens", f.body), crlf);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/rob/git/robertblust/design && node --test test/rewrite.test.mjs`
Expected: FAIL — `Cannot find module '../lib/rewrite.mjs'`.

- [ ] **Step 3: Write the rewriter**

Create `lib/rewrite.mjs`:

```javascript
// Find a fenced block inside a page, and swap it for the one this package ships.
//
// Line-based on purpose. These are HTML documents carrying CSS inside a <style>, and the fences
// are comments; a regex over the whole document would be one greedy quantifier away from
// swallowing the page, and an HTML parser would be a dependency this package refuses to take.
// Working a line at a time means the worst failure is "found nothing", which throws.
//
// Nothing here writes a file or knows what a site is. That belongs to lib/sync.mjs.

export class FenceError extends Error {
  constructor(message) { super(message); this.name = "FenceError"; }
}

// Box-drawing runs vary in length between pages and nobody should have to count them, so the
// marker is matched by its words and the dashes are only required to be present.
const RULE = "─";                                   // ─
const open  = (name) => new RegExp(
  `^\\s*/\\*\\s*${RULE}+\\s*${escapeRe(name)}\\s*·\\s*(v\\d+)\\s*·\\s*(\\S+)`);
const close = (name) => new RegExp(`^\\s*/\\*\\s*${RULE}+\\s*end\\s+${escapeRe(name)}\\b`);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A fence name can be a prefix of another ("stage" and "stage contract"), so the opening pattern
// anchors on the ` · ` that follows the name. `\S+` after the version is the variant slot: a
// block with variants puts `page` or `deck` there, and a block without them has prose, whose
// first word is not a variant and is reported as none.
const VARIANTS = new Set(["page", "deck"]);

function splitLines(text) {
  // Preserve the document's line endings exactly: a page written with CRLF must come back with
  // CRLF, or the whole file shows as changed and the diff hides what actually moved.
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  return { lines: text.split(eol), eol };
}

export function findFence(text, name) {
  const { lines, eol } = splitLines(text);
  const o = open(name), c = close(name);
  for (let i = 0; i < lines.length; i++) {
    const m = o.exec(lines[i]);
    if (!m) continue;
    for (let j = i + 1; j < lines.length; j++) {
      if (!c.test(lines[j])) continue;
      return {
        start: i,
        end: j,
        version: m[1],
        variant: VARIANTS.has(m[2]) ? m[2] : null,
        body: lines.slice(i, j + 1).join(eol),
      };
    }
    throw new FenceError(
      `the fence "${name}" opens at line ${i + 1} and never closes — ` +
      `expected a line matching "/* ─── end ${name} ───"`);
  }
  return null;
}

export function replaceFence(text, name, block) {
  const found = findFence(text, name);
  if (!found)
    throw new FenceError(`this page carries no "${name}" fence to replace`);
  const { lines, eol } = splitLines(text);
  const replacement = block.split(/\r?\n/);
  return [...lines.slice(0, found.start), ...replacement, ...lines.slice(found.end + 1)]
    .join(eol);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — 35 existing tests plus 11 new ones, 46 total, 0 failing.

- [ ] **Step 5: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add lib/rewrite.mjs test/rewrite.test.mjs
git commit -m "Find a fenced block in a page, and swap it without touching the rest"
```

---

### Task 2: The three canonical blocks, and their manifest

**Files:**
- Create: `/Users/rob/git/robertblust/design/blocks/tokens.css`
- Create: `/Users/rob/git/robertblust/design/blocks/header.css`
- Create: `/Users/rob/git/robertblust/design/blocks/stage.css`
- Create: `/Users/rob/git/robertblust/design/versions.json`
- Create: `/Users/rob/git/robertblust/design/lib/fences.mjs`
- Test: `/Users/rob/git/robertblust/design/test/fences.test.mjs`
- Modify: `/Users/rob/git/robertblust/design/package.json` (add `blocks` and `versions.json` to `files`)

**Interfaces:**
- Consumes: `findFence` from `lib/rewrite.mjs`.
- Produces, imported by Task 3:
  - `FENCES` — an object keyed by fence name. Each value is
    `{ source: string, version: string, variants: string[]|null, closes: boolean }` where
    `source` is package-relative, `variants` lists the variant words a page may declare (null when
    the block has none), and `closes` names the variant that gets a trailing `  }` appended.
  - `FENCE_NAMES` — frozen array of the keys.
  - `blockFor(name: string, variant: string|null): string` — the exact text to write into a page,
    with the version stamped from `versions.json` and the closing brace appended when the variant
    calls for it.

**Extraction is mechanical, not retyped.** These are 30, 98 and 30 lines of intricate CSS with
prose comments. (Do not confuse the 30-line `stage contract` *fence* with `assets/stage.css`, the
198-line stage *stylesheet* plan 1 vendored — they are different things with similar names.) Extract them with the commands given; a transcription slip would change what
three sites render.

- [ ] **Step 1: Extract the three blocks from blust.ch**

blust.ch carries all three and they are byte-identical to the other sites' copies, verified
before this plan was written.

```bash
cd /Users/rob/git/robertblust/design
mkdir -p blocks
RB=/Users/rob/git/robertblust/robertblust.github.io

# tokens: take the PROSE form, then drop the "  }" line that precedes the end marker, so the
# stored block is the shared body and the variant decides whether the brace comes back.
awk '/design tokens · v/{on=1} on{print; if(/end design tokens/)exit}' "$RB/index.html" \
  | awk 'BEGIN{n=0} {a[n++]=$0} END{for(i=0;i<n;i++){ if(i==n-2 && a[i]=="  }") continue; print a[i] }}' \
  > blocks/tokens.css

awk '/header contract · v/{on=1} on{print; if(/end header contract/)exit}' "$RB/index.html" \
  > blocks/header.css

awk '/stage contract · v/{on=1} on{print; if(/end stage contract/)exit}' "$RB/model/index.html" \
  > blocks/stage.css

wc -l blocks/*.css
tail -3 blocks/tokens.css
```

Expected: `tokens.css` 30 lines, `header.css` 98, `stage.css` 30. `tokens.css`'s last three
lines must be `    --c-path:#B8D0FF;`, then the end-marker comment — **no bare `  }` between
them.** If the brace is still there the awk did not strip it and the deck variant will be wrong.

- [ ] **Step 2: Update the fence prose in each block**

Each block's opening line currently ends with a habit that is being replaced. Edit the three
files so each opening line reads, with its box-drawing run kept the same length:

- `blocks/tokens.css`: `  /* ─── design tokens · v4 · {{variant}} ───────────────────────────────`
- `blocks/header.css`: `  /* ─── header contract · v2 · shared ──────────────────────────────────`
- `blocks/stage.css`: `  /* ─── stage contract · v2 · shared ───────────────────────────────────`

`{{variant}}` is the one placeholder the tool substitutes; the other two carry the literal word
`shared`, because those blocks have no variants and the slot must still be a single word.

Then, inside each block's comment prose, replace the sentence that says the copies must be kept
in step by hand with what a reader should now do. In `blocks/tokens.css` the paragraph beginning
*"These sites share no stylesheet by design…"* becomes a statement that the block is generated
from `@robertblust/design`, that editing it here has no effect because the next `npm run design`
will overwrite it, and that the place to change it is the package. Do the same in the other two.
Keep every other line of prose — the four colour stops, the `--c-path` reasoning, the header
contract's five rules — exactly as it is. **Change no CSS.**

Verify no declaration moved:

```bash
cd /Users/rob/git/robertblust/design
RB=/Users/rob/git/robertblust/robertblust.github.io
decls() { grep -oE '^\s*--[a-z-]+:[^;]+;|^\s*[.#a-z][^{]*\{[^}]*\}' "$1" | tr -d ' '; }
diff <(decls blocks/header.css) \
     <(awk '/header contract · v/{on=1} on{print; if(/end header contract/)exit}' "$RB/index.html" > /tmp/h.css; decls /tmp/h.css) \
  && echo "  ✓ header: no declaration changed"
```

Expected: `✓ header: no declaration changed`.

- [ ] **Step 3: Write the failing test**

Create `test/fences.test.mjs`:

```javascript
// The fence manifest, and the three blocks it names.
//
// These blocks are written verbatim into twenty pages across three repositories, so the tests
// that matter are the ones about their shape: that each carries its own fence lines (the package
// owns the whole block, markers included), that the version in the file agrees with
// versions.json, and that the token block does NOT carry the closing brace — the variant adds it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FENCES, FENCE_NAMES, blockFor } from "../lib/fences.mjs";
import { findFence } from "../lib/rewrite.mjs";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const versions = JSON.parse(fs.readFileSync(path.join(PKG, "versions.json"), "utf8"));

test("names exactly the three fences this release ships", () => {
  assert.deepEqual([...FENCE_NAMES].sort(), ["design tokens", "header contract", "stage contract"]);
});

test("every block source exists", () => {
  for (const n of FENCE_NAMES)
    assert.ok(fs.existsSync(path.join(PKG, FENCES[n].source)), `${n}: ${FENCES[n].source}`);
});

test("every fence's version matches versions.json", () => {
  for (const n of FENCE_NAMES) assert.equal(FENCES[n].version, versions[FENCES[n].key], n);
});

test("each block carries its own opening and closing markers", () => {
  for (const n of FENCE_NAMES) {
    const text = blockFor(n, FENCES[n].variants ? FENCES[n].variants[0] : null);
    const f = findFence(text, n);
    assert.ok(f, `${n}: the emitted block is not a findable fence`);
    assert.equal(f.start, 0, `${n}: the block must start at its own opening marker`);
    assert.equal(f.end, text.split("\n").length - 1, `${n}: the block must end at its own marker`);
  }
});

test("the emitted version is the one versions.json declares, not whatever the file said", () => {
  const t = blockFor("design tokens", "page");
  assert.equal(findFence(t, "design tokens").version, versions.tokens);
});

test("the page variant closes the :root brace and the deck variant does not", () => {
  const page = blockFor("design tokens", "page").split("\n");
  const deck = blockFor("design tokens", "deck").split("\n");
  assert.equal(page[page.length - 2].trim(), "}", "the page variant must close :root");
  assert.notEqual(deck[deck.length - 2].trim(), "}", "the deck variant must leave :root open");
  assert.equal(page.length, deck.length + 1, "the two variants differ by exactly one line");
});

test("the stored token block carries no closing brace of its own", () => {
  const raw = fs.readFileSync(path.join(PKG, FENCES["design tokens"].source), "utf8").split("\n");
  assert.notEqual(raw[raw.length - 2].trim(), "}",
    "blocks/tokens.css still has the brace — the deck variant would emit it too");
});

test("a block with no variants rejects one, and a block with variants requires one", () => {
  assert.throws(() => blockFor("header contract", "deck"), /variant/);
  assert.throws(() => blockFor("design tokens", null), /variant/);
});

test("blockFor is stable — the same call twice gives the same bytes", () => {
  assert.equal(blockFor("design tokens", "deck"), blockFor("design tokens", "deck"));
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `node --test test/fences.test.mjs`
Expected: FAIL — `Cannot find module '../lib/fences.mjs'`.

- [ ] **Step 5: Write `versions.json` and the manifest**

Create `versions.json`:

```json
{
  "tokens": "v4",
  "header": "v2",
  "stage": "v2"
}
```

Each is one past what the sites carry today (`v3`, `v1`, `v1`). The bump is honest: the block's
prose changes in this release, so a page carrying `v3` really is behind.

Create `lib/fences.mjs`:

```javascript
// The blocks this package writes *inside* a page, as opposed to the whole files it copies.
//
// A fence is a pair of comment markers the HTML already carries. The package owns everything
// between and including them — the prose, the version, the CSS — so a site cannot half-adopt a
// block, and the version in the page is stamped from versions.json rather than typed.
//
// Why these three and not the other three the spec names: these are already byte-identical in
// every copy, so moving them is mechanical and the only question is whether the tool reproduces
// them. The deck footer bundles a contract with a component, the language block has two dialects and needs a per-site
// parameter, and the prose kit is not a block yet. Each of those needs a decision made before a
// tool can help, and each has its own plan.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const versions = JSON.parse(fs.readFileSync(path.join(PKG, "versions.json"), "utf8"));

export const FENCES = {
  // A prose page closes its :root inside the fence; a deck leaves it open and adds tokens of its
  // own after the end marker. The stored block stops before the brace, and `closes` names the
  // variant that gets it back — one line, and the only shape difference in the whole manifest.
  "design tokens": {
    key: "tokens", source: "blocks/tokens.css", version: versions.tokens,
    variants: ["page", "deck"], closes: "page",
  },
  "header contract": {
    key: "header", source: "blocks/header.css", version: versions.header,
    variants: null, closes: null,
  },
  "stage contract": {
    key: "stage", source: "blocks/stage.css", version: versions.stage,
    variants: null, closes: null,
  },
};

export const FENCE_NAMES = Object.freeze(Object.keys(FENCES));

const VARIANT_SLOT = "{{variant}}";

export function blockFor(name, variant) {
  const spec = FENCES[name];
  if (!spec) throw new Error(`no such fence: ${name}`);
  if (spec.variants && !spec.variants.includes(variant))
    throw new Error(
      `the "${name}" fence needs a variant, one of ${spec.variants.join(", ")} — got ` +
      `${variant === null ? "none" : JSON.stringify(variant)}`);
  if (!spec.variants && variant !== null)
    throw new Error(`the "${name}" fence takes no variant, but got ${JSON.stringify(variant)}`);

  let text = fs.readFileSync(path.join(PKG, spec.source), "utf8").replace(/\n$/, "");
  text = text.replace(VARIANT_SLOT, variant === null ? "shared" : variant);

  if (spec.closes && variant === spec.closes) {
    // put the brace back, immediately before the end marker
    const lines = text.split("\n");
    lines.splice(lines.length - 1, 0, "  }");
    text = lines.join("\n");
  }
  return text;
}
```

- [ ] **Step 6: Add the new paths to the package's `files` allowlist**

Two edits in `package.json`, and nothing else:

1. `"files"` becomes `["lib", "bin", "verify", "assets", "blocks", "versions.json", "NOTICE"]`,
   so the blocks and the version file ship.
2. `"exports"` gains `"./fences": "./lib/fences.mjs"` beside the existing three entries — Task 4
   installs the release and imports it by that path to prove the tarball is usable.

- [ ] **Step 7: Run the tests**

Run: `npm test`
Expected: PASS, 55 tests (46 from Task 1 plus 9), 0 failing.

Then confirm the emitted blocks really are what the sites carry today, modulo the fence lines:

```bash
cd /Users/rob/git/robertblust/design
node -e '
  const { blockFor } = await import("./lib/fences.mjs");
  const fs = await import("node:fs");
  const RB = "/Users/rob/git/robertblust/robertblust.github.io";
  // strip EVERY comment region, not just the marker lines: Step 2 rewrites prose inside the
  // comment, so a marker-only strip reports those rewrites as differences and hides the one
  // thing this check is for — whether any CSS moved.
  const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map(l=>l.trim()).filter(Boolean).join("\n");
  const live = (f, name) => {
    const src = fs.readFileSync(f, "utf8").split("\n");
    const a = src.findIndex(l => l.includes(name + " · v"));
    const b = src.findIndex((l, i) => i > a && l.includes("end " + name));
    return src.slice(a, b + 1).join("\n");
  };
  for (const [name, file, variant] of [
    ["design tokens", RB + "/index.html", "page"],
    ["design tokens", RB + "/talks/mental-model/index.html", "deck"],
    ["header contract", RB + "/index.html", null],
    ["stage contract", RB + "/model/index.html", null],
  ]) {
    const same = strip(blockFor(name, variant)) === strip(live(file, name));
    console.log(`  ${same ? "✓" : "✗"} ${name} (${variant ?? "shared"})`);
  }
' --input-type=module
```

Expected: four `✓` lines. A `✗` means the extraction changed CSS and this task stops.

- [ ] **Step 8: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add blocks versions.json lib/fences.mjs test/fences.test.mjs package.json
git commit -m "The three fenced blocks, and the versions they carry"
```

---

### Task 3: Sync and check the fences alongside the files

**Files:**
- Modify: `/Users/rob/git/robertblust/design/lib/sync.mjs`
- Modify: `/Users/rob/git/robertblust/design/bin/design.mjs`
- Test: `/Users/rob/git/robertblust/design/test/sync-fences.test.mjs`

**Interfaces:**
- Consumes: `FENCES`, `FENCE_NAMES`, `blockFor` from `lib/fences.mjs`; `findFence`,
  `replaceFence`, `FenceError` from `lib/rewrite.mjs`; the existing `readConfig`, `planSync`,
  `applySync`, `CONFIG_NAME` from `lib/sync.mjs`.
- Produces, added to `lib/sync.mjs`:
  - `findPages(siteRoot: string): string[]` — every `.html` under the site, site-relative, sorted,
    skipping `node_modules` and `.git`.
  - `planFences(siteRoot: string): Entry[]` where
    `Entry = { page: string, fence: string, variant: string|null, state: "same"|"differs" }`,
    sorted by `page` then `fence`. Pages carrying no fence of a given name simply produce no entry.
  - `applyFences(siteRoot: string, entries: Entry[]): string[]` — rewrites every entry whose state
    is `"differs"`, returns the changed page paths, sorted and de-duplicated.
- The existing four exports keep their signatures exactly.

**Discovery, not registration.** The tool walks the site's HTML and rewrites whatever fences it
finds. A page that grows a fence is picked up with no list to maintain, and a page with no fence
is untouched. The hole this leaves — a page that *should* carry a fence and does not — is already
covered by the sites' own suites, which assert the marker on every page in `PAGES`.

- [ ] **Step 1: Write the failing test**

Create `test/sync-fences.test.mjs`:

```javascript
// Fence planning and application against throwaway sites.
//
// The property that matters most is the one the CI check rests on: a second run must reach
// "same" for everything. If it did not, design:check would fail on every run and the tripwire
// would be noise instead of signal.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { findPages, planFences, applyFences } from "../lib/sync.mjs";
import { blockFor } from "../lib/fences.mjs";

function site(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-fence-"));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}

const wrap = (block) => ["<style>", "  body{color:red}", block, "  main{}", "</style>"].join("\n");
const stale = (variant) =>
  wrap(blockFor("design tokens", variant).replace(/· v\d+ ·/, "· v1 ·"));

test("findPages lists html and skips node_modules and .git", () => {
  const root = site({
    "index.html": "x", "talks/index.html": "x",
    "node_modules/p/index.html": "x", ".git/whatever.html": "x", "style.css": "x",
  });
  assert.deepEqual(findPages(root), ["index.html", "talks/index.html"]);
});

test("a page already carrying the shipped block reports same", () => {
  const root = site({ "index.html": wrap(blockFor("design tokens", "page")) });
  const e = planFences(root).find(x => x.fence === "design tokens");
  assert.equal(e.state, "same");
  assert.equal(e.variant, "page");
});

test("a page carrying an older version reports differs", () => {
  const root = site({ "index.html": stale("page") });
  assert.equal(planFences(root).find(x => x.fence === "design tokens").state, "differs");
});

test("the deck variant is read off the page, not guessed", () => {
  const root = site({ "talks/t/index.html": stale("deck") });
  const e = planFences(root).find(x => x.fence === "design tokens");
  assert.equal(e.variant, "deck");
});

test("applyFences rewrites only what differs and leaves the rest of the page alone", () => {
  const root = site({ "index.html": stale("page") });
  const written = applyFences(root, planFences(root));
  assert.deepEqual(written, ["index.html"]);
  const out = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.ok(out.includes("  body{color:red}"), "content before the fence was disturbed");
  assert.ok(out.includes("  main{}"), "content after the fence was disturbed");
  assert.ok(out.includes(blockFor("design tokens", "page")));
});

test("applying the deck variant does not close the :root brace", () => {
  const root = site({ "talks/t/index.html": stale("deck") });
  applyFences(root, planFences(root));
  const out = fs.readFileSync(path.join(root, "talks/t/index.html"), "utf8");
  const lines = out.split("\n");
  const end = lines.findIndex(l => l.includes("end design tokens"));
  assert.notEqual(lines[end - 1].trim(), "}", "the deck gained a closing brace it must not have");
});

test("a second run writes nothing and reports every fence same", () => {
  const root = site({ "index.html": stale("page"), "talks/t/index.html": stale("deck") });
  applyFences(root, planFences(root));
  const second = planFences(root);
  assert.ok(second.length > 0, "the second plan found no fences at all");
  assert.ok(second.every(e => e.state === "same"), JSON.stringify(second));
  assert.deepEqual(applyFences(root, second), []);
});

test("a page with no fences produces no entries and is never rewritten", () => {
  const root = site({ "plain.html": "<style>  body{}</style>" });
  assert.deepEqual(planFences(root).filter(e => e.page === "plain.html"), []);
});

test("an unterminated fence throws rather than being silently skipped", () => {
  const root = site({
    "bad.html": "<style>\n  /* ─── design tokens · v3 · page ───\n  :root{}\n</style>",
  });
  assert.throws(() => planFences(root), e => e.name === "FenceError");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/sync-fences.test.mjs`
Expected: FAIL — `findPages` is not exported from `lib/sync.mjs`.

- [ ] **Step 3: Extend `lib/sync.mjs`**

Append to `lib/sync.mjs`, leaving the four existing exports untouched:

```javascript
import { FENCE_NAMES, FENCES, blockFor } from "./fences.mjs";
import { findFence, replaceFence } from "./rewrite.mjs";

const SKIP_DIRS = new Set(["node_modules", ".git"]);

// Discovery rather than registration: a page that grows a fence is picked up with no list to
// keep in step. What this cannot see is a page that *should* carry a fence and does not — and
// that hole is already covered, by each site's own suite asserting the marker on every page in
// its PAGES list.
export function findPages(siteRoot) {
  const out = [];
  const walk = (dir, rel) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name);
      } else if (e.name.endsWith(".html")) {
        out.push(rel ? `${rel}/${e.name}` : e.name);
      }
    }
  };
  walk(siteRoot, "");
  return out.sort();
}

export function planFences(siteRoot) {
  const entries = [];
  for (const page of findPages(siteRoot)) {
    const text = fs.readFileSync(path.join(siteRoot, page), "utf8");
    for (const fence of FENCE_NAMES) {
      const found = findFence(text, fence);          // throws on an unterminated fence
      if (!found) continue;
      const variant = FENCES[fence].variants ? found.variant : null;
      if (FENCES[fence].variants && variant === null)
        throw new FenceError(
          `${page}: the "${fence}" fence declares no variant. Its opening line must name one of ` +
          `${FENCES[fence].variants.join(", ")} — a prose page uses "page", a deck uses "deck".`);
      const want = blockFor(fence, variant);
      entries.push({ page, fence, variant, state: found.body === want ? "same" : "differs" });
    }
  }
  return entries.sort((a, b) =>
    a.page < b.page ? -1 : a.page > b.page ? 1 : a.fence < b.fence ? -1 : a.fence > b.fence ? 1 : 0);
}

export function applyFences(siteRoot, entries) {
  const touched = new Set();
  const byPage = new Map();
  for (const e of entries) {
    if (e.state === "same") continue;
    if (!byPage.has(e.page)) byPage.set(e.page, []);
    byPage.get(e.page).push(e);
  }
  for (const [page, list] of byPage) {
    const file = path.join(siteRoot, page);
    let text = fs.readFileSync(file, "utf8");
    for (const e of list) text = replaceFence(text, e.fence, blockFor(e.fence, e.variant));
    fs.writeFileSync(file, text);
    touched.add(page);
  }
  return [...touched].sort();
}
```

Add `FenceError` to the existing `import` from `./rewrite.mjs` so the throw above resolves.

- [ ] **Step 4: Teach the CLI to report fences**

In `bin/design.mjs`, import `planFences` and `applyFences` alongside the existing four, and
report both kinds. Replace the `--check` branch and the write branch so that:

- `--check` prints file mismatches as it does now, then a line per differing fence in the form
  `  ✗ <page>  <fence> is <pageVersion>, this release ships <ourVersion>`, and exits **1** if
  either kind has anything stale. When both are clean it prints
  `  ✓ <n> file(s) and <m> fence(s) match @robertblust/design` and exits **0**.
- the write branch applies files then fences, prints `  → <path>` per changed file and
  `  → <page>  <fence>` per rewritten fence, and ends with the same "review the diff and commit"
  line already there. When nothing changed it prints
  `  ✓ already in step — <n> file(s), <m> fence(s), nothing to write`.
- the remedy text after a failed `--check` gains one sentence: that a fence is generated, so a
  block edited by hand in a page will be overwritten, and the place to change it is the package.

Exit codes stay exactly 0 / 1 / 2. A `FenceError` must exit **2** with its message, not crash
with a stack trace — it means a page is malformed, which is a config-shaped problem, not drift.

- [ ] **Step 5: Run the tests and exercise the CLI by hand**

```bash
cd /Users/rob/git/robertblust/design
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
```

Expected: 64 tests, 64 pass, 0 fail.

```bash
cd /tmp && rm -rf fencetest && mkdir fencetest && cd fencetest
printf '{"groups":["fonts"]}' > design.config.json
node -e '
  const { blockFor } = await import("/Users/rob/git/robertblust/design/lib/fences.mjs");
  const fs = await import("node:fs");
  const b = blockFor("design tokens","page").replace(/· v\d+ ·/, "· v1 ·");
  fs.writeFileSync("index.html", ["<style>","  body{}",b,"</style>"].join("\n"));
' --input-type=module
node /Users/rob/git/robertblust/design/bin/design.mjs sync --check; echo "  exit $?  (1 expected)"
node /Users/rob/git/robertblust/design/bin/design.mjs sync
node /Users/rob/git/robertblust/design/bin/design.mjs sync --check; echo "  exit $?  (0 expected)"
```

Expected: the first check names `index.html  design tokens is v1, this release ships v4` and exits
1; the sync rewrites it; the second check exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add lib/sync.mjs bin/design.mjs test/sync-fences.test.mjs
git commit -m "Sync and check fenced blocks beside the whole files"
```

---

### Task 4: Document the fence contract, and release v0.2.0

**Files:**
- Modify: `/Users/rob/git/robertblust/design/README.md`
- Modify: `/Users/rob/git/robertblust/design/package.json` (version → `0.2.0`)

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: tag `v0.2.0` on `github.com/robertblust/design`. Tasks 5–7 install it.

- [ ] **Step 1: Add a fences section to the README**

After the existing "In a site" section, add one explaining, in the README's plain-prose voice:

- a fence is a pair of comment markers the page already carries, and the package owns everything
  between and including them — prose, version and CSS;
- editing a fenced block inside a page does nothing, because the next `npm run design` overwrites
  it; the place to change it is `blocks/` in this repository;
- the `design tokens` fence takes a variant word on its opening line, `page` or `deck`, because a
  prose page closes its `:root` inside the fence and a deck leaves it open for tokens of its own.
  That word is how the tool knows which form to emit, and it is not guessed;
- a site opts a page in by putting the markers in it; there is no list of pages to maintain;
- taking a block out of the package means deleting its fence from the page — a visible decision to
  own and diverge, not a way to clear a red check.

- [ ] **Step 2: Bump the version and run the full suite**

```bash
cd /Users/rob/git/robertblust/design
npm version 0.2.0 --no-git-tag-version
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm pack --dry-run 2>&1 | grep -E "blocks/|versions.json|total files"
```

Expected: 64 passing; the tarball listing includes `blocks/tokens.css`, `blocks/header.css`,
`blocks/stage.css` and `versions.json`, and still no `test/`.

- [ ] **Step 3: Commit, tag and release**

```bash
cd /Users/rob/git/robertblust/design
git add README.md package.json
git commit -m "Release 0.2.0 — the package now owns three fenced blocks"
git push
gh run list --limit 3
```

Watch the CI run by its id (`gh run watch <id> --exit-status --compact`) — `gh run watch` with no
id fails non-interactively. Do not tag a red commit. Then:

```bash
git tag v0.2.0 && git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0 — the three fenced blocks" --notes-file <a file you write>
```

The notes must say, because Dependabot renders them into the pull request it opens in three
repositories and that PR is the only thing telling someone there what changed:

- the package now rewrites `design tokens`, `header contract` and `stage contract` in place;
- **`design:check` will go red in all three sites** until someone runs `npm run design` and commits;
- the diff will touch fence comment lines only — no CSS declaration changes anywhere;
- the token fence gains a variant word, `page` or `deck`, on its opening line;
- after `npm run design`, run `npm run og` too, since changing a page changes its share card.

- [ ] **Step 4: Verify the release installs**

```bash
cd /tmp && rm -rf v2check && mkdir v2check && cd v2check
npm init -y > /dev/null
npm install --save-dev "github:robertblust/design#v0.2.0"
node -e '
  const { FENCE_NAMES, blockFor } = await import("@robertblust/design/fences");
  console.log("  fences:", FENCE_NAMES.join(", "));
  console.log("  token variants differ by:", blockFor("design tokens","page").split("\n").length
    - blockFor("design tokens","deck").split("\n").length, "line");
' --input-type=module
```

Expected: `fences: design tokens, header contract, stage contract` and `differ by: 1 line`.
The `"./fences"` entry in the `exports` map was added in Task 2, Step 6.

---

### Task 5: blust.ch adopts — and the tripwire fires for the first time

**Files:**
- Modify: `/Users/rob/git/robertblust/robertblust.github.io/package.json`, `package-lock.json`
- Modify: 8 HTML files under `/Users/rob/git/robertblust/robertblust.github.io` (by the tool) —
  **15 fences**: `design tokens` ×8, `header contract` ×6, `stage contract` ×1

**Interfaces:**
- Consumes: `@robertblust/design@v0.2.0`.
- Produces: nothing other tasks consume.

**No script and no CI change.** `design` and `design:check` already exist and already run in CI.
That is the point of routing fences through the same commands: adopting a whole new *kind* of
shared thing costs a version bump.

- [ ] **Step 1: Branch, and see the check go red before you change anything**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
git checkout -b adopt-fences
npm install --save-dev "github:robertblust/design#v0.2.0"
npm run design:check; echo "  exit $?  (1 expected)"
```

Expected: **exit 1**, naming each page whose `design tokens` fence says `v3` where the release
ships `v4`, and likewise `header contract` and `stage contract`. This is the tripwire working —
record the output for the pull request body.

If it exits 0, stop and report BLOCKED: either the install did not take or the fences are not
being found, and everything after this rests on it.

- [ ] **Step 2: Sync, and prove no CSS moved**

```bash
npm run design
git diff --stat
```

Then the gate. **Only fence comment lines may have changed; not one CSS declaration may move:**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
git diff -U0 | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/|^[+-]\s*[A-Za-z(].*[^;{}]$" \
  | grep -E ":|{|}" | sort -u
```

Expected: **no output.** Every changed line is inside a comment. If a line containing a CSS
declaration appears, the rewriter changed what the page renders — stop and report BLOCKED.

Belt and braces, compare the computed token values rather than the source:

```bash
node -e '
  const fs = await import("node:fs");
  const decls = f => (fs.readFileSync(f,"utf8").match(/--[a-z-]+:\s*[^;]+;/g) || []).join("\n");
  const { execSync } = await import("node:child_process");
  for (const f of ["index.html","model/index.html","talks/mental-model/index.html"]) {
    const before = execSync(`git show HEAD:${f}`).toString();
    const b = (before.match(/--[a-z-]+:\s*[^;]+;/g) || []).join("\n");
    console.log(`  ${decls(f) === b ? "✓" : "✗"} ${f}`);
  }
' --input-type=module
```

Expected: three `✓`.

- [ ] **Step 3: Confirm the deck kept its open brace**

The deck variant must not have gained a closing `}`:

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
for f in talks/mental-model/index.html talks/essential-complexity/index.html; do
  n=$(grep -n "end design tokens" $f | cut -d: -f1)
  printf "%-46s line before end marker: %s\n" "$f" "$(sed -n "$((n-1))p" $f | tr -d ' ')"
done
```

Expected: neither prints a bare `}`. A `}` here means the deck was emitted as a page and its own
`--warn`/`--slab`/`--lcd` tokens now sit outside `:root`.

- [ ] **Step 4: Check, regenerate the cards, and run the suite**

```bash
npm run design:check          # expect: ✓ … exit 0
npm run og:check              # expect: stale cards, because pages changed
npm run og                    # regenerate
npm run og:check              # expect: clean
lsof -ti:8000 | xargs -r kill 2>/dev/null
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 2 && npm run verify
kill %1
```

Expected: `design:check` exits 0; `npm run verify` passes every page. The `tokenVersion` check
reads the marker off the page and compares it with `verify/design.mjs`'s `TOKEN_VERSION`, which
still says `v3` — **so `verify` is expected to FAIL here.** That is Task 8's job; note the failure
and continue. If `verify` fails for any *other* reason, stop.

- [ ] **Step 5: Commit and open the pull request**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
git add package.json package-lock.json $(git diff --name-only | grep '\.html$') \
        $(git status --porcelain | grep -E 'og\.(png|sha)$' | awk '{print $2}')
git commit -m "Take the three fenced blocks from @robertblust/design v0.2.0"
git push -u origin adopt-fences
```

Do **not** open the pull request yet — Task 8 lands on this same branch and the suite is red until
it does.

---

### Task 6: companygraph.io adopts

**Files:**
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/package.json`, `package-lock.json`
- Modify: 7 HTML files (by the tool) — **15 fences**: `design tokens` ×7, `header contract` ×6,
  `stage contract` ×2

**Interfaces:** consumes `@robertblust/design@v0.2.0`; produces nothing other tasks consume.

Identical in shape to Task 5. Repeated in full rather than referenced, because tasks may be read
out of order.

- [ ] **Step 1a: Declare the variant word on every `design tokens` fence — BEFORE anything else**

This step was missing from an earlier draft and the plan does not work without it. `planFences`
throws a `FenceError` — **exit 2, not 1** — when a `design tokens` fence declares no variant, and
**no page declares one yet**: they all still read `· keep in step across every repository that
shares them`. So `design:check` aborts on the first page it finds rather than reporting drift, and
the tool cannot bootstrap itself.

Edit each page's `design tokens` opening line so the word after the version is the variant. It is a
one-word prose edit inside a comment — change no CSS, and do not touch the version number, which
the sync will move from `v3` to `v4`:

```
  /* ─── design tokens · v3 · page ───────────────────────────────────────
  /* ─── design tokens · v3 · deck ───────────────────────────────────────
```

Which page gets which is decided by one thing: **a deck leaves its `:root` open** and declares
`--warn`, `--slab` and `--lcd` after the end marker, while a prose page closes the brace inside the
fence. Confirm rather than assume:

```bash
find . -name '*.html' -not -path './node_modules/*' -not -path './.git/*' \
  -exec grep -l "design tokens · v" {} \; | while read f; do
    n=$(grep -n "end design tokens" "$f" | cut -d: -f1)
    prev=$(sed -n "$((n-1))p" "$f" | tr -d ' ')
    [ "$prev" = "}" ] && v=page || v=deck
    printf "  %-38s -> %s\n" "$f" "$v"
  done
```

For this site that is **6 `page` and 1 `deck`** — the deck is `talks/intro/index.html`.

Only then run Step 1's `design:check` and expect exit 1.

- [ ] **Step 1: Branch, and see the check go red**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
git checkout -b adopt-fences
npm install --save-dev "github:robertblust/design#v0.2.0"
npm run design:check; echo "  exit $?  (1 expected)"
```

Expected: exit 1, naming the stale fences. Record the output. If it exits 0, stop and report
BLOCKED.

- [ ] **Step 2: Sync, and prove no CSS moved**

```bash
npm run design
git diff --stat
git diff -U0 | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/|^[+-]\s*[A-Za-z(].*[^;{}]$" \
  | grep -E ":|{|}" | sort -u
```

Expected: **no output** from the last command. Any CSS line means stop and report BLOCKED.

- [ ] **Step 3: Confirm the deck kept its open brace**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
n=$(grep -n "end design tokens" talks/intro/index.html | cut -d: -f1)
sed -n "$((n-1))p" talks/intro/index.html | tr -d ' '
```

Expected: not a bare `}`.

- [ ] **Step 4: Check, regenerate the cards, run the suite**

```bash
npm run design:check          # expect ✓, exit 0
npm run og:check              # expect stale
npm run og
npm run og:check              # expect clean
lsof -ti:8000 | xargs -r kill 2>/dev/null
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 2 && npm run verify
kill %1
```

`verify` is expected to fail on `tokenVersion` only, for the same reason as Task 5 — the suite's
`TOKEN_VERSION` still says `v3`. Task 8 fixes it. Any other failure means stop.

- [ ] **Step 5: Commit and push, no pull request yet**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
git add package.json package-lock.json $(git diff --name-only | grep '\.html$') \
        $(git status --porcelain | grep -E 'og\.(png|sha)$' | awk '{print $2}')
git commit -m "Take the three fenced blocks from @robertblust/design v0.2.0"
git push -u origin adopt-fences
```

---

### Task 7: guestgraph.io adopts

**Files:**
- Modify: `/Users/rob/git/guestgraph/guestgraph.github.io/package.json`, `package-lock.json`
- Modify: 5 HTML files (by the tool) — **9 fences**: `design tokens` ×5, `header contract` ×4,
  `stage contract` ×0

**Interfaces:** consumes `@robertblust/design@v0.2.0`; produces nothing other tasks consume.

This site has no `stage contract` fence — it draws no graph. It has `design tokens` on all five
pages and `header contract` on four. That asymmetry is correct and needs no configuration: the
tool rewrites the fences it finds.

- [ ] **Step 1a: Declare the variant word on every `design tokens` fence — BEFORE anything else**

This step was missing from an earlier draft and the plan does not work without it. `planFences`
throws a `FenceError` — **exit 2, not 1** — when a `design tokens` fence declares no variant, and
**no page declares one yet**: they all still read `· keep in step across every repository that
shares them`. So `design:check` aborts on the first page it finds rather than reporting drift, and
the tool cannot bootstrap itself.

Edit each page's `design tokens` opening line so the word after the version is the variant. It is a
one-word prose edit inside a comment — change no CSS, and do not touch the version number, which
the sync will move from `v3` to `v4`:

```
  /* ─── design tokens · v3 · page ───────────────────────────────────────
  /* ─── design tokens · v3 · deck ───────────────────────────────────────
```

Which page gets which is decided by one thing: **a deck leaves its `:root` open** and declares
`--warn`, `--slab` and `--lcd` after the end marker, while a prose page closes the brace inside the
fence. Confirm rather than assume:

```bash
find . -name '*.html' -not -path './node_modules/*' -not -path './.git/*' \
  -exec grep -l "design tokens · v" {} \; | while read f; do
    n=$(grep -n "end design tokens" "$f" | cut -d: -f1)
    prev=$(sed -n "$((n-1))p" "$f" | tr -d ' ')
    [ "$prev" = "}" ] && v=page || v=deck
    printf "  %-38s -> %s\n" "$f" "$v"
  done
```

For this site that is **4 `page` and 1 `deck`** — the deck is `talks/intro/index.html`.

Only then run Step 1's `design:check` and expect exit 1.

- [ ] **Step 1: Branch, and see the check go red**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
git checkout -b adopt-fences
npm install --save-dev "github:robertblust/design#v0.2.0"
npm run design:check; echo "  exit $?  (1 expected)"
```

Expected: exit 1, naming stale `design tokens` and `header contract` fences and **no
`stage contract`**. Record the output. If it exits 0, stop and report BLOCKED.

- [ ] **Step 2: Sync, and prove no CSS moved**

```bash
npm run design
git diff --stat
git diff -U0 | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/|^[+-]\s*[A-Za-z(].*[^;{}]$" \
  | grep -E ":|{|}" | sort -u
```

Expected: **no output**. Any CSS line means stop and report BLOCKED.

- [ ] **Step 3: Confirm the deck kept its open brace**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
n=$(grep -n "end design tokens" talks/intro/index.html | cut -d: -f1)
sed -n "$((n-1))p" talks/intro/index.html | tr -d ' '
```

Expected: not a bare `}`.

- [ ] **Step 4: Check, regenerate the cards, run the suite**

```bash
npm run design:check          # expect ✓, exit 0
npm run og:check
npm run og
npm run og:check
lsof -ti:8000 | xargs -r kill 2>/dev/null
python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 2 && npm run verify
kill %1
```

`verify` is expected to fail on `tokenVersion` only. Any other failure means stop.

- [ ] **Step 5: Commit and push, no pull request yet**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
git add package.json package-lock.json $(git diff --name-only | grep '\.html$') \
        $(git status --porcelain | grep -E 'og\.(png|sha)$' | awk '{print $2}')
git commit -m "Take the three fenced blocks from @robertblust/design v0.2.0"
git push -u origin adopt-fences
```

---

### Task 8: Retire the habit the fences no longer need

**Files:**
- Modify: `verify/design.mjs` in all three sites (byte-identical; the same edit three times)
- Modify: `.github/dependabot.yml` in all three sites

**Interfaces:** consumes nothing; produces nothing.

`verify/design.mjs` holds `TOKEN_VERSION = "v3"` and a `tokenVersion` check that fetches each page
and compares its marker. That check exists because nothing could tell you a *sibling repository*
was behind. Now something can: `design:check` compares the block itself, byte for byte, against
the one source. The version comparison is the weaker of the two and is now failing for a reason
that is not a defect.

The file's own opening comment says this out loud — *"Across repositories the check is deliberate
rather than automatic … That part is a habit, and this comment is the reminder."* That paragraph
is what this task deletes.

- [ ] **Step 1: Update `TOKEN_VERSION` and rewrite the habit paragraph**

In each of the three `verify/design.mjs` files — they are byte-identical and must stay so — make
the same two edits:

1. `export const TOKEN_VERSION = "v3";` becomes `export const TOKEN_VERSION = "v4";`
2. Replace the opening paragraph that begins *"Across repositories the check is deliberate rather
   than automatic"* with one saying that the token, header and stage blocks are now generated from
   `@robertblust/design` and asserted byte-for-byte by `design:check`, so `tokenVersion` is no
   longer the tripwire — it is a second, cheaper opinion that catches a page the sync never
   visited. Keep `FOOTER_VERSION` and its paragraph exactly as they are: the deck footer is **not**
   in the package yet, so its habit is still real and still the only thing there is.

Then prove the three files are still identical:

```bash
md5 -q /Users/rob/git/robertblust/robertblust.github.io/verify/design.mjs \
       /Users/rob/git/companygraph/companygraph.github.io/verify/design.mjs \
       /Users/rob/git/guestgraph/guestgraph.github.io/verify/design.mjs | sort -u | wc -l
```

Expected: `1`.

- [ ] **Step 1b: Retire the intra-repo "token blocks in circulation" check**

Also missing from an earlier draft. Each site's `verify/check.mjs` carries a block (search for
`different token blocks are in circulation`) that fetches every page in `PAGES`, slices from the
`design tokens` fence through `--c-path:#……;`, and asserts every page's slice is identical. It now
fails legitimately, and reporting **`2 different token blocks are in circulation`** is the correct
answer to the question it asks — the variant word `page`/`deck` sits on the opening line, inside
the slice, so the two forms differ there by design.

Do not teach it to group by variant. **Delete it**, and say why in the commit.

Its own comment explains what it was for: *"The token block is a copy on every page, and until now
only its version was checked… Compared against each other rather than a recorded hash, because a
hash is a second thing to keep in step and would drift the same way."* It compared pages to each
other because there was no single source to compare them against. There is one now, and
`design:check` compares every page's fence **byte for byte against it** — strictly stronger than
pages agreeing with one another, and it sees the two variants correctly because the package emits
them. Keeping both would mean maintaining a weaker check that has to be taught about every variant
the stronger one already handles.

This is the same reasoning that demotes `TOKEN_VERSION` in the next step, applied to the other
half of the same habit.

- [ ] **Step 2: Run all three suites green**

For each site in turn, with port 8000 free between runs:

```bash
lsof -ti:8000 | xargs -r kill 2>/dev/null
cd <site> && python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 2 && npm run verify
kill %1
```

Expected: all three pass every page, including `tokenVersion`.

- [ ] **Step 3: Group the design package's own updates in each site**

Each site's `.github/dependabot.yml` already has a `design` group. Nothing to change — confirm it:

```bash
for r in /Users/rob/git/robertblust/robertblust.github.io \
         /Users/rob/git/guestgraph/guestgraph.github.io \
         /Users/rob/git/companygraph/companygraph.github.io; do
  grep -A2 "design:" $r/.github/dependabot.yml | head -3
done
```

Expected: each prints a `design:` group with `patterns: ["@robertblust/design"]`. If one is
missing, add it before the `minor-and-patch` group — first match wins.

- [ ] **Step 4: Commit in each site, on the same `adopt-fences` branch**

```bash
cd <site>
git add verify/design.mjs
git commit -m "The fences are checked byte-for-byte now, so the version is a second opinion"
git push
```

- [ ] **Step 5: Open all three pull requests**

Now the suites are green, open them. **Do not use `--fill`** — it takes the body from the commit
body and these commits have single-line messages, which yields an empty description. Write each
body yourself, carrying:

- the **red `design:check` output from Step 1 of that site's adoption task**, pasted as real
  output — that is the tripwire firing for the first time and it is the thing worth showing;
- the statement that no CSS declaration changed, with the command that proves it;
- what the token fence's new variant word is for;
- that `tokenVersion` is now a second opinion rather than the tripwire.

```bash
gh pr create --title "Take the three fenced blocks from @robertblust/design v0.2.0" \
             --body-file <a body file you write>
```

Stop at the open pull request. **Do not merge** without an explicit go-ahead.

---

## Done when

- `robertblust/design` is tagged `v0.2.0`, and its `blocks/` holds the only copy of the three
  contracts.
- **39 fences across 20 pages in three repositories have one source**: `design tokens` ×20,
  `header contract` ×16, `stage contract` ×3 — which is 15 fences on blust.ch (8 pages), 15 on
  companygraph.io (7 pages) and 9 on guestgraph.io (5 pages).
- Every one of those pages' fences is byte-identical to what the package ships, asserted by
  `design:check` in CI — not by anyone remembering that two sibling repositories exist.
- No CSS declaration changed anywhere, proven per site by the command in each adoption task.
- The deck token blocks still leave `:root` open; the prose ones still close it.
- Three pull requests open, green, unmerged.

## Not in this plan

Named so they are not attempted:

- **The deck footer** (4 decks, no end fence). Not a reconciliation: the fence holds a lockup
  contract that has *not* drifted (two forms, each byte-identical) bundled with a transport bar
  that has (four forms). Cutting it in two is a rendering change to every deck and the transport
  half belongs with the runtime and markup it is part of — **plan 4**.
- **The language and storage block** (20 pages, two dialects, needs a per-site `langKey` and a
  shared `FAMILY` constant) — **plan 3**.
- **The prose typography kit** (16 pages; 54 common lines to be carved out of 57–150, which means
  deciding what is shared before a tool can help) — **plan 5**.
- **The `<head>`** — meta and JSON-LD. Per the spec's third clause it is never generated; only its
  *shape* is shared, as an assertion. That is plan 3's `head.mjs`.
- `verify/design.mjs` still exists three times. Making it one import is tier 3.
