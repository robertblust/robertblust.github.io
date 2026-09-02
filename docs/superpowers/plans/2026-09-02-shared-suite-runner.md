# Shared Suite Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the verification suite's runner into `@robertblust/design`, so each site's `verify/check.mjs` holds only its `SITE`, its `PAGES`, and the checks that are genuinely its own.

**Architecture:** The runner — browser lifecycle, the page loop, per-page result printing, the `PAGES` opt-in guards and the site-wide `sitemap.xml`, `robots.txt`, favicon and site-identity blocks — is byte-identical across three repositories today and sits *outside* the `CHECKS` object, where the previous consolidation could not see it. It becomes one exported function that takes a site's configuration and returns a failure count.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict` in the package; Playwright in the sites — the package receives a browser, it never launches one.

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md` — success criterion 4, read as its own second sentence.

## Global Constraints

- The package has **zero dependencies and zero devDependencies**. Playwright stays a site devDependency.
- Node 22+, ESM, `node:test` + `node:assert/strict`.
- Sites pin an **exact tag**, never a commit SHA.
- Merge with a merge commit — `gh pr merge --merge`, **never `--squash`**.
- Stage files by name; never `git add -A`.
- Opening a PR is not approval to merge. `robertblust/design`'s `main` requires a PR and a green `test`.
- Never mention closed-source predecessor projects.
- Every gate must be a check that *can* fail. Prove it by mutation.

## Measurements this plan rests on

Taken 2026-09-02 on `main` of all three sites, after the theme work merged.

| Fact | Value |
|---|---|
| Significant lines identical in all three, **outside** `CHECKS` | **60** |
| Significant lines identical in all three, **inside** `CHECKS` | **0** — the previous plan finished that job |
| `check.mjs` size | blust.ch 288, companygraph 414, guestgraph 204 |
| Structure, all three | imports → `BASE` → `SITE` → `FOOTER` → `PAGES` → `CHECKS` → runner → `process.exit` |
| The three opt-in guards | `seo`, `tokenVersion`, `fences` — **byte-identical in all three** |

**Two guards exist only on blust.ch**, and both were learned the hard way:

- **The site-identity guard.** It fetches `/sitemap.xml` and fails unless it contains `<loc>{SITE}/</loc>`. Its comment: *"not hypothetical — it happened during review, and the run reported six failures belonging to a site nobody was testing."* companygraph and guestgraph have no such protection, and this plan has repeatedly had to warn implementers that one static server on port 8000 can silently serve the wrong repository.
- **The favicon check.** The favicon is the only place the brand mark exists outside a page, so no DOM check reaches it. blust.ch asserts it names no font face outside `SYSTEM_FACES`.

Both move into the shared runner, which means the other two sites gain them. **Expect failures on adoption** — that is the same "take the stronger version" move the earlier tier-3 plan made, and finding a real problem is the point.

## Rulings made while writing this plan

**Ruling 1 — the whole runner moves, not just the two site-wide blocks.** Moving only `sitemap.xml` and `robots.txt` would leave the preamble, the page loop and the epilogue triplicated — the same class of defect, one line lower. Each site's file becomes its configuration plus one call, which is exactly what the spec describes: *"Each site's `check.mjs` keeps its `PAGES`, its `SITE`, and the checks that are genuinely its own."* Cost if wrong: what a site's suite does is less visible at a glance from its own file, and a reader has to open the package to see the order of operations.

**Ruling 2 — the package receives a browser, it does not launch one.** The package has zero dependencies and cannot import Playwright. `runSuite` takes an already-launched `browser` and closes nothing it did not open; the site owns the lifecycle, as it already does for every check that receives a `page`. Cost if wrong: three lines of boilerplate stay in each site.

**Ruling 3 — `runSuite` returns a count; it does not exit.** `process.exit` stays in the site's file. A function that terminates the process is untestable, and the package's own suite has to be able to call this one. Cost if wrong: one line per site.

---

## File Structure

**Created in `@robertblust/design`:**
- `verify/suite.mjs` — `runSuite(...)`: the guards, the page loop, the site-wide blocks, and the reporting. One responsibility: run a site's checks against its pages and say what failed.
- `test/suite.test.mjs` — drives `runSuite` with a fake browser and fake `fetch`.

**Modified in `@robertblust/design`:** `package.json` (a new export path, version `0.12.0`), `versions.json` unchanged — this touches no fence.

**Modified in each site:** `verify/check.mjs` — everything from `const browser` to `process.exit` is replaced by one call.

---

## Task 1: `runSuite` in the package

**Files:**
- Create: `/Users/rob/git/robertblust/design/verify/suite.mjs`
- Modify: `/Users/rob/git/robertblust/design/package.json`
- Test: `/Users/rob/git/robertblust/design/test/suite.test.mjs`

**Interfaces:**
- Produces: `runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces }) => Promise<number>` from `@robertblust/design/verify/suite`, returning the failure count. `browser` is a Playwright `Browser`; `systemFaces` is the `Set` the favicon check needs.

- [ ] **Step 1: Move the runner verbatim**

Take the region from `const browser = await chromium.launch();` to just before `process.exit(...)` in `/Users/rob/git/robertblust/robertblust.github.io/verify/check.mjs` — blust.ch is the source because it is the only one carrying all the guards. Wrap it in the exported function, with these edits and no others:

- the browser is a parameter, not a local — delete the `chromium.launch()` line and the `await browser.close()` line; the caller owns both
- `failures` becomes a local that is **returned** rather than fed to `process.exit`
- `SITE`, `BASE`, `PAGES`, `CHECKS` and `SYSTEM_FACES` come from the argument

Everything else — every comment, every message string, the order of the blocks — moves unchanged. This is a move; if you find yourself improving a message, stop and report it instead.

Add the header comment above the function:

```js
// The suite's runner: the PAGES opt-in guards, the page loop, and the site-wide checks that
// are not about any one page. This was byte-identical in three repositories and sat outside
// the CHECKS object, which is the only reason the previous consolidation missed it — the tool
// that measured duplication only ever looked inside that object, so "no check body exists in
// more than one repository" was true of the object and false of the file.
//
// It takes a browser rather than launching one: this package has no dependencies and cannot
// import Playwright. It returns a failure count rather than exiting, because a function that
// terminates the process cannot be tested, and this one is.
```

- [ ] **Step 2: Add the export path and the version**

In `package.json`, add `"./verify/suite": "./verify/suite.mjs"` to `exports` and set `"version": "0.12.0"`.

- [ ] **Step 3: Write the failing tests**

`test/suite.test.mjs`. `runSuite` needs a browser, a page and `fetch`; supply fakes. This follows the pattern the `noFlash` and `httpStatus` tests already use — drive the real code with a stub and assert on behaviour, never on source text.

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { runSuite } from "@robertblust/design/verify/suite";

// A page that answers the handful of calls the runner makes of it, and records nothing else.
// Checks themselves are supplied by the test, so this only has to be good enough to get the
// loop running.
function fakePage() {
  return {
    async goto() {}, async close() {}, async evaluate() { return null; },
    async $() { return null; }, on() {}, context: () => ({ browser: () => fakeBrowser() }),
  };
}
function fakeBrowser() {
  return { async newPage() { return fakePage(); }, async close() {} };
}

// Every site-wide fetch the runner makes, answered well enough to pass. Individual tests
// override one entry to make exactly one thing wrong.
function fakeFetch(over = {}) {
  const body = {
    "/sitemap.xml": `<urlset><loc>https://x.test/</loc></urlset>`,
    "/robots.txt": "Sitemap: https://x.test/sitemap.xml",
    "/favicon.svg": `<svg><text font-family="Plex Mono, monospace">rb</text></svg>`,
    ...over,
  };
  return async (url) => {
    const path = new URL(url).pathname;
    const text = body[path];
    return { ok: text !== undefined, status: text === undefined ? 404 : 200,
             async text() { return text ?? ""; } };
  };
}

