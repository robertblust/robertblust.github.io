# Deck PDF Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the deck PDF exporter's machinery into `@robertblust/design`, leaving each site a
deck list and a call, without changing a single rendered PDF page.

**Architecture:** The package gains `decks/export.mjs` and one export subpath, `./decks/export`.
It imports neither Playwright nor pdf-lib — the site hands both in, exactly as `cards/export.mjs`
takes a `chromium`. Each site's `export-pdf.mjs` becomes the deck list plus the call, and sits at
the repository root on all three.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict`. Playwright and pdf-lib stay
site-side. `pymupdf` is used only as a local measuring tool for the proof and is added to nothing.

**Spec:** [`docs/superpowers/specs/2026-09-02-deck-pdf-harness-design.md`](../specs/2026-09-02-deck-pdf-harness-design.md)

## Global Constraints

- **`@robertblust/design` gains no dependencies.** It has none, three sites install it, and every
  transitive dependency it took would land in all three. Its CI has no `npm ci` step for exactly
  this reason, and the tests below must keep that true — the browser and `PDFDocument` in tests
  are fakes, never the real libraries.
- **No PDF page may change.** Eight files across three sites. Page count and per-page pixel hash
  identical before and after, by the method in each site's task.
- **Never compare the PDF files themselves.** A re-render writes a new `/CreationDate` and `/ID`,
  so `git status` reports all eight modified whatever happened, and a byte comparison always
  fails. That report is not evidence in either direction.
- **Sites pin an exact tag**, never a commit SHA, never a `#semver:` range. This is about the npm
  dependency only.
- **Merge with `gh pr merge --merge`, never `--squash`.** Author is `robert.blust@flatland.ch`.
  Stage by name; never `git add -A`.
- **`npm run pdf` runs in no CI workflow on any site**, and this plan adds no workflow step. The
  proof is done locally, by hand, and recorded in each pull request.

## File Structure

**In `robertblust/design` (new):** `decks/export.mjs`, `test/decks-export.test.mjs`.
**Modified:** `package.json` (`files`, `exports`, `version`).

**In each of the three sites:** `export-pdf.mjs` — rewritten, and on companygraph.io and
guestgraph.io `git mv`d from `talks/intro/` to the root. `package.json` — the `pdf` script path
and the design pin.

## Interfaces

```js
// @robertblust/design/decks/export
export function validate(decks)   // throws on an unknown or missing key; returns nothing
export async function exportDecks({ chromium, PDFDocument, root, decks,
                                    log = console.log, write = writeFileSync })
```

`decks` is `[{ dir, slug }]` — `dir` is the deck folder relative to `root`, `slug` names the
output file, because the two differ: guestgraph's deck lives in `talks/intro/` and its PDFs are
`guestgraph-de.pdf` and `guestgraph-en.pdf`.

**One deliberate deviation from the spec.** The spec wrote the signature as
`exportDecks({ root, decks }, { chromium, PDFDocument })` — data in one argument, collaborators in
another. This plan uses a single flat object instead, because `exportCards({ chromium, recipe,
log })` in the same package already does, and two neighbouring exports that disagree about their
own calling convention is a worse cost than the tidiness of the split. Same arguments, one object.

---

### Task 1: The package gains the harness

**Files:**
- Create: `decks/export.mjs`, `test/decks-export.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `validate(decks)` and `exportDecks({...})` at `@robertblust/design/decks/export`.

Work in `~/git/robertblust/design`, on a branch off `main`.

- [ ] **Step 1: Write the failing test**

Create `test/decks-export.test.mjs`. The fake browser and its in-flight guard are copied in shape
from `test/cards-export.test.mjs` — read that file first; it explains why the recorder resolves on
a later tick rather than recording in source order, and the reasoning applies here unchanged.

```js
// exportDecks against a fake browser and a fake PDFDocument, never Playwright and never pdf-lib.
// The package has no dependencies and must not gain one for its own tests.
//
// Unlike cards/export.mjs, this module is not a union of three drifted copies: the three
// exporters it replaces were behaviourally identical. So these tests assert the contract the
// three shared — the viewport, the waits, the hide rule, the per-slide toggle, the output path —
// because that shared behaviour is exactly what a shared harness can now quietly lose.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { exportDecks, validate } from "../decks/export.mjs";

