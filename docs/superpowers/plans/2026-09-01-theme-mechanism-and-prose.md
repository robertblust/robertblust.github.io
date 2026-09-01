# Theme Switch — Mechanism and Prose Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the 16 prose pages a light/dark switch that survives a reload, crosses the three domains on links, and never flashes the wrong palette.

**Architecture:** The `design tokens` block gains a `:root[data-theme="light"]` half — same eleven names, re-picked values. Two new fences carry the behaviour: `theme boot`, a tiny script in `<head>` above the `<style>` that sets the attribute before first paint, and `theme`, the storage, cross-domain carry and control wiring at the end of the body, mirroring the existing `language` block. The sites contribute the control markup and one config value.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict` in the package; Playwright for the site suites; no build step, no framework, no external assets.

**Spec:** `docs/superpowers/specs/2026-09-01-theme-switch-design.md`

## Global Constraints

- The package has **zero dependencies and zero devDependencies**. Playwright stays a site devDependency; the package receives a `page`, it never creates one.
- Node 22+, ESM, `node:test` + `node:assert/strict`.
- **No external assets, anywhere.** The sun and moon are inline SVG.
- Sites pin an **exact tag**, never a commit SHA.
- Merge with a merge commit — `gh pr merge --merge`, **never `--squash`**.
- Stage files by name; never `git add -A`.
- Opening a PR is not approval to merge. `robertblust/design`'s `main` requires a PR and a green `test`.
- Never mention closed-source predecessor projects.
- Every gate must be a check that *can* fail. Prove it by mutation.
- **Dark is the default. `prefers-color-scheme` is never read** (spec decision 4).
- **`--lcd` does not flip** and **`--c-weak` stays non-text-only in both themes** (spec decisions 3 and 6). `--lcd` is a deck token and out of scope here; do not add it.

## Measurements this plan rests on

Taken 2026-09-01 on `main`. Re-derive if they look wrong.

| Fact | Value |
|---|---|
| Prose pages | 16 — blust.ch 6, companygraph 6, guestgraph 4 |
| Literal colours outside `:root` on prose pages | **37**, and they are only three things |
| — `#1b2231` | 16× — `.seg button[aria-pressed="true"]{background:…}`, one per page |
| — `#1b2333` | 3× — `.btn.primary:hover, .btn.primary:focus-visible{background:…}` |
| — `#0C0E13` | 18× — `fill="…"` on inline SVG marks |
| Head structure | `<style>` opens at line ~102; the boot script goes immediately above it |
| Language storage key | `rb-lang`, from `langKey` in each site's `design.config.json` |

**`#1b2231` and `#1b2333` are one colour typed twice** — both are `background:` on a control surface, differing by 2 in the blue channel. They become a single token, `--press`. That is a finding, not a liberty: shipping two names for one value into a themed palette would mean maintaining two light values for one visual idea.

## Rulings made while writing this plan

**Ruling 1 — two fences, not one.** The pre-paint script cannot live with the rest of the theme code: it must run in `<head>` above `<style>`, while every other script on these pages sits at the end of the body. So `theme boot` and `theme` are separate fences. They duplicate the storage key and the URL regex, deliberately — the boot script has to stand alone with no helpers in scope. Both are package-owned, so the duplicate cannot drift. Cost if wrong: ~6 duplicated lines, in one repository.

**Ruling 2 — the boot script reads the URL as well as storage.** A visitor arriving from a sibling domain with `?theme=light` must paint light immediately, not after the body script runs. So the boot script parses the param too. The body script still owns adopting, storing and cleaning the address bar. Cost if wrong: a one-frame flash on cross-domain arrivals only.

**Ruling 3 — `--press` is a new token, not a reuse of `--raise`.** `--raise` is `#171A21`, a neutral lift; `#1b2231` is blue-tinted, and its job is "this control is pressed". Folding it into `--raise` would lose the tint and change three pages' primary button. Cost if wrong: one extra token in a block of eleven.

---

## File Structure

**Created in `@robertblust/design`:**
- `blocks/theme-boot.js` — the pre-paint script. One responsibility: set `data-theme` on `<html>` before anything paints.
- `blocks/theme.js` — storage, cross-domain carry, control wiring. Mirrors `blocks/lang.js`.
- `test/theme.test.mjs` — tests for both blocks and the token palette.