const OPTS = () => ({
  browser: fakeBrowser(), SITE: "https://x.test", BASE: "https://x.test",
  PAGES: [{ path: "/", seo: true, tokenVersion: true, fences: ["design tokens"] }],
  CHECKS: {}, systemFaces: new Set(["plex mono", "monospace"]),
});

test("a clean site reports no failures", async (t) => {
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch();
  t.after(() => { globalThis.fetch = real; });
  assert.equal(await runSuite(OPTS()), 0);
});

test("a page that has not opted into seo is a failure", async (t) => {
  // The guard exists because the runner skips any check whose key is undefined, so deleting
  // one line from PAGES turns a contract off and changes no output. Silence is the failure
  // mode it defends against.
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch();
  t.after(() => { globalThis.fetch = real; });
  const o = OPTS(); o.PAGES = [{ path: "/", tokenVersion: true, fences: [] }];
  assert.ok(await runSuite(o) > 0, "a page without seo passed");
});

test("a sitemap that does not name this site is a failure", async (t) => {
  // The site-identity guard. One static server on port 8000 can serve the wrong repository,
  // and a run once reported six failures belonging to a site nobody was testing.
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch({ "/sitemap.xml": `<urlset><loc>https://other.test/</loc></urlset>` });
  t.after(() => { globalThis.fetch = real; });
  assert.ok(await runSuite(OPTS()) > 0, "a sitemap naming another site passed");
});

test("robots.txt naming no sitemap is a failure", async (t) => {
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch({ "/robots.txt": "User-agent: *" });
  t.after(() => { globalThis.fetch = real; });
  assert.ok(await runSuite(OPTS()) > 0, "robots.txt without a sitemap passed");
});

test("a favicon naming a face it cannot load is a failure", async (t) => {
  // The favicon is the only place the brand mark exists outside a page, so no DOM check
  // reaches it.
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch({
    "/favicon.svg": `<svg><text font-family="Comic Sans MS">rb</text></svg>` });
  t.after(() => { globalThis.fetch = real; });
  assert.ok(await runSuite(OPTS()) > 0, "a favicon naming an unloadable face passed");
});