const ROOT = "/tmp/a-site-that-is-never-read";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function harness({ slides = 3 } = {}) {
  const calls = [];
  const logs = [];
  const written = [];
  let inFlight = null;
  const record = async (...entry) => {
    if (inFlight) throw new Error(`${entry[0]} began while ${inFlight} was still in flight — a missing await`);
    inFlight = entry[0];
    await tick();
    inFlight = null;
    calls.push(entry);
  };
  // Every method that returns a value must `await record(...)` before returning it. Returning a
  // value beside an un-awaited record leaves `inFlight` set into the next call, and the guard
  // then reports a missing await that is not there — the fake failing, not the code.
  const page = {
    goto: (u, o) => record("goto", u, o),
    evaluate: async (f, arg) => { await record("eval", String(f), arg); return slides; },
    addStyleTag: (o) => record("style", o.content),
    waitForTimeout: (ms) => record("wait", ms),
    screenshot: async (o) => { await record("shot", o); return Buffer.from("png"); },
    close: () => record("closePage"),
  };
  const browser = {
    newPage: async (o) => { await record("newPage", o); return page; },
    close: () => record("closeBrowser"),
  };
  const chromium = { launch: async () => { await record("launch"); return browser; } };
  const PDFDocument = {
    create: async () => {
      const pages = [];
      return {
        embedPng: async (buf) => ({ png: buf.toString() }),
        addPage: (size) => { const p = { size, drawn: null }; pages.push(p);
                             return { drawImage: (img, box) => { p.drawn = { img, box }; } }; },
        save: async () => { written.push(pages); return Buffer.from(`pdf:${pages.length}`); },
      };
    },
  };
  const files = [];
  return { calls, logs, written, files, chromium, PDFDocument,
           log: (m) => logs.push(m), write: (file, buf) => files.push({ file, buf }) };
}

test("a deck with an unknown key is rejected rather than silently ignored", () => {
  assert.throws(() => validate([{ dir: "talks/intro", slug: "intro", scale: 2 }]),
                /unknown key "scale"/);
});

test("a deck missing dir or slug is rejected", () => {
  assert.throws(() => validate([{ dir: "talks/intro" }]), /missing "slug"/);
  assert.throws(() => validate([{ slug: "intro" }]), /missing "dir"/);
});

test("one deck, two languages: the page is opened once and a PDF written per language", async () => {
  const h = harness({ slides: 3 });
  const written = await exportDecks({
    chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
    decks: [{ dir: "talks/intro", slug: "guestgraph" }], log: h.log, write: h.write,
  });
  assert.deepEqual(written.map((w) => path.relative(ROOT, w.file)),
                   ["talks/intro/guestgraph-de.pdf", "talks/intro/guestgraph-en.pdf"]);
  assert.deepEqual(written.map((w) => w.pages), [3, 3]);
  assert.equal(h.calls.filter((c) => c[0] === "newPage").length, 1);
});