**Modified in `@robertblust/design`:** `blocks/tokens.css` (the light half + `--press`), `blocks/header.css` (the control's rules), `lib/fences.mjs` (two entries), `versions.json`, `package.json`, `verify/pages.mjs` (`storageKeys` extended; `contrast` and `noFlash` added).

**Modified in each site:** `design.config.json` (`themeKey`), 16 × `index.html` (boot fence, theme fence, control markup, three literals → tokens), `verify/check.mjs` (`PAGES` flags), `privacy/index.html` (names `rb-theme`), `export-og.mjs` (pins dark).

---

## Task 1: The light palette and `--press`

**Files:**
- Modify: `/Users/rob/git/robertblust/design/blocks/tokens.css`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/theme.test.mjs`

**Interfaces:**
- Produces: the token set `--ground --raise --rule --sky --ink --dim --c-weak --c-mid --c-firm --c-flag --c-path --press`, defined for both themes. Fence `design tokens` at **v5**.

- [ ] **Step 1: Add `--press` to the dark block and the light half**

In `blocks/tokens.css`, the existing `:root{` gains one declaration, and a second rule follows it. Set the fence's first line to `v5` and `versions.json`'s `tokens` to `"v5"`.

```css
  :root{
    --ground:#0C0E13; --raise:#171A21; --rule:#232833;
    --sky:radial-gradient(120% 60% at 50% -10%, var(--raise) 0%, var(--ground) 60%);
    --ink:#EFEDE8;    --dim:#8A8B86;
    --c-weak:#3E5878; --c-mid:#7FA3D8; --c-firm:#B8D0FF; --c-flag:#D9A44F;
    --c-path:#B8D0FF; --press:#1b2231;
```

The light half goes after the `:root` block closes. On the `deck` variant the fence does not close `:root`, so the light rule must come **after** the closing brace the page supplies — put it in the `page` variant's closing text and in the deck variant's equivalent position. Add this comment above it verbatim; it is the block's own explanation of why the values are not simply inverted:

```css
  /* The same eleven names, re-picked. The ramp's axis flips: on dark, brightness is
     confidence; on light, depth is — the candidate pales, the resolved thing deepens.
     Reusing the dark stops here was measured and refused: --c-mid paints every link and
     falls to 2.47:1 on this ground, --c-firm to 1.49:1. These clear AA on every text stop
     (ink 16.86, dim 6.04, mid 5.09, firm 10.28, flag 5.61).

     --c-weak is 2.37:1 and that is deliberate, exactly as its 2.64:1 on dark is: its job is
     "a candidate, considered but not accepted", and darkening it until it clears the 3:1 UI
     threshold stops it reading as tentative. It must never carry text, a border or an
     outline on its own, in either theme. */
  :root[data-theme="light"]{
    --ground:#FAF9F5; --raise:#F2F0EA; --rule:#DFDCD3;
    --ink:#16181D;    --dim:#5F6058;
    --c-weak:#8FA6C2; --c-mid:#3A6DA6; --c-firm:#1C3E68; --c-flag:#8A5A12;
    --c-path:#1C3E68; --press:#E2E8F2;
  }
```

`--sky` is not repeated: it is defined in terms of `var(--raise)` and `var(--ground)`, so it follows the theme on its own. Confirm that in the test.

- [ ] **Step 2: Write the failing test**

Create `test/theme.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { blockFor } from "@robertblust/design/fences";

// WCAG 2.1 relative luminance. Inlined rather than imported: the package has no dependencies,
// and a contrast test that trusts a helper it also ships proves less than one that does not.
const hex = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// Parse `--name:#value` pairs out of one rule of the emitted block.
function palette(css, selector) {
  const m = css.match(new RegExp(selector.replace(/[[\]]/g, "\\$&") + "\\{([\\s\\S]*?)\\n  \\}"));
  assert.ok(m, `no ${selector} rule in the emitted block`);
  return Object.fromEntries([...m[1].matchAll(/--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g)].map((x) => [x[1], x[2]]));
}

const TEXT = ["ink", "dim", "c-mid", "c-firm", "c-flag"];

test("both themes define the same token names", () => {
  // A name present in one theme and missing in the other is invisible until someone switches
  // on the one page that uses it — the palette must be total, not mostly total.
  const css = blockFor("design tokens", "page");
  const dark = palette(css, ":root");
  const light = palette(css, ':root\\[data-theme="light"\\]');
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort());
});

test("every text token clears AA against its own ground, in both themes", () => {
  // The reason this plan exists: reusing the dark ramp on light put --c-mid, which paints
  // every link, at 2.47:1. This is the gate that stops that shipping again.
  const css = blockFor("design tokens", "page");
  for (const [name, sel] of [["dark", ":root"], ["light", ':root\\[data-theme="light"\\]']]) {
    const p = palette(css, sel);
    for (const t of TEXT) {
      const r = ratio(p[t], p.ground);
      assert.ok(r >= 4.5, `${name}: --${t} is ${r.toFixed(2)}:1 on --ground, needs 4.5`);
    }
  }
});

test("the confidence ramp is ordered in both themes, in opposite directions", () => {
  // The block's grammar, asserted rather than described. Dark: brighter is firmer.
  // Light: darker is firmer. A ramp that is not monotonic means the stops stopped meaning
  // anything, which no contrast check would catch.
  const css = blockFor("design tokens", "page");
  const d = palette(css, ":root"), l = palette(css, ':root\\[data-theme="light"\\]');
  assert.ok(lum(d["c-weak"]) < lum(d["c-mid"]) && lum(d["c-mid"]) < lum(d["c-firm"]),
    "dark ramp is not brighter-is-firmer");
  assert.ok(lum(l["c-weak"]) > lum(l["c-mid"]) && lum(l["c-mid"]) > lum(l["c-firm"]),
    "light ramp is not darker-is-firmer");
});

test("--sky is derived, so it follows the theme without being restated", () => {
  // If someone ever writes literal colours into --sky, the light theme keeps the dark
  // gradient and nobody notices until they look at the top of a light page.
  const css = blockFor("design tokens", "page");
  assert.match(css, /--sky:radial-gradient\([^;]*var\(--raise\)[^;]*var\(--ground\)[^;]*\);/);
  const light = css.match(/:root\[data-theme="light"\]\{([\s\S]*?)\n  \}/)[1];
  assert.doesNotMatch(light, /--sky:/, "the light half restates --sky instead of deriving it");
});

test("--press exists in both themes and is not --raise", () => {
  // #1b2231 and #1b2333 were one colour typed twice; --press is the single name. It is blue-
  // tinted where --raise is neutral, and folding them together would change three pages'
  // primary button.
  const css = blockFor("design tokens", "page");
  for (const sel of [":root", ':root\\[data-theme="light"\\]']) {
    const p = palette(css, sel);
    assert.ok(p.press, `no --press in ${sel}`);
    assert.notEqual(p.press, p.raise, `--press equals --raise in ${sel}`);
  }
});
```

- [ ] **Step 3: Run it and watch it fail, then pass**

Run: `cd /Users/rob/git/robertblust/design && npm test`
Expected before Step 1: FAIL — no `:root[data-theme="light"]` rule. After: PASS, suite up by 5.

- [ ] **Step 4: Prove each test can fail**

Five mutations, each restored and re-confirmed green:
1. Delete `--c-flag` from the light half → test 1 fails naming the mismatch.
2. Set light `--c-mid` to `#7FA3D8` (the dark value) → test 2 fails at ~2.47:1.
3. Swap light `--c-weak` and `--c-firm` → test 3 fails on the light ramp.
4. Restate `--sky` inside the light half with literal colours → test 4 fails.
5. Set `--press` equal to `--raise` in the light half → test 5 fails.

Record each verbatim. A test never seen red is not a gate.

- [ ] **Step 5: Commit**

```bash
git add blocks/tokens.css versions.json test/theme.test.mjs
git commit -m "design tokens v5: a light half, and one name for a colour typed twice"
```

---

## Task 2: The `theme boot` and `theme` fences

**Files:**
- Create: `/Users/rob/git/robertblust/design/blocks/theme-boot.js`, `/Users/rob/git/robertblust/design/blocks/theme.js`
- Modify: `/Users/rob/git/robertblust/design/lib/fences.mjs`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/theme.test.mjs` (append)

**Interfaces:**
- Consumes: `--press` and the light palette from Task 1.
- Produces: fences `theme boot` (v1) and `theme` (v1), both declaring `params: ["themeKey"]`. The page must provide `<button id="thLight">` and `<button id="thDark">`, and must declare `var theme` in scope before the `theme` fence.

- [ ] **Step 1: Write `blocks/theme-boot.js`**

```js
  /* ─── theme boot · v1 · shared ───────────────────────────────────────
     Set the theme before anything paints. Generated from @robertblust/design —
     editing it here does nothing, because the next `npm run design` overwrites it.

     This is the only script on these pages that runs in <head>, and it has to: every other
     script sits at the end of the body, which is after first paint. Language arriving late
     costs a flash of English; a palette arriving late repaints the whole page in the wrong
     one, on every navigation.

     It duplicates the storage key and the URL pattern that `theme` also carries. That is
     deliberate — nothing is in scope up here, and the block must stand alone. Both blocks are
     generated from the same package, so the duplicate cannot drift.

     Dark is the default and `prefers-color-scheme` is never read: dark is the design, and
     light is something a visitor asks for. A visitor whose system is set to light still
     arrives on dark until they say otherwise.
  */
  (function(){
    try {
      var m = /[?&]theme=(light|dark)(&|$)/.exec(location.search);
      var t = m ? m[1] : localStorage.getItem("{{themeKey}}");
      if (t === "light") document.documentElement.setAttribute("data-theme", "light");
    } catch (e) {}
  })();
  /* ─── end theme boot ─────────────────────────────────────────────────── */
```

The URL is read here as well as in `theme`, so a visitor arriving from a sibling domain paints light on the first frame rather than after the body script runs.

- [ ] **Step 2: Write `blocks/theme.js`**

```js
  /* ─── theme · v1 · shared ────────────────────────────────────────────
     One theme across three domains, and where it is remembered. Generated from
     @robertblust/design — editing it here does nothing.

     This block has a contract with the page that `design:check` cannot see, because the check
     only compares bytes between the markers. The page must declare a `theme` variable in scope
     before this fence, and must carry two controls, `#thLight` and `#thDark`. Rename either and
     the fence still matches byte for byte — every check stays green — while the control stops
     working. `storageKeys` is what actually holds this contract: it clicks both.
  */
  var THEME_KEY = "{{themeKey}}";
  function themeStored(){ try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function themeRemember(v){ try { localStorage.setItem(THEME_KEY, v); } catch (e) {} }

  /* Each origin keeps its own localStorage, so a visitor reading in light who followed a link
     to a sibling site would arrive in dark — three copies of one preference, none of which can
     see the others. The theme rides along instead, on the same terms as the language: the param
     is added at click time, never at load, so no link in the served markup carries it and
     nothing crawlable or bookmarkable does either. */
  var THEME_FAMILY = /^(www\.)?(blust\.ch|companygraph\.io|guestgraph\.io)$/;
  function themeFromUrl(){
    var m = /[?&]theme=(light|dark)(&|$)/.exec(location.search);
    if (!m) return null;
    try {
      var q = location.search.replace(/([?&])theme=(light|dark)(&|$)/, "$1").replace(/[?&]$/, "");
      history.replaceState(null, "", location.pathname + q + location.hash);
    } catch (e) {}
    return m[1];
  }
  function carryTheme(e){
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin === location.origin || !THEME_FAMILY.test(u.hostname)) return;
    u.searchParams.set("theme", theme);
    a.href = u.toString();
  }
  // mousedown as well as click, so a middle-click or cmd-click into a new tab carries it too.
  // This runs alongside the language block's identical pair; the second listener reads the href
  // the first rewrote, so the two compose into ?lang=de&theme=light rather than racing.
  document.addEventListener("mousedown", carryTheme, true);
  document.addEventListener("click", carryTheme, true);

  function applyTheme(){
    if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    var l = document.getElementById("thLight"), d = document.getElementById("thDark");
    if (l) l.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    if (d) d.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }
  function setTheme(v){ theme = v; themeRemember(v); applyTheme(); }
  /* ─── end theme ──────────────────────────────────────────────────────── */
```

- [ ] **Step 3: Register both fences**

In `lib/fences.mjs`, beside the `"language"` entry:

```js
  // Two fences for one idea, because one of them has to run in <head> above the stylesheet and
  // the other at the end of the body. See the comment in blocks/theme-boot.js.
  "theme boot": {
    key: "themeBoot", source: "blocks/theme-boot.js", version: versions.themeBoot,
    variants: null, closes: null, params: ["themeKey"],
  },
  "theme": {
    key: "theme", source: "blocks/theme.js", version: versions.theme,
    variants: null, closes: null, params: ["themeKey"],
  },
```

Add `"themeBoot": "v1"` and `"theme": "v1"` to `versions.json`.

- [ ] **Step 4: Append the failing tests**

```js
const TP = { themeKey: "x-theme" };

test("neither theme block hardcodes a site's storage key", () => {
  // The defect this exact shape caused once before, in `language` v1: a real key was baked in
  // at extraction, correct for one site and wrong for the other two, with no fixed point —
  // the sync tool corrected the visible bytes forever while the block re-emitted the frozen
  // value. The parameter is what makes both passes agree.
  for (const f of ["theme boot", "theme"]) {
    const js = blockFor(f, null, TP);
    assert.match(js, /x-theme/, `${f} did not substitute themeKey`);
    assert.doesNotMatch(js, /rb-theme|cg-theme|gg-theme/, `${f} carries a real site's key`);
  }
});

test("the boot block reads the URL as well as storage", () => {
  // A visitor arriving from a sibling domain with ?theme=light must paint light on the first
  // frame. Reading only localStorage would give them one frame of dark on every crossing.
  const js = blockFor("theme boot", null, TP);
  assert.match(js, /location\.search/);
  assert.match(js, /localStorage\.getItem/);
});

test("the boot block never reads prefers-color-scheme", () => {
  // Spec decision 4: dark is the default and the OS is not consulted. This is the assertion
  // that stops a later "helpful" change from quietly making light the default for most
  // visitors — which would also stop the share cards matching the pages.
  const js = blockFor("theme boot", null, TP);
  assert.doesNotMatch(js, /prefers-color-scheme|matchMedia/);
});

test("the boot block is guarded, because file:// throws", () => {
  // localStorage on an opaque origin throws rather than returning null. A deck must still open.
  const js = blockFor("theme boot", null, TP);
  assert.match(js, /try\s*\{[\s\S]*catch/);
});

test("theme carries the param to family domains only", () => {
  const js = blockFor("theme", null, TP);
  assert.match(js, /THEME_FAMILY\s*=\s*\/\^\(www\\\.\)\?\(blust\\\.ch\|companygraph\\\.io\|guestgraph\\\.io\)\$\//);
  assert.match(js, /u\.origin === location\.origin \|\| !THEME_FAMILY\.test\(u\.hostname\)/);
});

test("theme decorates on mousedown as well as click", () => {
  // A middle-click or cmd-click opens a new tab without ever firing click.
  const js = blockFor("theme", null, TP);
  assert.match(js, /addEventListener\("mousedown", carryTheme, true\)/);
  assert.match(js, /addEventListener\("click", carryTheme, true\)/);
});

test("theme cleans the address bar after adopting a param", () => {
  const js = blockFor("theme", null, TP);
  assert.match(js, /history\.replaceState/);
});

test("both theme fences declare themeKey and no variants", () => {
  for (const f of ["theme boot", "theme"]) {
    assert.deepEqual(FENCES[f].params, ["themeKey"]);
    assert.equal(FENCES[f].variants, null);
  }
});
```

Add `FENCES` to the file's imports: `import { blockFor, FENCES } from "@robertblust/design/fences";`

- [ ] **Step 5: Run, then prove non-vacuity**

Run `npm test`. Expected: FAIL before Step 3, PASS after, suite up by 8.

Mutations, each restored: replace `{{themeKey}}` with `rb-theme` in `theme-boot.js` (test 1 fails); drop the `location.search` line from the boot block (test 2); add `matchMedia("(prefers-color-scheme: light)")` to the boot block (test 3); remove the `mousedown` listener (test 6). Record each verbatim.

- [ ] **Step 6: Commit**

```bash
git add blocks/theme-boot.js blocks/theme.js lib/fences.mjs versions.json test/theme.test.mjs
git commit -m "Two fences for the theme: one in head to beat first paint, one in body"
```

---

## Task 3: The control's CSS, and the three checks

**Files:**
- Modify: `/Users/rob/git/robertblust/design/blocks/header.css`, `versions.json`, `verify/pages.mjs`, `package.json`
- Test: `/Users/rob/git/robertblust/design/test/theme.test.mjs` (append)

**Interfaces:**
- Produces: `.seg.theme` rules in the `header contract` fence; `contrast` and `noFlash` checks in `pageChecks`; `storageKeys` extended to click `#thLight`/`#thDark`.

- [ ] **Step 1: Add the control's rules to `blocks/header.css`**

The theme control reuses `.seg`, so it needs only what differs: icon sizing and the pressed background moving to the new token. Bump the `header contract` fence to the next version and update `versions.json`.

```css
  /* The theme control is a .seg like the language one, so it inherits the border, the radius
     and the pressed treatment. Only the icons differ: 14px square, drawn with currentColor so
     the pressed state colours them without a second rule. */
  .seg.theme button{display:grid; place-items:center; padding:.26rem .48rem}
  .seg.theme svg{width:14px; height:14px; display:block; fill:none; stroke:currentColor;
                 stroke-width:2; stroke-linecap:round; stroke-linejoin:round}
```

Change the existing pressed rule from the literal to the token:

```css
  .seg button[aria-pressed="true"]{color:var(--c-mid); background:var(--press); font-weight:600}
```

- [ ] **Step 2: Extend `storageKeys` and add `contrast` and `noFlash` to `verify/pages.mjs`**

In `storageKeys`, add the theme control to the list of write paths it exercises, immediately after the existing language clicks:

```js
      if (await page.$("#thLight")) { await page.click("#thLight"); await page.click("#thDark"); }
```

Without this the theme key is written by real visitors and never seen by the check, so `/privacy/` could omit it and nothing would fail.

Add two checks to the object `pageChecks` returns:

```js
    // Every text token has to clear AA against the ground of the theme it belongs to. Read from
    // the live page rather than the package source, because what ships is what the page carries:
    // a stale generated copy is exactly the case worth catching.
    async contrast(page) {
      const bad = await page.evaluate(() => {
        const hex = (h) => { h = h.trim().replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
        const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        const out = [];
        for (const theme of ["dark", "light"]) {
          if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
          else document.documentElement.removeAttribute("data-theme");
          const cs = getComputedStyle(document.documentElement);
          const g = cs.getPropertyValue("--ground");
          for (const t of ["--ink", "--dim", "--c-mid", "--c-firm", "--c-flag"]) {
            const r = ratio(cs.getPropertyValue(t), g);
            if (r < 4.5) out.push(`${theme}: ${t} is ${r.toFixed(2)}:1 on --ground`);
          }
        }
        document.documentElement.removeAttribute("data-theme");
        return out;
      });
      return bad.length ? bad.join("; ") : null;
    },

    // With light stored, the page must already be light at first paint. The boot script runs in
    // <head> above the stylesheet; if it is ever moved below it, or deferred, or turned into a
    // module, this is what fails. A visual check would not: by the time a screenshot is taken
    // the body script has corrected it.
    async noFlash(page, spec) {
      const ctx = page.context();
      const probe = await ctx.browser().newPage();
      try {
        await probe.addInitScript((k) => { try { localStorage.setItem(k, "light"); } catch (e) {} }, spec.noFlash);
        // Freeze before any body script can run, then read what the first paint would use.
        await probe.route("**/*", (r) => r.continue());
        await probe.goto(spec.absolute, { waitUntil: "commit" });
        const early = await probe.evaluate(() => document.documentElement.getAttribute("data-theme"));
        if (early !== "light") return `at first paint data-theme was ${JSON.stringify(early)}, not "light"`;
        return null;
      } finally { await probe.close(); }
    },
```

`noFlash`'s value in `PAGES` is the site's storage key, so the check needs no second parameter.

- [ ] **Step 3: Append the failing tests**

```js
test("storageKeys exercises the theme control, not only the language one", () => {
  // The theme key is written by every visitor who switches. If the check never clicks the
  // control, the key is never observed and /privacy/ can omit it with every suite green.
  const src = pageChecks({ SITE: "https://x.test", BASE: "http://x.local" }).storageKeys.toString();
  assert.match(src, /#thLight/);
  assert.match(src, /#thDark/);
});

test("contrast reads the live page and checks both themes", () => {
  const src = pageChecks({ SITE: "https://x.test", BASE: "http://x.local" }).contrast.toString();
  assert.match(src, /getComputedStyle/);
  assert.match(src, /\["dark", "light"\]/);
});

test("noFlash reads the attribute before the body scripts run", () => {
  // waitUntil "commit" is the point: "load" would let the body script set the attribute and
  // the check would pass on a page that flashes.
  const src = pageChecks({ SITE: "https://x.test", BASE: "http://x.local" }).noFlash.toString();
  assert.match(src, /waitUntil: "commit"/);
  assert.doesNotMatch(src, /waitUntil: "load"|networkidle/);
});
```

Import `pageChecks` at the top: `import { pageChecks } from "@robertblust/design/verify/pages";`

- [ ] **Step 4: Run, mutate, commit**

Run `npm test`; expected up by 3. Mutate: remove the `#thLight` line from `storageKeys` (test fails); change `noFlash`'s `waitUntil` to `"load"` (test fails). Restore each.

```bash
git add blocks/header.css versions.json verify/pages.mjs package.json test/theme.test.mjs
git commit -m "The theme control's rules, and three checks that can fail"
```

- [ ] **Step 5: Bump the version, open the PR, stop**

Set `package.json` to `0.10.0` — new fences and new exports are a minor. Push the branch and open a pull request. **Do not merge and do not tag**: `main` is protected and the release is the repository owner's call. Report the PR URL and wait.

---

## Task 4: The sites adopt the palette and tokenise their literals

**Files:** in each of the three sites — `design.config.json`, `package.json`, `package-lock.json`, and each prose `index.html`.

**Interfaces:**
- Consumes: `design tokens` v5, `theme boot` v1, `theme` v1 from the package release.

- [ ] **Step 1: Re-pin and add `themeKey`**

For each site, after the package release exists:

```bash
npm install "@robertblust/design@github:robertblust/design#v0.10.0" --save-dev
```

`npm install` alone reports "up to date" and will not refetch a tag. Confirm with `node -e "console.log(require('./node_modules/@robertblust/design/package.json').version)"`.

Add `"themeKey": "rb-theme"` to each `design.config.json`, beside the existing `"langKey"`. All three use `rb-theme`; the parameter exists so no site's key is frozen into the block.

- [ ] **Step 2: Place the two new fences on all 16 prose pages**

The `theme boot` fence goes in `<head>`, immediately **above** the `<style>` element — it must precede the stylesheet. The `theme` fence goes at the end of the body, immediately after the `language` fence.

Each page must also declare `theme` in scope before the `theme` fence, next to where it declares `lang`:

```js
  var urlTheme = themeFromUrl();
  if (urlTheme) themeRemember(urlTheme);
  var theme = urlTheme || (themeStored() === "light" ? "light" : "dark");
```

Note this reads `themeFromUrl` before `theme` is assigned, exactly as the language block does with `langFromUrl`.

Then run `npm run design` in each site and confirm `npm run design:check` reports a fixed point.

- [ ] **Step 3: Replace the three literals**

Per site, in every prose page:

- `.seg button[aria-pressed="true"]{…background:#1b2231…}` → the generated fence now supplies this; confirm `design:check` rewrote it rather than editing by hand.
- `.btn.primary:hover, .btn.primary:focus-visible{background:#1b2333}` → `background:var(--press)` (3 occurrences, blust.ch only).
- `fill="#0C0E13"` → `fill="var(--ground)"` (18 occurrences). Custom properties resolve in inline SVG inside HTML; they do **not** resolve in a standalone `.svg` file loaded via `<img>`, which is why the marks are inline in the first place.

- [ ] **Step 4: Prove zero literals remain**

```bash
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/colours.mjs
```

Its prose-page rows must all read 0. Deck rows still report their 135 — those are Plan B and must not be touched here.

- [ ] **Step 5: Commit per site**

---

## Task 5: The control, `/privacy/`, and the card renderer

**Files:** in each site — 16 × `index.html`, `privacy/index.html`, `verify/check.mjs`, `export-og.mjs`.

- [ ] **Step 1: Add the control markup beside the language control**

In each prose page's `<nav>`, immediately after the existing `<div class="seg" id="langind">`:

```html
<div class="seg theme" id="thmind" role="group" aria-label="Erscheinungsbild wechseln — switch appearance"><button type="button" id="thLight" aria-pressed="false" aria-label="Light"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button><button type="button" id="thDark" aria-pressed="true" aria-label="Dark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button></div>
```

Wire both buttons where the page wires its language buttons:

```js
  document.getElementById("thLight").addEventListener("click", function(){ setTheme("light"); });
  document.getElementById("thDark").addEventListener("click", function(){ setTheme("dark"); });
  applyTheme();
```

- [ ] **Step 2: Name the key in `/privacy/`**

Each site's `/privacy/` page lists the storage keys it writes. Add `rb-theme` beside `rb-lang`, in both languages, describing it the way the existing entry describes the language key. `storageKeys` fails until this is done — correctly.

- [ ] **Step 3: Turn the new checks on**

In each site's `verify/check.mjs`, add `contrast: true` and `noFlash: "rb-theme"` to every prose page's `PAGES` entry. Do **not** add them to deck entries; decks are Plan B.

- [ ] **Step 4: Pin dark in the card renderer**

In `export-og.mjs`, before each screenshot, clear any stored theme so a card can never render light:

```js
  // Spec decision 5: cards are always dark, and pinned rather than inherited — a later change
  // to the default must not silently restyle twenty committed PNGs.
  await page.addInitScript(() => { try { localStorage.removeItem("rb-theme"); } catch (e) {} });
```

- [ ] **Step 5: Verify, and prove each new gate fires**

Per site, with a static server running **inside that repository's directory** on port 8000 (only one repo can hold it — `pkill -f "http.server"` between them), run every CI script.

Then prove the three new checks are live, restoring each after:
1. Set light `--c-mid` to `#7FA3D8` in one page's generated block → `contrast` must fail. (`design:check` will also fail; that is expected and is the point of the fence.)
2. Move the `theme boot` fence below the `<style>` element on one page → `noFlash` must fail.
3. Remove `rb-theme` from one site's `/privacy/` → `storageKeys` must fail.

- [ ] **Step 6: Confirm the cards did not move**

```bash
npm run og && npm run og:check && git status --short
```

`og.sha` stamps may move; **no `og.png` may change**. A changed PNG means a card rendered light and Step 4 did not work.

- [ ] **Step 7: Commit per site, open one PR per site, stop**

Report the three PR URLs. Do not merge — that is the repository owner's call.

---

## Self-Review

**Spec coverage.** Decision 1 (scope) — this plan is the prose half; decks are Plan B, stated in the spec's Delivery section. Decision 2 (Paper) — Task 1. Decision 3 (`--lcd` invariant) — deck-only, explicitly out of scope and called out in Global Constraints. Decision 4 (always dark) — Task 2, asserted by a test that fails on `matchMedia`. Decision 5 (cards) — Task 5 Steps 4 and 6. Decision 6 (`--c-weak` non-text-only) — recorded in the block's comment in Task 1 and deliberately excluded from the `contrast` check's token list. Decision 7 (separate fences) — Task 2, Ruling 1. Success criteria 1–5 and 7–8 map to Task 5 Step 5 and the site suites; criterion 6 to Step 6; criterion 9 to Task 4 Step 4.

**Placeholder scan.** No TBDs. Every code step carries the code. The one path that is environment-specific — the scratchpad path in Task 4 Step 4 — is a measurement script, not a deliverable; if it is missing, re-derive the count with `grep -oE '#[0-9a-fA-F]{3,8}'` over the prose pages and expect 0 outside `:root`.

**Type consistency.** `themeStored()`, `themeRemember(v)`, `themeFromUrl()`, `carryTheme(e)`, `applyTheme()`, `setTheme(v)` are defined in Task 2 and called in Tasks 4 and 5 under those exact names. Control ids `thLight` and `thDark` are used identically in `blocks/theme.js`, in `storageKeys`, and in the markup. `--press` is introduced in Task 1 and consumed in Task 3 and Task 4. `noFlash`'s `PAGES` value is the storage key string in both its definition and its use.