test("a failing check counts, and a passing one does not", async (t) => {
  // The loop's own contract: a check returning a string is a failure, null is a pass.
  const real = globalThis.fetch;
  globalThis.fetch = fakeFetch();
  t.after(() => { globalThis.fetch = real; });
  const bad = OPTS(); bad.CHECKS = { boom: async () => "it broke" }; bad.PAGES[0].boom = true;
  const good = OPTS(); good.CHECKS = { fine: async () => null }; good.PAGES[0].fine = true;
  assert.ok(await runSuite(bad) > 0, "a check returning a string did not count");
  assert.equal(await runSuite(good), 0, "a check returning null counted");
});

test("runSuite returns rather than exiting", () => {
  // process.exit in a library makes it untestable and takes the decision away from the caller.
  assert.doesNotMatch(runSuite.toString(), /process\.exit/);
});
```

- [ ] **Step 4: Run, then prove each can fail**

Run: `cd /Users/rob/git/robertblust/design && npm test`. Expected: FAIL before Step 1, PASS after.

Mutations, each restored: delete the `seo` guard block (test 2 fails); delete the site-identity block (test 3); delete the robots block (test 4); delete the favicon block (test 5); make the loop treat a returned string as a pass (test 6). Record each verbatim.

- [ ] **Step 5: Commit, then stop**

Commit. Do not push or open a pull request — the release is the repository owner's call.

---

## Task 2: The three sites call it

**Files:** `verify/check.mjs` and `package.json` in each site.

**Interfaces:**
- Consumes: `runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces })` from Task 1.

- [ ] **Step 1: Re-pin**

```bash
npm install "@robertblust/design@github:robertblust/design#v0.12.0" --save-dev
```

`npm install` alone will not refetch a moved tag. Confirm with `node -e "console.log(require('./node_modules/@robertblust/design/package.json').version)"`.

- [ ] **Step 2: Replace the runner with a call**

Delete everything from `const browser = await chromium.launch();` to the line before `process.exit(...)`, and put this in its place:

```js
import { runSuite } from "@robertblust/design/verify/suite";
import { SYSTEM_FACES } from "@robertblust/design/verify/design";

const browser = await chromium.launch();
const failures = await runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces: SYSTEM_FACES });
await browser.close();
process.exit(failures ? 1 : 0);
```

companygraph and guestgraph do not currently import `SYSTEM_FACES`; add it. blust.ch already does — do not add a second import.

- [ ] **Step 3: Expect the two new guards to fail, and fix what they find**

companygraph and guestgraph gain the site-identity guard and the favicon check for the first time. Run each suite and report exactly what they say.

If the favicon check fails, the fix is in the site's `favicon.svg` — make it name only faces in `SYSTEM_FACES`, or none. **Do not weaken the check**, and do not add an exception. If the site-identity guard fails, the server is serving the wrong repository — which is the guard working, so fix how you are running it rather than the guard.

- [ ] **Step 4: Verify**

Run every CI script per site, with `python3 -m http.server 8000 &` started **inside that repository's own directory**. Only one repo can hold the port — `pkill -f "http.server"` between repositories.

- blust.ch: `design:check verify og:check test:og test:instance principles:check model:check`
- companygraph: `design:check verify og:check test:og test:example example:check`
- guestgraph: `design:check verify og:check test:og`

- [ ] **Step 5: Prove the runner is still wired**

Deleting a runner and importing a function is exactly the change that can silently stop checking. In each site, break something the runner is responsible for and confirm it reports — use a **different** one per site:

- blust.ch: remove `seo: true` from one page's `PAGES` entry → the opt-in guard must name that path
- companygraph: point `BASE` at a port serving a different repository → the site-identity guard must fire
- guestgraph: add a second `Sitemap:` line to `robots.txt` naming a URL that 404s → the robots block must fire

Restore each exactly and confirm green.

- [ ] **Step 6: Confirm the measurement**

```bash
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/outside-checks.mjs
```

It must report **0** significant lines triplicated outside `CHECKS`. That is criterion 4 met on its own second sentence.

- [ ] **Step 7: Commit per site, open one PR per site, stop**

---

## Self-Review

**Spec coverage.** Criterion 4's second sentence — "each site's `check.mjs` holds its `PAGES`, its `SITE`, and only the checks that are genuinely its own" — is what this plan closes; Task 2 Step 6 measures it. The rest of the spec is untouched: no fence changes, so `design:check` should be a fixed point throughout, and `versions.json` does not move.

**Placeholder scan.** No TBDs. The one thing not spelled out is what the favicon check will say on companygraph and guestgraph, because neither has ever run it — Task 2 Step 3 says to report it rather than guess, and forbids weakening the check.

**Type consistency.** `runSuite({ browser, SITE, BASE, PAGES, CHECKS, systemFaces }) => Promise<number>` is defined in Task 1's Interfaces, exercised by Task 1's tests, and called with those exact names in Task 2 Step 2. `SYSTEM_FACES` is the existing export from `@robertblust/design/verify/design` and is passed as `systemFaces`.