test("the frame is 1280x720 at deviceScaleFactor 2, and the clip matches it", async () => {
  const h = harness({ slides: 1 });
  await exportDecks({ chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
                      decks: [{ dir: "talks/intro", slug: "g" }], log: h.log, write: h.write });
  const [, opts] = h.calls.find((c) => c[0] === "newPage");
  assert.deepEqual(opts, { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const [, clip] = h.calls.find((c) => c[0] === "shot");
  assert.deepEqual(clip, { type: "png", clip: { x: 0, y: 0, width: 1280, height: 720 } });
});

test("the deck is loaded from file:// under root, by dir and not by slug", async () => {
  const h = harness({ slides: 1 });
  await exportDecks({ chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
                      decks: [{ dir: "talks/intro", slug: "guestgraph" }], log: h.log, write: h.write });
  const [, url, opts] = h.calls.find((c) => c[0] === "goto");
  assert.equal(url, pathToFileURL(path.join(ROOT, "talks/intro", "index.html")).href);
  assert.deepEqual(opts, { waitUntil: "networkidle" });
});

test("the hide rule hides the transport, the bar and the notes, and nothing else", async () => {
  const h = harness({ slides: 1 });
  await exportDecks({ chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
                      decks: [{ dir: "talks/intro", slug: "g" }], log: h.log, write: h.write });
  const [, css] = h.calls.find((c) => c[0] === "style");
  assert.ok(css.includes(".transport,.bar,.notes{display:none!important}"));
  assert.ok(css.includes(".slide.active > *{animation:none!important}"));
  // .chrome and .name are deliberately absent: hiding the whole bar took the byline off every
  // printed page, and that regression is invisible in a PDF nobody opens.
  assert.ok(!css.includes(".chrome"));
  assert.ok(!css.includes(".name"));
});

test("400ms settles the language switch and 500ms settles each slide", async () => {
  const h = harness({ slides: 2 });
  await exportDecks({ chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
                      decks: [{ dir: "talks/intro", slug: "g" }], log: h.log, write: h.write });
  const waits = h.calls.filter((c) => c[0] === "wait").map((c) => c[1]);
  // per language: one 400 after the toggle, then one 500 per slide
  assert.deepEqual(waits, [400, 500, 500, 400, 500, 500]);
});

test("two decks are walked in order, each on its own page, and the browser closes once", async () => {
  const h = harness({ slides: 1 });
  const written = await exportDecks({
    chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
    decks: [{ dir: "talks/mental-model", slug: "mental-model" },
            { dir: "talks/essential-complexity", slug: "essential-complexity" }],
    log: h.log, write: h.write,
  });
  assert.deepEqual(written.map((w) => path.relative(ROOT, w.file)), [
    "talks/mental-model/mental-model-de.pdf",
    "talks/mental-model/mental-model-en.pdf",
    "talks/essential-complexity/essential-complexity-de.pdf",
    "talks/essential-complexity/essential-complexity-en.pdf",
  ]);
  assert.equal(h.calls.filter((c) => c[0] === "newPage").length, 2);
  assert.equal(h.calls.filter((c) => c[0] === "closePage").length, 2);
  assert.equal(h.calls.filter((c) => c[0] === "closeBrowser").length, 1);
});

test("every page drawn is the full frame at the origin", async () => {
  const h = harness({ slides: 2 });
  await exportDecks({ chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
                      decks: [{ dir: "talks/intro", slug: "g" }], log: h.log, write: h.write });
  for (const pages of h.written) {
    assert.equal(pages.length, 2);
    for (const p of pages) {
      assert.deepEqual(p.size, [1280, 720]);
      assert.deepEqual(p.drawn.box, { x: 0, y: 0, width: 1280, height: 720 });
    }
  }
});

test("each written file is logged with its slide count", async () => {
  const h = harness({ slides: 4 });
  await exportDecks({ chromium: h.chromium, PDFDocument: h.PDFDocument, root: ROOT,
                      decks: [{ dir: "talks/intro", slug: "g" }], log: h.log, write: h.write });
  assert.deepEqual(h.logs, ["  ✓ talks/intro/g-de.pdf  (4 slides)",
                            "  ✓ talks/intro/g-en.pdf  (4 slides)"]);
});
```

- [ ] **Step 2: Run the tests and watch them fail**

```bash
cd ~/git/robertblust/design && node --test test/decks-export.test.mjs
```

Expected: every test fails with `Cannot find module '../decks/export.mjs'`. If any test passes,
something else is on that path — stop and find out what.

- [ ] **Step 3: Write `decks/export.mjs`**

This is `export-pdf.mjs` from blust.ch with `root` and `decks` taken as arguments, the writes
collected into a return value, and `writeFileSync` kept — the site's exporter has always written
its own files and nothing about this move changes that.

```js
// Render each deck to a 16:9 PDF fallback, one slide per page, in both languages.
//
// Screenshots each slide exactly as shown on screen — dark theme, SVG diagrams — then assembles
// the PNGs into a PDF. What varies between sites is which decks there are and what their files
// are called; that arrives in `decks`. Nothing else varies: all three sites this replaces used
// the same frame, the same waits, the same hide rule and the same clip, which is why this module
// is the three of them and not a union of them.
//
// Playwright and pdf-lib are never imported. The package has no dependencies at all; the site
// owns both and passes them in, the same way cards/export.mjs takes a `chromium`.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const W = 1280, H = 720;
const LANGS = ["de", "en"];

// The vocabulary a deck may use. Borrowed from cards/export.mjs and for the same reason: an
// unknown key is a knob that silently does nothing, and a deck list is edited by hand.
const KNOWN = new Set(["dir", "slug"]);

export function validate(decks) {
  for (const deck of decks) {
    for (const key of Object.keys(deck)) {
      if (!KNOWN.has(key)) {
        throw new Error(`deck ${JSON.stringify(deck)}: unknown key "${key}"`);
      }
    }
    for (const key of KNOWN) {
      if (typeof deck[key] !== "string" || deck[key] === "") {
        throw new Error(`deck ${JSON.stringify(deck)}: missing "${key}"`);
      }
    }
  }
}

// `write` is injected for the same reason `log` is: these tests drive the module with a fake
// browser and must not touch a filesystem to do it. It defaults to the real thing, so every
// caller in the family passes neither.
export async function exportDecks({ chromium, PDFDocument, root, decks,
                                    log = console.log, write = writeFileSync }) {
  validate(decks);
  const written = [];
  const browser = await chromium.launch();
  for (const deck of decks) {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(path.join(root, deck.dir, "index.html")).href,
                    { waitUntil: "networkidle" });
    // Hide the controls, not the credit: .name lives inside .chrome, and hiding the whole
    // bar took the byline off every printed page. A transport in a PDF advertises buttons
    // that do nothing; a byline is the one part of that bar a printed page still wants.
    await page.addStyleTag({ content: `.transport,.bar,.notes{display:none!important}\n     /* a still image should not be waiting out a transition it does not want */\n     .slide.active > *{animation:none!important}` });
    const count = await page.evaluate(() => document.querySelectorAll(".slide").length);

    for (const lang of LANGS) {
      // the decks have no keyboard shortcuts any more — click the transport's language
      // toggle. The rule above hides it, so click it through the DOM, not the pointer.
      await page.evaluate(l => document.getElementById(l === "de" ? "langDe" : "langEn").click(), lang);
      await page.waitForTimeout(400);

      const pdf = await PDFDocument.create();
      for (let i = 0; i < count; i++) {
        await page.evaluate(n => {
          const s = Array.from(document.querySelectorAll(".slide"));
          s.forEach((el, k) => el.classList.toggle("active", k === n));
        }, i);
        await page.waitForTimeout(500);        // let the rise animation settle
        const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
        const img = await pdf.embedPng(png);
        const p = pdf.addPage([W, H]);
        p.drawImage(img, { x: 0, y: 0, width: W, height: H });
      }
      const file = path.join(root, deck.dir, `${deck.slug}-${lang}.pdf`);
      write(file, await pdf.save());
      log(`  ✓ ${path.relative(root, file)}  (${count} slides)`);
      written.push({ file, pages: count });
    }
    await page.close();
  }
  await browser.close();
  return written;
}
```

- [ ] **Step 4: Run the tests and watch them pass**

```bash
node --test test/decks-export.test.mjs
```

Expected: 10 tests, 10 pass, 0 skipped. Then run the whole suite — `npm test` — and confirm
nothing else moved.

- [ ] **Step 5: Prove three of the tests red by mutation**

A test never seen to fail is not yet a gate. Make each change, run, confirm the named test fails,
restore, and record the real counts:

1. Change `deviceScaleFactor: 2` to `1` → *the frame is 1280x720…* fails.
2. Change `waitForTimeout(500)` to `50` → *400ms settles the language switch…* fails.
3. Add `.chrome` to the hide rule → *the hide rule hides the transport…* fails.

- [ ] **Step 6: Ship it in the package**

`package.json`: add `"decks"` to `files` (after `"cards"`), add
`"./decks/export": "./decks/export.mjs"` to `exports` (after the `cards` entries), and set
`"version": "0.14.0"` — a new capability is a minor under this package's own policy.

`versions.json` is **not** touched. It versions the fenced blocks that `design sync` writes;
`cards/` has no entry there either.

- [ ] **Step 7: Confirm the tarball carries it, and no dependency arrived**

```bash
npm pack --dry-run 2>&1 | grep -E "decks/|Tarball|total files"
node -e 'const p=require("./package.json");console.log("deps:",JSON.stringify(p.dependencies||{}),JSON.stringify(p.devDependencies||{}))'
```

`decks/export.mjs` must be listed; both dependency objects must be empty or absent.

- [ ] **Step 8: Exercise it for real, both shapes, before releasing anything**

Spec criterion 5. Fakes prove the contract; they cannot prove that a real deck renders. Tagging a
release that three sites then pin, and only *then* pointing a browser at it, gets the order
backwards — so run it from a **local path install** first, against the two-deck site and a
one-deck site.

```bash
cd ~/git/robertblust/robertblust.github.io          # the two-deck shape
python3 - <<'PY' | tee /tmp/pdf-pre-blust.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
npm install ~/git/robertblust/design --save-dev     # a path, not a tag
```

Then rewrite `export-pdf.mjs` exactly as Task 2 Step 3 will, run `npm run pdf`, and hash again
into `/tmp/pdf-post-blust.txt` with the same snippet. `diff` the two: they must be identical.

Repeat the whole thing against `~/git/guestgraph/guestgraph.github.io` for the one-deck shape,
using its own before/after files.

**Restore both sites completely afterwards** — this is a rehearsal, not the adoption:

```bash
git checkout -- package.json package-lock.json export-pdf.mjs "talks/*/*.pdf"
git status --porcelain     # empty, in both repositories
npm install                # put the pinned release back on disk
```

If either run differs, the harness is wrong and nothing gets tagged. Fix it and repeat this step.

- [ ] **Step 9: Commit, open a PR, wait for green, merge**

```bash
git add decks/export.mjs test/decks-export.test.mjs package.json
git commit -m "The deck PDF exporter becomes a shared harness"
```

The standing merge-and-tag permission covers `robertblust/design`, so this one does not stop.

- [ ] **Step 10: Tag v0.14.0 and write release notes**

Not ceremony: Dependabot renders the notes into the pull request each site gets, and that pull
request is the only thing telling a reader in another repository what changed.

---

### Task 2: blust.ch adopts

**Files:** modify `export-pdf.mjs`, `package.json`

blust.ch is the site whose exporter the harness was taken from, and the only one with two decks.
Do it first: if the harness is wrong, it is most visible here.

- [ ] **Step 1: Baseline the PDFs before touching anything**

```bash
cd ~/git/robertblust/robertblust.github.io
git status --porcelain    # must be clean
python3 - <<'PY' | tee /tmp/pdf-before-blust.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
```

Four files. Keep that output; it is half the proof.

- [ ] **Step 2: Pin the release**

```bash
npm install '@robertblust/design@github:robertblust/design#v0.14.0' --save-dev
node -e 'import("node:fs").then(fs=>console.log(JSON.parse(fs.readFileSync("node_modules/@robertblust/design/package.json")).version))'
```

Use this form, not `npm pkg set` followed by `npm install` — on these repositories that reports
"up to date" and leaves the previous version on disk, because the lockfile pins the old commit.
The `node -e` line is what tells you which version is actually there.

- [ ] **Step 3: Rewrite `export-pdf.mjs`**

```js
// Render each deck to a 16:9 PDF fallback, one slide per page, in both languages.
//
// Usage: npm run pdf
//
// Which decks there are and what their files are called is the only thing that varies between
// this site and its two siblings, so it is the only thing that lives here. The rendering is
// `@robertblust/design/decks/export`; the package imports neither Playwright nor pdf-lib, so
// both are handed in from this file.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportDecks } from "@robertblust/design/decks/export";

await exportDecks({
  chromium,
  PDFDocument,
  root: path.dirname(fileURLToPath(import.meta.url)),
  decks: [
    { dir: "talks/mental-model", slug: "mental-model" },
    { dir: "talks/essential-complexity", slug: "essential-complexity" },
  ],
});
```

`package.json` needs no script change here — `"pdf": "node export-pdf.mjs"` already.

- [ ] **Step 4: Re-render and prove nothing moved**

```bash
npm run pdf
python3 - <<'PY' | tee /tmp/pdf-after-blust.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
diff /tmp/pdf-before-blust.txt /tmp/pdf-after-blust.txt && echo "IDENTICAL"
```

`diff` must print nothing and `IDENTICAL` must appear. **`git status` will report all four PDFs
modified and that is expected** — the new `/CreationDate` and `/ID`. Restore them so the commit
carries no PDF at all:

```bash
git checkout -- talks/mental-model/*.pdf talks/essential-complexity/*.pdf
git status --porcelain     # no .pdf lines
```

- [ ] **Step 5: The other checks**

```bash
npm run design:check && npm run og:check && npm run test:dupes
(python3 -m http.server 8000 >/dev/null 2>&1 &) ; sleep 2; npm run verify; pkill -f "http.server 8000"
```

All green. `og:check` matters here: `export-pdf.mjs` is a root file, and the card recipe walks
what a *page* names, not the repository, so it must stay quiet — if it does not, the recipe is
reading something it should not.

- [ ] **Step 6: Commit, open a PR, stop**

```bash
git add export-pdf.mjs package.json package-lock.json
git commit -m "The deck PDFs render through the shared harness"
```

Put both hash listings in the PR body. Do not merge.

---

### Task 3: companygraph.io adopts

**Files:** `git mv talks/intro/export-pdf.mjs export-pdf.mjs`; modify `export-pdf.mjs`,
`package.json`

- [ ] **Step 1: Baseline**

```bash
cd ~/git/companygraph/companygraph.github.io
git status --porcelain    # must be clean
python3 - <<'PY' | tee /tmp/pdf-before-cg.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
```

Two files: `talks/intro/companygraph-de.pdf` and `-en.pdf`.

- [ ] **Step 2: Pin the release**

```bash
npm install '@robertblust/design@github:robertblust/design#v0.14.0' --save-dev
node -e 'import("node:fs").then(fs=>console.log(JSON.parse(fs.readFileSync("node_modules/@robertblust/design/package.json")).version))'
```

- [ ] **Step 3: Move the file to the root**

```bash
git mv talks/intro/export-pdf.mjs export-pdf.mjs
```

It sits beside `export-og.mjs`, which is already at the root here. A file holding a *list* of
decks does not belong inside one of them.

- [ ] **Step 4: Rewrite it**

```js
// Render the deck to a 16:9 PDF fallback, one slide per page, in both languages.
//
// Usage: npm run pdf
//
// Which decks there are and what their files are called is the only thing that varies between
// this site and its two siblings, so it is the only thing that lives here. The rendering is
// `@robertblust/design/decks/export`; the package imports neither Playwright nor pdf-lib, so
// both are handed in from this file.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportDecks } from "@robertblust/design/decks/export";

await exportDecks({
  chromium,
  PDFDocument,
  root: path.dirname(fileURLToPath(import.meta.url)),
  decks: [{ dir: "talks/intro", slug: "companygraph" }],
});
```

Note `dir` and `slug` differ — the deck is in `talks/intro/` and its files are named for the site.

- [ ] **Step 5: Fix the script**

In `package.json`, `"pdf": "node talks/intro/export-pdf.mjs"` becomes `"pdf": "node export-pdf.mjs"`.
Grep for the old path afterwards and confirm nothing else names it:

```bash
grep -rn "talks/intro/export-pdf" . --exclude-dir=node_modules --exclude-dir=.git || echo "(no references)"
```

- [ ] **Step 6: Re-render and prove nothing moved**

```bash
npm run pdf
python3 - <<'PY' | tee /tmp/pdf-after-cg.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
diff /tmp/pdf-before-cg.txt /tmp/pdf-after-cg.txt && echo "IDENTICAL"
git checkout -- talks/intro/*.pdf
git status --porcelain     # no .pdf lines
```

- [ ] **Step 7: The other checks**

```bash
npm run example:check && npm run design:check && npm run og:check && npm run test:og && npm run test:d3
(python3 -m http.server 8000 >/dev/null 2>&1 &) ; sleep 2; npm run verify; pkill -f "http.server 8000"
```

- [ ] **Step 8: Commit, open a PR, stop**

```bash
git add export-pdf.mjs package.json package-lock.json
git commit -m "The deck PDFs render through the shared harness"
```

`git add` the rename by its new path; `git mv` has already staged the deletion. Put both hash
listings in the PR body. Do not merge.

---

### Task 4: guestgraph.io adopts

**Files:** `git mv talks/intro/export-pdf.mjs export-pdf.mjs`; modify `export-pdf.mjs`,
`package.json`

Identical in shape to Task 3, and the slug is the one thing that differs. The steps are repeated
rather than referenced, because this task may be read on its own.

- [ ] **Step 1: Baseline**

```bash
cd ~/git/guestgraph/guestgraph.github.io
git status --porcelain    # must be clean
python3 - <<'PY' | tee /tmp/pdf-before-gg.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
```

Two files: `talks/intro/guestgraph-de.pdf` and `-en.pdf`.

- [ ] **Step 2: Pin the release**

```bash
npm install '@robertblust/design@github:robertblust/design#v0.14.0' --save-dev
node -e 'import("node:fs").then(fs=>console.log(JSON.parse(fs.readFileSync("node_modules/@robertblust/design/package.json")).version))'
```

- [ ] **Step 3: Move the file to the root**

```bash
git mv talks/intro/export-pdf.mjs export-pdf.mjs
```

- [ ] **Step 4: Rewrite it**

```js
// Render the deck to a 16:9 PDF fallback, one slide per page, in both languages.
//
// Usage: npm run pdf
//
// Which decks there are and what their files are called is the only thing that varies between
// this site and its two siblings, so it is the only thing that lives here. The rendering is
// `@robertblust/design/decks/export`; the package imports neither Playwright nor pdf-lib, so
// both are handed in from this file.
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportDecks } from "@robertblust/design/decks/export";

await exportDecks({
  chromium,
  PDFDocument,
  root: path.dirname(fileURLToPath(import.meta.url)),
  decks: [{ dir: "talks/intro", slug: "guestgraph" }],
});
```

- [ ] **Step 5: Fix the script**

`"pdf": "node talks/intro/export-pdf.mjs"` becomes `"pdf": "node export-pdf.mjs"`.

```bash
grep -rn "talks/intro/export-pdf" . --exclude-dir=node_modules --exclude-dir=.git || echo "(no references)"
```

- [ ] **Step 6: Re-render and prove nothing moved**

```bash
npm run pdf
python3 - <<'PY' | tee /tmp/pdf-after-gg.txt
import pymupdf, hashlib, glob
for f in sorted(glob.glob("talks/*/*.pdf")):
    d = pymupdf.open(f)
    print(f, d.page_count, [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in d])
PY
diff /tmp/pdf-before-gg.txt /tmp/pdf-after-gg.txt && echo "IDENTICAL"
git checkout -- talks/intro/*.pdf
git status --porcelain     # no .pdf lines
```

- [ ] **Step 7: The other checks**

```bash
npm run design:check && npm run og:check && npm run test:og
(python3 -m http.server 8000 >/dev/null 2>&1 &) ; sleep 2; npm run verify; pkill -f "http.server 8000"
```

- [ ] **Step 8: Commit, open a PR, stop**

```bash
git add export-pdf.mjs package.json package-lock.json
git commit -m "The deck PDFs render through the shared harness"
```

Put both hash listings in the PR body. Do not merge.

---

## Final verification

- [ ] All eight PDFs: page count and per-page pixel hash identical before and after, on all three
      sites, with both listings in each pull request. No `.pdf` file is committed by any of the
      three commits.
- [ ] `@robertblust/design` still has **zero dependencies**, and `npm pack --dry-run` lists
      `decks/export.mjs`.
- [ ] `export-pdf.mjs` sits at the repository root on all three sites, and all three
      `package.json` files read `"pdf": "node export-pdf.mjs"`.
- [ ] `npm run dupes` from blust.ch reports **no `export-pdf.mjs` row**, from 49 attributed lines.
- [ ] The package's tests cover both shapes — a one-deck site and a two-deck site — and three of
      them have been seen red by mutation.
- [ ] No CI workflow changed in any of the four repositories.
