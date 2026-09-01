# Shared Check Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `verify/design.mjs` and nineteen check bodies out of three site repositories and into `@robertblust/design`, so that no check body exists in more than one repository.

**Architecture:** The package already ships `STAGE_CHECKS` from `@robertblust/design/verify/stage`, and each site imports it. This plan extends that one pattern twice: `./verify/design` (a verbatim move of a file that is already byte-identical in all three sites) and `./verify/pages` (a factory, because five of the bodies close over the site's own `SITE` and `BASE`). Each site's `check.mjs` keeps its `PAGES`, its `SITE`, and only the checks that are genuinely its own.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict`, Playwright (sites only — the package never imports it).

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md` — tier 3, "imported code", and success criteria 2, 4 and 8.

## Global Constraints

- The package has **zero dependencies and zero devDependencies**. Nothing in this plan may add one. Playwright stays a site devDependency; the browser never crosses into the package.
- Package is Node 22+, ESM, tested with `node:test` and `node:assert/strict`.
- Sites pin an **exact tag**, never a commit SHA — Dependabot's `pinned_ref_looks_like_version?` rejects a SHA.
- A change to any synced file is at least a **minor**; new exports make this release **0.9.0**.
- Merge a pull request with a merge commit — `gh pr merge --merge`, **never `--squash`**. GitHub re-authors squash commits and launders the author.
- Stage files by name; never `git add -A`.
- Commits happen when asked. Opening a PR is not approval to merge.
- **No external assets, anywhere.**
- Never mention closed-source predecessor projects — not in code, docs or commits.
- Every gate must be a check that *can* fail. Prove it by mutation before claiming it works.

## Measurements this plan rests on

Taken 2026-09-01, on `main` of all three sites. Re-derive them if they look wrong; do not trust them blindly.

| Fact | Value |
|---|---|
| `verify/design.mjs` | byte-identical in all three (`c0d4718a`), **472 lines** (450 non-blank) |
| Check bodies identical in all three | **14** — `carriesLang contains footer headerBaseline landing lang links mobileNav navOrder noNewTab sameOrigin sourceLang storageKeys wayOut` (252 lines) |
| Check bodies that differ | **5** — `card internalLinks sameTab seo title` |
| Bodies that stay local | blust.ch: `brandMark transport zeroBased`; companygraph: `fits slides translates`; guestgraph: none |
| Free names the shared bodies use | `SITE` (seo, card), `BASE` (seo), `httpStatus` (seo). `browser` appears only inside a comment. |
| `httpStatus` | byte-identical in all three (`bd90432c`) |
| Longest `<title>` on any of the 16 pages | **55 chars** ("CompanyGraph — an introduction · a talk by Robert Blust") |

**Two of the five "drifted" checks are not drifted.** `seo` is byte-identical in blust.ch and companygraph, and guestgraph's differs only in **two lines of comment** naming its own site. `sameTab` differs only in **line wrapping**. Only `title`, `internalLinks` and `card` carry real differences. The spec expected all five to "fail on adoption"; three will.

## Rulings made while writing this plan

Record these in the ledger; they are decisions, not discoveries.

**Ruling 1 — `title` takes 65, not 70.** The spec says to take "the `seo` and `title` versions the two leading repos already share", which is 70 chars. The spec's own governing principle in the same sentence is "taking the stronger version in each case", and 65 is stronger. Measured: the longest title on any of the sixteen pages is **55 characters**, so 65 passes everywhere with ten characters to spare and 70 would never fire first. Cost if wrong: a future title between 66 and 70 chars fails CI and has to be shortened — which is the check working.

**Ruling 2 — `export-pdf.mjs` and `og-recipe.test.mjs` are not in this plan.** The spec lists both in tier 3 *and* in tier 4. They belong with the harness that uses them, so they land in the tier 4 plan. Cost if wrong: one extra release before they consolidate.

**Ruling 3 — `head.mjs` is not in this plan.** The spec puts it in tier 3, but it is the only item there that is not a move: `seo` today validates JSON-LD *integrity* (that every `@id` referenced is defined), not a per-page-type *shape*, so `head.mjs` is new design work rather than consolidation. It gets its own plan so this one stays a pure move that must diff to nothing. Cost if wrong: criterion 9 waits one plan longer.

**Ruling 4 — `PAGE_CHECKS` is a factory, not an object.** `seo` and `card` close over `SITE` and `BASE`. Passing them per-call would change nineteen signatures to serve two; closing over them once at import keeps every body exactly as it is today, which is what makes this a move rather than a rewrite. Cost if wrong: a second argument later.

---

## File Structure

**Created in `@robertblust/design`:**
- `verify/http.mjs` — `httpStatus(url)`. Node 22's bundled undici asserts `assert(!this.paused)` in `Parser.finish` when a socket ends with an unread response body; this reads and discards the body. One responsibility: ask a URL for its status without crashing the runtime.
- `verify/design.mjs` — moved verbatim from the sites. Exports `TOKEN_VERSION`, `TOKENS`, `SKY`, `SYSTEM_FACES`, `DESIGN_CHECKS`.
- `verify/pages.mjs` — `pageChecks({ SITE, BASE })` returning the nineteen shared check bodies.
- `test/verify-pages.test.mjs` — tests for the factory's shape and for the reconciled bodies.

**Modified in `@robertblust/design`:** `package.json` (three new export paths, version `0.9.0`).

**Deleted from each site:** `verify/design.mjs`, the nineteen check bodies and `httpStatus` from `verify/check.mjs`.

**Modified in each site:** `verify/check.mjs` (imports), `package.json` + `package-lock.json` (pin).

---

## Task 1: `httpStatus` and `design.mjs` move into the package

**Files:**
- Create: `/Users/rob/git/robertblust/design/verify/http.mjs`
- Create: `/Users/rob/git/robertblust/design/verify/design.mjs`
- Modify: `/Users/rob/git/robertblust/design/package.json`
- Test: `/Users/rob/git/robertblust/design/test/verify-exports.test.mjs`

**Interfaces:**
- Produces: `httpStatus(url: string) => Promise<number>` from `@robertblust/design/verify/http`; `DESIGN_CHECKS`, `SYSTEM_FACES`, `TOKENS`, `SKY`, `TOKEN_VERSION` from `@robertblust/design/verify/design`.

- [ ] **Step 1: Copy both files in, unchanged except one import**

```bash
cd /Users/rob/git/robertblust/design
cp /Users/rob/git/robertblust/robertblust.github.io/verify/design.mjs verify/design.mjs
```

`verify/design.mjs` line 44 reads `import { FENCES } from "@robertblust/design/fences";`. Inside the package that is a self-import; change it to a relative path and nothing else:

```js
import { FENCES } from "../lib/fences.mjs";
```

Then extract `httpStatus` from any site's `verify/check.mjs` (all three are byte-identical, `bd90432c`) into `verify/http.mjs` with an export keyword and this comment above it:

```js
// Ask a URL for its status without crashing the runtime. Node 22's bundled undici asserts
// `assert(!this.paused)` in Parser.finish when a socket ends with a response body nobody read,
// and a checker that only wants `.status` never reads one. Measured: 6 of 12 CI runs crashed on
// Node 22.23.2 before this, 0 of 12 after; Node 25 never reproduces it. So the body is read and
// discarded, always.
export async function httpStatus(url) {
```

- [ ] **Step 2: Add the export paths and the version**

In `package.json`, add to `exports` and set the version:

```json
  "version": "0.9.0",
  "exports": {
    ".": "./lib/sync.mjs",
    "./groups": "./lib/groups.mjs",
    "./verify/stage": "./verify/stage.mjs",
    "./verify/design": "./verify/design.mjs",
    "./verify/http": "./verify/http.mjs",
    "./fences": "./lib/fences.mjs",
    "./family": "./lib/family.mjs"
  }
```

- [ ] **Step 3: Write the failing test**

`test/verify-exports.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DESIGN_CHECKS, SYSTEM_FACES, TOKENS, TOKEN_VERSION } from "../verify/design.mjs";
import { httpStatus } from "../verify/http.mjs";
import { FENCES } from "../lib/fences.mjs";

test("the design checks arrive as callables, not as a shape that merely looks right", () => {
  // A `{}` default export would satisfy "is an object" and silently check nothing on every
  // site at once, which is the failure mode that matters when one file feeds three suites.
  const names = Object.keys(DESIGN_CHECKS);
  assert.ok(names.length >= 8, `only ${names.length} design checks`);
  for (const n of names) assert.equal(typeof DESIGN_CHECKS[n], "function", `${n} is not callable`);
});

test("the moved file reads its token version from the package, not from a frozen copy", () => {
  // It used to import FENCES across the package boundary from inside a site. In here that is a
  // self-import; if it is ever replaced by a literal, this drifts silently on the next bump.
  assert.equal(TOKEN_VERSION, FENCES["design tokens"].version);
  assert.match(TOKEN_VERSION, /^v\d+$/);
});

test("the token table is not empty and every value is a string", () => {
  const entries = Object.entries(TOKENS);
  assert.ok(entries.length > 0, "TOKENS is empty");
  for (const [k, v] of entries) assert.equal(typeof v, "string", `${k} is ${typeof v}`);
});

test("SYSTEM_FACES is a Set, so `.has` means what the checks think it means", () => {
  // An array would make `.has` undefined and every font check throw rather than fail.
  assert.ok(SYSTEM_FACES instanceof Set);
  assert.ok(SYSTEM_FACES.size > 0);
});

test("httpStatus reads the body it does not want", () => {
  // The whole point of the helper. If someone simplifies it back to returning r.status without
  // consuming the body, Node 22 crashes intermittently in CI and this test is the warning.
  const src = readFileSync(new URL("../verify/http.mjs", import.meta.url), "utf8");
  assert.match(src, /arrayBuffer\(\)|\.text\(\)|\.body/,
    "httpStatus does not consume the response body");
  assert.equal(typeof httpStatus, "function");
});
```

- [ ] **Step 4: Run it and watch it fail before the export paths exist**

Run: `cd /Users/rob/git/robertblust/design && npm test`
Expected before step 2: FAIL on module resolution. After steps 1–2: PASS, with the suite total risen by 5.

- [ ] **Step 5: Prove the tests are not vacuous**

Temporarily replace `TOKEN_VERSION`'s value with the literal `"v1"` and re-run: the second test must fail with a version mismatch. Change `SYSTEM_FACES` to an array literal and re-run: the fourth must fail. Restore both. Record both results in the ledger — a test that has never been seen red is not a gate.

- [ ] **Step 6: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add verify/http.mjs verify/design.mjs package.json test/verify-exports.test.mjs
git commit -m "Move design.mjs and httpStatus into the package

verify/design.mjs was byte-identical in all three sites (c0d4718a, 370
lines) and verify/check.mjs's httpStatus in all three too (bd90432c). Both
become package exports; the sites take them in the next commit.

The only edit to design.mjs is its FENCES import, which crossed the package
boundary from outside and is now relative. Nothing else changed, which is
what makes this a move rather than a rewrite."
```

---

## Task 2: The three sites import `design.mjs` and `httpStatus`

**Files:**
- Modify: `verify/check.mjs` in all three sites (import lines; delete `httpStatus`)
- Delete: `verify/design.mjs` in all three sites
- Modify: `package.json`, `package-lock.json` in all three sites

**Interfaces:**
- Consumes: `@robertblust/design/verify/design`, `@robertblust/design/verify/http` from Task 1.

This is one task, not three: the same two-line edit in three repositories, reviewed as one diff.

- [ ] **Step 1: Tag and release the package first**

The sites pin a tag, so the tag has to exist before they can take it.

```bash
cd /Users/rob/git/robertblust/design
git push origin main   # main is protected: open a PR, let `test` pass, merge with --merge
git tag -a v0.9.0 -m "0.9.0 — design.mjs and httpStatus move into the package"
git push origin v0.9.0
gh release create v0.9.0 --title "0.9.0 — shared check code, part one" --notes "..."
```

- [ ] **Step 2: Re-pin and swap the imports in each site**

For each of `/Users/rob/git/robertblust/robertblust.github.io`, `/Users/rob/git/companygraph/companygraph.github.io`, `/Users/rob/git/guestgraph/guestgraph.github.io`:

```bash
git checkout -b shared-check-code
npm install "@robertblust/design@github:robertblust/design#v0.9.0" --save-dev
```

`npm install` alone reports "up to date" and does **not** refetch a moved tag; the explicit spec above is required. Verify with:

```bash
node -e "console.log(require('./node_modules/@robertblust/design/package.json').version)"   # 0.9.0
```

In `verify/check.mjs`, replace

```js
import { DESIGN_CHECKS, SYSTEM_FACES } from "./design.mjs";
```

with

```js
import { DESIGN_CHECKS, SYSTEM_FACES } from "@robertblust/design/verify/design";
import { httpStatus } from "@robertblust/design/verify/http";
```

then delete the local `httpStatus` function body and `git rm verify/design.mjs`.

- [ ] **Step 3: Verify each site, including the tripwire**

```bash
python3 -m http.server 8000 &
npm run design:check && npm run verify
```

Expected: `all checks pass`, and `design:check` still reports its fence count. Kill the server between repositories — they all use port 8000.

- [ ] **Step 4: Prove the imported checks actually run**

Deleting a file and importing a name is exactly the change that can silently check nothing. In one site, break a token deliberately — change `--c-mid` in `tokens.css`'s local fence copy to `#ff0000` — and confirm `npm run verify` reports a `tokens:` failure. Restore it. If it passes, the import is not wired and the task is not done.

- [ ] **Step 5: Commit each site**

```bash
git add verify/check.mjs package.json package-lock.json
git rm verify/design.mjs
git commit -m "Import design.mjs and httpStatus from @robertblust/design v0.9.0

472 lines that were byte-identical in three repositories, plus the
httpStatus helper that was identical in three, now have one source.

Verified that the imported checks still fire, not merely resolve: breaking
--c-mid in the local fence copy makes `tokens` fail, and restoring it makes
the suite green again."
```

---

## Task 3: Reconcile the three genuinely drifted checks

**Files:**
- Modify: `verify/check.mjs` in all three sites

Do this **before** moving the bodies, not after: a body cannot move until the three copies agree.

- [ ] **Step 1: `title` — take 65 everywhere**

companygraph and guestgraph carry `70`; blust.ch carries `65`. Take blust.ch's (Ruling 1). In both sibling sites:

```js
    if (t.length > 65) return `title is ${t.length} chars, over 65`;
```

- [ ] **Step 2: Confirm 65 passes before relying on it**

Run `npm run verify` in both siblings. Expected: pass — the longest title anywhere is 55 characters. If anything fails, the measurement was wrong: stop, report the title and its length, and take 70 instead rather than shortening a title to satisfy a check nobody asked for.

- [ ] **Step 3: `internalLinks` — take companygraph's**

blust.ch's and guestgraph's inspect only `a[href]`. companygraph's inspects `[href], [src]` **and** CSS `url()`, which is the drift named at the top of the spec. Copy companygraph's body verbatim into blust.ch and guestgraph:

```js
    const bad = await page.evaluate(() => {
      const out = [...document.querySelectorAll("[href], [src]")]
        .map(el => el.getAttribute("href") || el.getAttribute("src"))
        .filter(v => v && v.startsWith("/"));
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }  // unreadable: not ours
        const css = [...rules].map(r => r.cssText).join("\n");
        for (const m of css.matchAll(/url\(\s*["']?(\/[^"')]*)/g)) out.push(`url(${m[1]})`);
      }
      return out;
    });
    return bad.length ? "root-absolute internal path: " + bad.join(", ") : null;
```

- [ ] **Step 4: Run it and expect failures**

Run `npm run verify` in blust.ch and guestgraph. The spec says to **expect these to fail on adoption** — that is the point, they are finding the bugs listed at the top of the spec. Fix every root-absolute `[src]` or `url()` the check reports by making it relative. Report each one in the ledger; do not weaken the check to make it pass.

- [ ] **Step 5: `card` — take companygraph's, with a site-neutral comment**

blust.ch rewrites the card URL onto `location.origin`, which drops a path prefix. companygraph's and guestgraph's use `spec.cardBase` and `BASE`; those two differ **only** in a comment naming their own site. Use this body in all three, with the comment naming no site:

```js
    const img = await page.evaluate(() =>
      (document.querySelector('meta[property="og:image"]') || {}).content);
    if (!img) return "no og:image";
    const declared = await page.evaluate(() => [
      (document.querySelector('meta[property="og:image:width"]')  || {}).content,
      (document.querySelector('meta[property="og:image:height"]') || {}).content]);
    // Rewrite the card's absolute URL onto whatever is being tested — BASE, not
    // location.origin. An origin carries no path, and a site served under one (a talks
    // subdirectory, say) loses that prefix: a card that serves perfectly then reports
    // "not fetchable" the first time the suite is pointed at production.
    const real = await page.evaluate(async ({ u, base, testBase }) => {
      const r = await fetch(base ? u.replace(base, testBase) : u.replace(/^https:\/\/[^/]+/, testBase));
      if (!r.ok) return null;
      const dv = new DataView(await r.arrayBuffer());
      return [String(dv.getUint32(16)), String(dv.getUint32(20))];   // PNG IHDR
    }, { u: img, base: spec.cardBase, testBase: BASE });
    if (!real) return `${img} is not fetchable`;
    if (real[0] !== declared[0] || real[1] !== declared[1])
      return `card is ${real.join("×")} but declared ${declared.join("×")}`;
    return null;
```

blust.ch is a root site, so it needs no `cardBase` entry in `PAGES` — the `base ?` branch handles its absence. Do not add one.

- [ ] **Step 6: `seo` and `sameTab` — normalise, do not redesign**

`seo` is byte-identical in blust.ch and companygraph; guestgraph's differs only in two comment lines that name guestgraph. Take blust.ch's wording in all three. `sameTab` differs only in line wrapping; take blust.ch's. Confirm afterwards:

```bash
# all five bodies must now hash the same in all three repositories
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/inventory.mjs   # DRIFTED must read 0
```

- [ ] **Step 7: Verify all three sites, then commit each**

```bash
npm run design:check && npm run verify && npm run og:check
git add verify/check.mjs
git commit -m "Reconcile the drifted checks, taking the stronger of each

title: 65 chars everywhere, not 70 — the longest title on any of the sixteen
pages is 55, so the stricter limit passes today with ten to spare.

internalLinks: companygraph's, which inspects [src] and CSS url() as well as
a[href]. This is the drift named at the top of the spec.

card: companygraph's, which rewrites onto BASE rather than location.origin —
an origin carries no path, so a site served under one reported a perfectly
good card as unfetchable.

seo and sameTab were never drifted: seo differed by two comment lines naming
one site, sameTab by line wrapping alone."
```

---

## Task 4: The nineteen bodies move into the package

**Files:**
- Create: `/Users/rob/git/robertblust/design/verify/pages.mjs`
- Create: `/Users/rob/git/robertblust/design/test/verify-pages.test.mjs`
- Modify: `/Users/rob/git/robertblust/design/package.json`

**Interfaces:**
- Consumes: `httpStatus` from `./http.mjs` (Task 1).
- Produces: `pageChecks({ SITE, BASE })` from `@robertblust/design/verify/pages`, returning an object of nineteen `async (page, spec) => string | null` functions keyed by check name.

- [ ] **Step 1: Write `verify/pages.mjs`**

```js
// The checks every prose page in the family gets, in one place. Each returns a string naming
// what is wrong, or null. `page` is a Playwright page — the package never imports Playwright,
// it only receives one, which is what keeps this dependency-free.
//
// A factory rather than a plain object because `seo` and `card` close over the site's own
// SITE and BASE. Threading those through nineteen signatures to serve two would have changed
// every body; closing over them once leaves all nineteen exactly as they were, which is what
// makes this a move and not a rewrite.
import { httpStatus } from "./http.mjs";

export function pageChecks({ SITE, BASE }) {
  if (!SITE) throw new Error("pageChecks needs SITE, the site's canonical origin");
  if (!BASE) throw new Error("pageChecks needs BASE, the origin actually being tested");
  return {
    // ... the nineteen bodies, copied verbatim from blust.ch's verify/check.mjs after Task 3 ...
  };
}
```

Copy the nineteen bodies in **unchanged**. Their names, in the order they appear today: `sameOrigin`, `title`, `lang`, `sourceLang`, `contains`, `links`, `headerBaseline`, `carriesLang`, `mobileNav`, `storageKeys`, `navOrder`, `noNewTab`, `landing`, `sameTab`, `wayOut`, `internalLinks`, `footer`, `seo`, `card`.

Add `"./verify/pages": "./verify/pages.mjs"` to `exports`.

- [ ] **Step 2: Write the failing test**

`test/verify-pages.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { pageChecks } from "../verify/pages.mjs";

const OPTS = { SITE: "https://example.test", BASE: "http://127.0.0.1:8000" };

// The nineteen this module is responsible for. A body that quietly stops being exported takes
// its coverage from three suites at once, and every one of them still reports "all checks
// pass" — nothing else in the system would notice.
const EXPECTED = ["carriesLang", "card", "contains", "footer", "headerBaseline", "internalLinks",
  "landing", "lang", "links", "mobileNav", "navOrder", "noNewTab", "sameOrigin", "sameTab",
  "seo", "sourceLang", "storageKeys", "title", "wayOut"];

test("every shared check is present and callable", () => {
  const checks = pageChecks(OPTS);
  assert.deepEqual(Object.keys(checks).sort(), [...EXPECTED].sort());
  for (const n of EXPECTED) assert.equal(typeof checks[n], "function", `${n} is not callable`);
});

test("the factory refuses to build without the two values its bodies close over", () => {
  // Called with nothing, seo and card would compare against `undefined` and pass everything.
  assert.throws(() => pageChecks({}), /SITE/);
  assert.throws(() => pageChecks({ SITE: "https://example.test" }), /BASE/);
});

test("title holds the reconciled 65-character limit", () => {
  // Ruling 1. The number is the decision; if someone relaxes it back to 70 this says so.
  assert.match(pageChecks(OPTS).title.toString(), /length > 65/);
});

test("internalLinks inspects [src] and CSS url(), not only a[href]", () => {
  // The drift named at the top of the spec: the weaker version let a root-absolute [src]
  // through, which breaks under file://.
  const src = pageChecks(OPTS).internalLinks.toString();
  assert.match(src, /\[href\], \[src\]/);
  assert.match(src, /styleSheets/);
  assert.match(src, /url\\\(/);
});

test("card rewrites onto BASE, never onto location.origin", () => {
  // An origin carries no path. The weaker version dropped a /talks prefix and called a good
  // card unfetchable.
  const src = pageChecks(OPTS).card.toString();
  assert.match(src, /testBase/);
  assert.doesNotMatch(src, /location\.origin/);
});

test("two independently built check sets do not share mutable state", () => {
  // Each site calls the factory once; if the bodies were hoisted onto one shared object, the
  // last site to import would silently win SITE and BASE for all of them.
  const a = pageChecks({ SITE: "https://a.test", BASE: "http://a.local" });
  const b = pageChecks({ SITE: "https://b.test", BASE: "http://b.local" });
  assert.notEqual(a.seo, b.seo);
});
```

- [ ] **Step 3: Run and confirm it fails, then passes**

Run: `cd /Users/rob/git/robertblust/design && npm test`
Expected: FAIL before `verify/pages.mjs` exists; PASS after, suite total up by 6.

- [ ] **Step 4: Prove non-vacuity by mutation**

Delete `footer` from the returned object — test 1 must fail naming it. Change `65` back to `70` — test 3 must fail. Replace `testBase` with `location.origin` in `card` — test 5 must fail. Restore all three and re-run. Record each in the ledger.

- [ ] **Step 5: Commit, then release 0.9.0 or 0.10.0**

If Task 2 already shipped 0.9.0, this is **0.10.0**. Bump, commit, PR, merge with `--merge`, tag, release.

---

## Task 5: The three sites import `pageChecks`

**Files:**
- Modify: `verify/check.mjs` in all three sites
- Modify: `package.json`, `package-lock.json` in all three sites

- [ ] **Step 1: Re-pin and rewire each site**

```js
import { pageChecks } from "@robertblust/design/verify/pages";

const CHECKS = {
  ...DESIGN_CHECKS,
  ...STAGE_CHECKS,
  ...pageChecks({ SITE, BASE }),
  // only this site's own checks below
};
```

Then delete the nineteen local bodies. Each site keeps: blust.ch `brandMark`, `transport`, `zeroBased`; companygraph `fits`, `slides`, `translates`; guestgraph none — guestgraph's `CHECKS` becomes three spreads and nothing else, which is the goal, not a mistake.

`pageChecks` is spread **before** the local checks so a site could shadow one deliberately. No site does today; if one ever does, that is a finding to report, not a convenience to use.

- [ ] **Step 2: Verify, and prove the imported bodies fire**

Run `npm run design:check && npm run verify` in each site. Then, in each site, break one imported check's subject and confirm it reports:

```bash
# blust.ch: reorder the footer entries and expect the footer check to fail
perl -0pi -e 's|(<span><a href="https://github.com/robertblust">GitHub</a></span>\n)(\s*<span><a href="[^"]*LICENSE"[^>]*>Licence</a></span>\n)|$2$1|s' ideas/index.html
npm run verify    # expect: footer: reads "Licence · GitHub · Privacy", expected "GitHub · Licence · Privacy"
git checkout -- ideas/index.html
```

A green suite after deleting nineteen check bodies proves nothing on its own. This step is what makes the task complete.

- [ ] **Step 3: Commit each site**

- [ ] **Step 4: Confirm the spec's criteria, by measurement**

```bash
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/inventory.mjs     # IDENTICAL in all three: 0; SINGLE repo: 6
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/shingle.mjs       # the 370- and 252-line runs must be gone
```

Criterion 2 (`verify/design.mjs` exists once) and criterion 4 (no check body in more than one repository) are met when both report clean. Record the before and after numbers in the ledger: 160 cross-repo runs and 3,741 duplicated lines was the state on 2026-09-01.

---

## Self-Review

**Spec coverage.** Tier 3 names: `verify/design.mjs` (Task 1–2), the fourteen agreed check bodies (Task 4–5), the five drifted checks (Task 3), `verify/instance.test.mjs` and `export-pdf.mjs` (Ruling 2 — tier 4 plan), `og-recipe.test.mjs` (Ruling 2), `head.mjs` (Ruling 3 — its own plan), `storageKeys: true` on all four decks (**already done**, verified 2026-09-01), `carriesLang` importing `family.mjs` (**already done** — `check.mjs` line 6 imports `FAMILY`). `build/instance.mjs`, 297 lines identical in two repositories, is named nowhere in the spec's tier list but is real duplication; it goes in the `head.mjs` plan with `verify/instance.test.mjs`.

**Placeholder scan.** One deliberate ellipsis remains, in Task 4 Step 1: the nineteen bodies are not retyped because they must be copied **verbatim** from the reconciled source, and retyping them here would create a fourth copy that could drift from the three being consolidated. The task names all nineteen and says where to copy them from.

**Type consistency.** `pageChecks({ SITE, BASE })` is used identically in Task 4's tests and Task 5's call site. `httpStatus(url) => Promise<number>` is produced in Task 1 and consumed by `verify/pages.mjs` in Task 4. `DESIGN_CHECKS`/`SYSTEM_FACES` keep the names the sites already import.
