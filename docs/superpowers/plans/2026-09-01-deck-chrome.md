# The Deck Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the four decks the checks the prose pages already have, then close the one fence that has never had an end marker and cut it into the two components it has always been.

**Architecture:** The `deck footer · v1` marker opens a region and never closes it, which is why its four copies have never been comparable. This plan closes it and replaces it with two fences: a **transport** block, which measurement shows is already byte-identical on all four decks, and a **lockup** block, which has two legitimate forms and uses the `parts` mechanism plan 4 built for exactly this. A third small fence takes the canvas scaler. Checks land first, because a deck is the artefact the suites watch least.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict`, zero dependencies. `@robertblust/design` as a git dependency pinned to an exact tag. Playwright for the site suites.

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md`

## Global Constraints

- The package takes **no dependencies and no devDependencies**. Never run `npm install` in it. A consuming site has dependencies by design and installs normally.
- ESM only in the package; `node:test` + `node:assert/strict`; `npm test` must exit 0.
- **No external assets, anywhere.** No font CDN, no remote stylesheet, no linked image.
- **A deck must open from a `file://` URL, with the repository intact, and present.** Relative paths upward are allowed and already used — a deck reads the root `fonts/` that way. What is forbidden is needing a server.
- Sites pin `github:robertblust/design#vX.Y.Z` — an exact **tag**, never a commit SHA. A SHA fails Dependabot's `pinned_ref_looks_like_version?` and the site silently never learns a release happened.
- Stage by name. Never `git add -A` or `git add .`.
- Merge with `gh pr merge --merge`. **Never `--squash`.**
- Do not merge any pull request. Open them and stop.
- Never mention closed-source predecessor projects.
- Never print an environment variable's value.
- The git author must be `robert.blust@flatland.ch`.

---

## What the measurement found, and where it corrects the spec

The spec describes the deck footer as *"the transport bar plus a nine-or-thirty-one-line lockup wearing one name"*, and puts the transport at **"162 / 150 / 154 / 160 lines, four forms, all different"**. The first half is right and the second is wrong.

Those line counts are the whole fenced region — its prose comment and the lockup included. Comparing the CSS **rules** rather than the lines:

| the deck-footer region | |
| --- | --- |
| selectors in it | **62** |
| identical on all four decks | **47** — every transport rule among them |
| the lockup | **2 forms** — blust.ch 13 rules, companygraph + guestgraph 16, each internally byte-identical |
| genuinely drifted | **one rule**, `.lcd:has(.n.msg){display:flex}`, on blust.ch's two decks only |
| whitespace-only difference | one media query — same declarations, different indentation |

**The transport bar has not drifted.** All four decks' transport CSS is byte-identical today, which makes this the cheapest fence in the whole spec: it needs no reconciliation, only an end marker and a source.

**The fence has never had an end marker.** `deck footer · v1` opens a region that runs until whatever comes next. That is why nothing has ever been able to compare the four copies, and it is the reason the spec calls closing it *"the first fix, and it is worth doing whether or not the rest of this spec is adopted."*

### The canvas scaler is a third, tiny fence

Each deck's last `<script>` block is the `fit()` function — **19 lines in all four**, in two forms differing by a single comment word: blust.ch says *"the fixed-height canvas"*, the other two say *"the 1600×900 canvas"*. blust.ch's is the accurate one. `CLAUDE.md` records that a fixed 16:9 canvas was a real bug — it *"put 96px of black top and bottom on a 4:3 screen"* — and that only the height is pinned while the width follows the screen. The other two decks carry a comment describing the behaviour that was removed.

### Why the runtime is not in this plan

The spec puts the runtime in this tier. Measuring it says otherwise: **349 of ~420 lines are identical on all four decks**, in six contiguous runs — but the ~65 that differ are **behavioural, not cosmetic**:

- companygraph's language buttons call `e.stopPropagation()`; blust.ch's do not, and companygraph's comment explains why it matters.
- companygraph binds `N` and `L` keys; blust.ch binds neither.
- blust.ch sets `var clipsSeen = true` outright; companygraph sets `null` and resolves it lazily in a `hasClips()` function, to avoid a network request before play is pressed.

Each has a documented reason, and reconciling them means choosing a behaviour per difference rather than taking a majority. That is a plan's worth of judgment on its own, and it is the tier the spec itself calls *"the one with the least standing behind it."* Splitting it out lets this plan ship a repair that is nearly free, and lets the runtime get the attention it needs.

It also settles a question this plan cannot: `.lcd:has(.n.msg){display:flex}` exists only on blust.ch's decks, and no deck carries `.n.msg` in static markup — it is created at runtime. Whether that rule is blust.ch-specific or a feature the other two are missing depends on what the shared runtime does, which is the next plan's business. **It stays outside the fence here.**

---

## File Structure

**In `/Users/rob/git/robertblust/design`:**

| file | responsibility |
| --- | --- |
| `blocks/deck-transport.css` | new — the transport bar and shared chrome, byte-identical on all four decks today |
| `blocks/deck-lockup.css` | new — the lockup's shared 13 rules, with a `{{second}}` slot for its two forms |
| `blocks/deck-lockup-two.css` | new — the second tier, spliced in under one variant only |
| `blocks/deck-fit.js` | new — the 19-line canvas scaler, comment reconciled |
| `lib/fences.mjs` | three new `FENCES` entries |
| `versions.json` | `transport`, `lockup`, `fit` |
| `test/blocks.test.mjs` | the new blocks' assertions |

**In each site:**

| file | responsibility |
| --- | --- |
| each deck | the open-ended `deck footer` marker replaced by three closed fences |
| `verify/design.mjs` | new `opensFromFile`; `footerVersion` and `FOOTER_VERSION` **deleted**, superseded by `design:check` |
| `verify/check.mjs` | `PAGES` — decks gain `storageKeys`, `opensFromFile`, and the new fence names |

`verify/design.mjs` is byte-identical across the three repositories and must stay so.

---

### Task 1: The checks the decks have never had

**Files:**
- Modify: each site's `verify/design.mjs` (add `opensFromFile`)
- Modify: each site's `verify/check.mjs` (`storageKeys: true` and `opensFromFile: true` on every deck)

**Interfaces:**
- Consumes: `DESIGN_CHECKS`, and the `fences` check plan 4 added.
- Produces: `opensFromFile` in `DESIGN_CHECKS`, keyed off `spec.opensFromFile`. Tasks 6–8 rely on it to prove the extraction did not break the one constraint a served page cannot test.

The spec is explicit that this ordering is not optional: *"Before extracting anything, the decks get the checks the prose pages already have."* A deck is the artefact the suites watch least, and the constraint that matters most about it — that it opens from `file://` — is the one a served page can never exercise.

- [ ] **Step 1: Demonstrate the `storageKeys` gap**

`storageKeys` compares every key a page writes against what `/privacy/` declares. Confirm no deck is armed:

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
grep -n "path: \"/talks/" verify/check.mjs | grep -c storageKeys
```

Expected: **0**. The four decks write `rb-lang`, `cg-lang` and `gg-lang` and are the only pages never checked against the privacy page. Record the count for each of the three sites in the report.

- [ ] **Step 2: Arm `storageKeys` on every deck**

Add `storageKeys: true` to each deck's entry in `PAGES`, in all three sites. Then run each suite:

```bash
python3 -m http.server 8000 >/dev/null 2>&1 &
npm run verify
```

Expected: pass. **If a deck fails, it is writing a key `/privacy/` does not name — stop and report it.** That is a real finding and this plan does not get to decide it quietly.

- [ ] **Step 3: Write the `file://` smoke check**

Add to `DESIGN_CHECKS` in `verify/design.mjs`, after `fences`:

```js
  // The one guarantee a served page cannot test. A deck must present with no server: opened
  // from the filesystem, with the repository intact, it renders its first slide, loads its
  // faces from the root `fonts/` by relative path, and its runtime runs. Relative paths
  // upward are allowed and already used; what is forbidden is needing a server.
  //
  // Armed on decks only. `spec.opensFromFile` names nothing — the page's own path is enough,
  // because the check re-opens the same file the rest of the suite reached over http.
  async opensFromFile(page, spec) {
    const file = "file://" + path.join(SITE_ROOT, spec.path.replace(/^\/|\/$/g, ""), "index.html");
    const errors = [];
    const probe = await page.context().newPage();
    probe.on("pageerror", (e) => errors.push(e.message));
    await probe.goto(file);
    await probe.evaluate(() => document.fonts.ready);
    const seen = await probe.evaluate(() => ({
      slides: document.querySelectorAll(".slide").length,
      firstVisible: !!document.querySelector(".slide"),
      faceLoaded: [...document.fonts].some((f) => f.status === "loaded"),
      scaled: getComputedStyle(document.querySelector(".deck") || document.body).transform,
    }));
    await probe.close();
    if (errors.length) return `opened from file:// with JS errors: ${errors.join(" | ")}`;
    if (!seen.slides) return "opened from file:// but rendered no slides";
    if (!seen.faceLoaded) return "opened from file:// but loaded no webfont — check the relative fonts/ path";
    return null;
  },
```

`SITE_ROOT` does not exist yet in `design.mjs`. Add it at the top, derived from the module's own location so it needs no configuration:

```js
import path from "node:path";
import { fileURLToPath } from "node:url";
// design.mjs lives in <site>/verify/, so the site root is one level up. Derived rather than
// configured: a hardcoded path would differ per repository in a file that must not.
const SITE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
```

- [ ] **Step 4: Arm it and prove it can fail**

Add `opensFromFile: true` to each deck's `PAGES` entry. Run the suite — expected: pass.

Then break it in the way that matters, and watch it fail:

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
cp talks/mental-model/index.html /tmp/deck.bak
python3 -c "
p='talks/mental-model/index.html'; t=open(p,encoding='utf-8').read()
t=t.replace('../../fonts/','/fonts/')          # root-absolute: works over http, dead under file://
open(p,'w',encoding='utf-8').write(t)"
npm run verify; echo "exit=$?"
cp /tmp/deck.bak talks/mental-model/index.html
git diff --stat
```

Expected: **FAIL**, naming `/talks/mental-model/` and reporting no webfont loaded — while every other check on that page still passes, because a root-absolute path is correct over http. That asymmetry is the whole reason this check exists. `git diff --stat` must be empty afterwards.

**If it passes with root-absolute paths, the check is not doing its job — stop and report.**

- [ ] **Step 5: Port to all three sites and run every suite**

`verify/design.mjs` is byte-identical across the three. Copy it, prove it:

```bash
md5 /Users/rob/git/{robertblust/robertblust.github.io,companygraph/companygraph.github.io}/verify/design.mjs \
    /Users/rob/git/guestgraph/guestgraph.github.io/verify/design.mjs
```

Expected: three identical hashes. Run all three suites; expected: three passes.

- [ ] **Step 6: Commit, one per repository**

```bash
git add verify/design.mjs verify/check.mjs
git commit -m "The decks get the two checks every other page already had

storageKeys compares what a page writes against what /privacy/ declares.
No deck was armed with it, in any of the three repositories — so the four
pages that write rb-lang, cg-lang and gg-lang were the only ones never
checked against the page that promises what this site stores.

opensFromFile is the other half, and it is the guarantee a served page
cannot test at all: a deck must present with no server. Rewriting one
deck's ../../fonts/ to /fonts/ — correct over http, dead under file:// —
now fails that deck and nothing else, which is the asymmetry the check
exists for. Demonstrated before this commit."
```

---

### Task 2: Close the fence, and cut it in two

**Files:**
- Create: `/Users/rob/git/robertblust/design/blocks/deck-transport.css`
- Create: `/Users/rob/git/robertblust/design/blocks/deck-lockup.css`
- Create: `/Users/rob/git/robertblust/design/blocks/deck-lockup-two.css`
- Modify: `/Users/rob/git/robertblust/design/lib/fences.mjs`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/blocks.test.mjs`

**Interfaces:**
- Consumes: `blockFor(name, variant, params = {})` and the `parts` mechanism, both as plan 4 released them. A `parts` entry is `{ slot: { file, variants: [...] } }` and its content is spliced only for the named variants.
- Produces: fences `"deck transport"` (`key: "transport"`, `variants: null`, `closes: null`) and `"deck lockup"` (`key: "lockup"`, `variants: ["one", "two"]`, `closes: null`, `parts: { second: { file: "blocks/deck-lockup-two.css", variants: ["two"] } }`). `versions.json` gains `"transport": "v1"` and `"lockup": "v1"`.

Work on the package's `main`, as plans 1–4 did.

- [ ] **Step 1: Extract the transport block, unchanged**

All four decks' transport CSS is byte-identical, so this block is a transcription, not a reconciliation. Take it verbatim from `/Users/rob/git/companygraph/companygraph.github.io/talks/intro/index.html` — the 47 rules that are identical on all four, excluding every `.name*` rule and excluding `.lcd:has(.n.msg)`.

Verify before writing, rather than trusting this instruction:

```bash
cd /Users/rob/git/robertblust/design
node -e '
const fs=require("fs");
const files={rb:"/Users/rob/git/robertblust/robertblust.github.io/talks/mental-model/index.html",
             cg:"/Users/rob/git/companygraph/companygraph.github.io/talks/intro/index.html",
             gg:"/Users/rob/git/guestgraph/guestgraph.github.io/talks/intro/index.html"};
for (const [k,f] of Object.entries(files)) {
  const t=fs.readFileSync(f,"utf8");
  const m=t.match(/\.transport\{[\s\S]*?\}/);
  console.log(k, m ? require("crypto").createHash("md5").update(m[0]).digest("hex").slice(0,8) : "none");
}'
```

Expected: three identical hashes. If they differ, the transport **has** drifted and this task's premise is wrong — stop and report.

Write `blocks/deck-transport.css` with the standard marker shape, two-space indented like every other block, its version typed into line 1:

```css
  /* ─── deck transport · v1 · {{variant}} ─────────────────────────────────
     Generated from @robertblust/design — edit it there and run `npm run design`.

     The transport bar and the chrome around it, byte-identical on all four decks
     and now generated rather than copied. It was inside a marker that opened a
     region and never closed it, which is why four copies of it could never be
     compared. That is fixed here: this fence has both markers.

     The lockup that used to share this marker is its own fence now — see
     `deck lockup`. They were two components wearing one name, and only one of
     them legitimately differs between sites. */
```

followed by the 47 shared rules verbatim.

- [ ] **Step 2: Extract the lockup, in two forms**

blust.ch's decks carry a one-tier lockup (13 rules): the mark plus **Robert Blust**, and nothing after it. companygraph's and guestgraph's carry two tiers (16 rules): the product lockup, then `· ROBERT BLUST`. The reason is in the decks' own comment and it is good — on those sites the product and the presenter are different names; on blust.ch they are the same name, and repeating it reads *"Robert Blust · ROBERT BLUST"*.

`blocks/deck-lockup.css` holds the 13 rules both forms share, with `{{second}}` on its own line at column 0 where the second tier goes. `blocks/deck-lockup-two.css` holds the 3 rules only the two-tier form has. Variant `one` gets the empty string; variant `two` gets the file.

- [ ] **Step 3: Write the failing tests**

Append to `test/blocks.test.mjs`:

```js
test("the deck transport block is one form — it never drifted", () => {
  const css = blockFor("deck transport", null);
  assert.match(css, /\.transport\{/);
  assert.doesNotMatch(css, /\.name\b/, "the lockup belongs to its own fence");
  assert.doesNotMatch(css, /\.lcd:has\(/, "the one genuinely drifted rule stays out of the fence");
});

test("the two deck lockup variants differ only by the second tier", () => {
  const one = blockFor("deck lockup", "one");
  const two = blockFor("deck lockup", "two");
  assert.notEqual(one, two);
  assert.doesNotMatch(one, /nperson|nsep/, "the one-tier form carries no second tier");
  assert.match(two, /nperson|nsep/);
});

test("the one-tier lockup leaves no blank line where the second tier was", () => {
  assert.doesNotMatch(blockFor("deck lockup", "one").split("*/")[1] ?? "", /\n\s*\n/);
});

test("a deck lockup variant that does not exist is refused", () => {
  assert.throws(() => blockFor("deck lockup", "credit"), /only knows|needs a variant/);
});

test("both new deck fences carry balanced braces", () => {
  for (const [n, v] of [["deck transport", null], ["deck lockup", "one"], ["deck lockup", "two"]]) {
    const css = blockFor(n, v);
    assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length, `${n} ${v}`);
  }
});
```

- [ ] **Step 4: Run and watch them fail**

```bash
npm test 2>&1 | tail -20
```

Expected: FAIL — `no such fence: deck transport`.

- [ ] **Step 5: Register both fences**

In `lib/fences.mjs`, after the `prose footer` entry:

```js
  // The transport bar, and the chrome around it. No variants: all four decks take identical
  // bytes, which measurement confirmed before this fence existed rather than after.
  "deck transport": {
    key: "transport", source: "blocks/deck-transport.css", version: versions.transport,
    variants: null, closes: null,
  },
  // The lockup that shared the old `deck footer` marker with the transport. Two tiers on the
  // product sites, where the product and the presenter are different names; one on blust.ch,
  // where they are the same name and the second tier would read "Robert Blust · ROBERT BLUST".
  "deck lockup": {
    key: "lockup", source: "blocks/deck-lockup.css", version: versions.lockup,
    variants: ["one", "two"], closes: null,
    parts: { second: { file: "blocks/deck-lockup-two.css", variants: ["two"] } },
  },
```

In `versions.json`, add `"transport": "v1"` and `"lockup": "v1"`.

- [ ] **Step 6: Run the tests**

```bash
npm test 2>&1 | tail -5
```

Expected: all pass. The per-fence version assertion added in plan 4 now covers both new fences — if either block's line 1 disagreed with `versions.json`, it would fail here.

- [ ] **Step 7: Update the fence-name enumeration**

`test/fences.test.mjs` has a test naming exactly the fences this release ships. Two more means the list and the title's number change. Nothing else in that test changes.

- [ ] **Step 8: Commit**

```bash
git add blocks/deck-transport.css blocks/deck-lockup.css blocks/deck-lockup-two.css \
        lib/fences.mjs versions.json test/blocks.test.mjs test/fences.test.mjs
git commit -m "Two components were wearing one name, and the name never closed

`deck footer · v1` opened a region and never ended it. That is why four
copies of it have never been comparable, and it is why the spec called
closing it the first fix worth doing whether or not anything else was.

Closing it showed what was inside: a transport bar that is byte-identical
on all four decks and has never drifted, and a lockup that legitimately
differs — one tier on blust.ch, two on the product sites, because there
the product and the presenter are different names and here they are the
same name.

The spec said the transport was four forms, all different. That was the
whole region measured by lines, comment and lockup included. By rules it
is one form, so this fence needs no reconciliation at all — only an end
marker and a source."
```

---

### Task 3: The canvas scaler, and the comment that describes a bug that was fixed

**Files:**
- Create: `/Users/rob/git/robertblust/design/blocks/deck-fit.js`
- Modify: `/Users/rob/git/robertblust/design/lib/fences.mjs`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/blocks.test.mjs`

**Interfaces:**
- Consumes: `blockFor`, `FENCES` as Task 2 leaves them.
- Produces: fence `"deck fit"` (`key: "fit"`, `source: "blocks/deck-fit.js"`, `variants: null`, `closes: null`). `versions.json` gains `"fit": "v1"`.

Each deck's last `<script>` block is 19 lines in all four, in two forms differing by one comment word.

- [ ] **Step 1: Confirm the difference is exactly one word**

```bash
diff <(sed -n '/Scale the/,/^$/p' /Users/rob/git/robertblust/robertblust.github.io/talks/mental-model/index.html | head -20) \
     <(sed -n '/Scale the/,/^$/p' /Users/rob/git/companygraph/companygraph.github.io/talks/intro/index.html | head -20)
```

Expected: one differing line — `// Scale the fixed-height canvas to the screen.` against `// Scale the 1600×900 canvas to the screen.` If more differs, record it and reconcile deliberately rather than assuming.

- [ ] **Step 2: Take blust.ch's wording, and say why in the block**

blust.ch's is the accurate one. `CLAUDE.md` records that a fixed 16:9 canvas was a real bug — *"A fixed 16:9 canvas put 96px of black top and bottom on a 4:3 screen, which is the wrong trade on the minimum supported size"* — and that only the height is pinned at 900 while the width follows the screen's aspect. Two decks still carry a comment describing the behaviour that was removed.

Write `blocks/deck-fit.js` with the standard marker shape and the 19 lines, taking `fixed-height` and adding one sentence recording that the other wording described a fixed 16:9 canvas that no longer exists.

- [ ] **Step 3: Write the failing test**

```js
test("the deck fit block describes the canvas that exists, not the one that was removed", () => {
  const js = blockFor("deck fit", null);
  assert.match(js, /fixed-height/);
  assert.doesNotMatch(js, /1600×900|1600x900/,
    "a fixed 16:9 canvas was the bug — it letterboxed a 4:3 screen");
});
```

- [ ] **Step 4: Run and watch it fail, then register and pass**

```bash
npm test 2>&1 | tail -10
```

Expected: FAIL — `no such fence: deck fit`. Then add to `FENCES`:

```js
  // The canvas scaler, last script in every deck. 19 lines, identical on all four but for a
  // comment: two decks described a fixed 1600×900 canvas, which is the shape that letterboxed
  // a 4:3 screen and was removed. Only the height is pinned; the width follows the screen.
  "deck fit": {
    key: "fit", source: "blocks/deck-fit.js", version: versions.fit,
    variants: null, closes: null,
  },
```

and `"fit": "v1"` to `versions.json`. Re-run: expected all pass. Update the fence-name enumeration test again.

- [ ] **Step 5: Commit**

```bash
git add blocks/deck-fit.js lib/fences.mjs versions.json test/blocks.test.mjs test/fences.test.mjs
git commit -m "The canvas scaler, and two decks describing a canvas that was removed

19 lines, identical on all four decks but for one comment word. blust.ch
says the canvas is fixed-height; the other two say it is 1600×900.

blust.ch is right, and the difference is not pedantry: a fixed 16:9 canvas
is the shape that put 96px of black top and bottom on a 4:3 screen, which
is why only the height is pinned now and the width follows the screen.
Two decks carried a comment describing the bug as though it were the
design."
```

---

### Task 4: Release 0.5.0

**Files:** `/Users/rob/git/robertblust/design/package.json`

**Interfaces:**
- Consumes: the three fences Tasks 2 and 3 added.
- Produces: the commit Task 5 tags and Tasks 6–8 pin.

- [ ] **Step 1: Bump and test**

`package.json` to `0.5.0` — a minor, because adopting it requires each site to run `npm run design` and commit what changed.

```bash
cd /Users/rob/git/robertblust/design
npm test 2>&1 | tail -5
```

Expected: all pass.

- [ ] **Step 2: Commit and push**

```bash
git add package.json
git commit -m "Release 0.5.0: the deck transport, lockup and fit blocks"
git push
```

- [ ] **Step 3: Report and stop.** Do not tag; do not create a release.

---

### Task 5: Tag the release

**Files:** none. The human operator's task.

- [ ] **Step 1: Confirm CI is green on the package's `main`**
- [ ] **Step 2: Tag `v0.5.0` and push the tag**
- [ ] **Step 3: Create the GitHub release**

Tasks 6–8 pin `github:robertblust/design#v0.5.0`. A commit SHA is not acceptable.

---

### Task 6: blust.ch's two decks adopt — lockup variant `one`

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `talks/mental-model/index.html`, `talks/essential-complexity/index.html`
- Modify: `verify/check.mjs`, `verify/design.mjs`

**Interfaces:**
- Consumes: `@robertblust/design@0.5.0`; fences `deck transport`, `deck lockup · one`, `deck fit`; the `fences` and `opensFromFile` checks from Task 1.
- Produces: nothing Tasks 7 and 8 consume.

- [ ] **Step 1: Pin the release**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
npm install github:robertblust/design#v0.5.0
```

A real install, not `--package-lock-only` — that moves the lockfile and leaves `node_modules` on the old release, so the sync would write the previous version's bytes while the lockfile claimed the new one.

- [ ] **Step 2: Replace the open-ended marker with three closed fences**

**Where the markers go, and what must not move.** The old `deck footer · v1` marker never closed,
so "the region it owned" is not a well-defined thing — its tail runs on into the speaker-notes
drawer and the slide-layout classes that share the same mobile breakpoints. Measured on all three
sites: between the marker and the next fence there are 81–91 CSS rules, of which the package emits
67–70. The remainder is **not** a gap in the package; it is unrelated CSS the open marker swept up.

So do not wrap "everything after the old marker". Place each fence around **exactly the rules that
fence emits**, and leave everything else where it is, outside all three fences. Concretely: the
speaker-notes drawer (`.notes*`, `.deck.notes-open *`), the slide-layout rules, and
`.lcd:has(.n.msg)` all stay per-deck and unfenced. Verify after syncing that they are still present
and unchanged — a deleted notes drawer is the failure this instruction exists to prevent.

The old marker's own text is deleted along with the marker. Its claim that the block is copied
"because a deck opens from `file://`, so there is nothing to import" is false — a relative `<link>`
and a relative `@font-face` both work from `file://`, measured. Copies are a deliberate choice here,
not a technical necessity, and the new blocks say so.

The marker is replaced by:

- `deck transport · v1 · shared`, wrapping the transport rules
- `deck lockup · v1 · one`, wrapping the lockup rules
- `deck fit · v1 · shared`, wrapping the last `<script>` block

**`.lcd:has(.n.msg){display:flex}` stays outside every fence**, in the deck's own CSS. It exists only on these two decks, no deck carries `.n.msg` in static markup, and whether it is blust.ch-specific or a feature the others lack depends on the shared runtime — which the next plan owns. Leave a one-line comment beside it saying so.

- [ ] **Step 3: Retarget `footerVersion`**

`verify/design.mjs`'s `footerVersion` asserts a `deck footer · vN` marker that will no longer exist, against a hardcoded `FOOTER_VERSION` constant.

What replaces it is **`design:check`**, not `fences`. Be precise about this, because the two are easy to confuse: `fences` matches `─── <name> · v\d+` and so asserts *presence*, accepting **any** version — it is a coverage check, not a version check. `design:check` compares each fenced block byte-for-byte against the installed package, and the version is part of those bytes, so a deck whose marker lags the pinned release fails there. That is strictly stronger than `FOOTER_VERSION` ever was: the constant had to be edited by hand in three repositories, which is the drift it was meant to catch.

So **delete `footerVersion` and `FOOTER_VERSION`**, and add `"deck transport"`, `"deck lockup"` and `"deck fit"` to each deck's `fences` array.

Say so in the commit — a check deleted without a reason is indistinguishable from a check lost.

- [ ] **Step 4: Sync and read the diff**

```bash
npm run design
git diff --stat
git diff talks/mental-model/index.html
```

Expected beyond the marker lines: **nothing**. Both decks already carry the transport verbatim and the one-tier lockup verbatim. If anything else moves, stop and report the diff.

- [ ] **Step 5: Run the suite, including the two new checks**

```bash
python3 -m http.server 8000 >/dev/null 2>&1 &
npm run verify
npm run design:check; echo "exit=$?"
```

Expected: both pass, with `opensFromFile` exercising both decks.

- [ ] **Step 6: Open both decks from `file://` yourself**

The check is automated; this is the human-visible confirmation that the plan's hardest constraint still holds.

```bash
open "file://$(pwd)/talks/mental-model/index.html"
```

Confirm the first slide renders, the type is Bricolage rather than a system face, and the transport bar is present. Report what you saw.

- [ ] **Step 7: Re-render the share cards, commit, open a pull request**

```bash
npm run og && npm run og:check; echo "exit=$?"
```

Stage by name, including every `og.png` and `og.sha` that moved. Write the pull request body into a file and pass `--body-file`; never `--fill`. The body must show that the diff is markers-only, and say that `footerVersion` was deleted because `fences` subsumes it.

---

### Task 7: companygraph.io's deck adopts — lockup variant `two`

**Files:**
- Modify: `package.json`, `package-lock.json`, `talks/intro/index.html`, `verify/check.mjs`, `verify/design.mjs`

**Interfaces:**
- Consumes: `@robertblust/design@0.5.0`; fences `deck transport`, `deck lockup · two`, `deck fit`.
- Produces: nothing.

- [ ] **Step 1: Pin the release**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
npm install github:robertblust/design#v0.5.0
```

- [ ] **Step 2: Replace the marker with three closed fences**

Same three as blust.ch, with `deck lockup · v1 · two` — this site's lockup carries the second tier, because the product and the presenter are different names here.

- [ ] **Step 3: Delete `footerVersion` and `FOOTER_VERSION`, arm the three fence names**

`verify/design.mjs` must stay byte-identical across the three repositories. Copy the finished file from blust.ch rather than re-editing it, and prove the md5s match.

- [ ] **Step 4: Sync and read the diff**

```bash
npm run design
git diff --stat
```

Expected beyond markers: **the `fit` block's comment changes** — `1600×900` becomes `fixed-height`, because this deck carried a comment describing a canvas shape that was removed. Nothing else.

- [ ] **Step 5: Run the suite, open the deck from `file://`, re-render the cards, commit, open a pull request**

Same shape as Task 6, Steps 5–7. The pull request body should carry the `fit` comment's before and after — it is the only content change on this site.

---

### Task 8: guestgraph.io's deck adopts — lockup variant `two`

**Files:**
- Modify: `package.json`, `package-lock.json`, `talks/intro/index.html`, `verify/check.mjs`, `verify/design.mjs`

**Interfaces:**
- Consumes: `@robertblust/design@0.5.0`; fences `deck transport`, `deck lockup · two`, `deck fit`.
- Produces: the cross-site assertion in Step 6, which is this plan's success criterion.

- [ ] **Steps 1–5:** identical in shape to Task 7 — pin, fence, delete `footerVersion`, sync, verify. Expected content change beyond markers: the `fit` comment only.

- [ ] **Step 6: Assert the whole point, across all three repositories**

```bash
python3 - <<'PY'
import re, hashlib, os
ROOTS = {"rb": "/Users/rob/git/robertblust/robertblust.github.io",
         "cg": "/Users/rob/git/companygraph/companygraph.github.io",
         "gg": "/Users/rob/git/guestgraph/guestgraph.github.io"}
for fence in ["deck transport", "deck lockup", "deck fit"]:
    seen = {}
    for k, root in ROOTS.items():
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if d not in ("node_modules", ".git", "tmp", ".superpowers")]
            if "index.html" not in fn: continue
            p = os.path.join(dp, "index.html"); t = open(p, encoding="utf-8").read()
            if 'class="slide' not in t: continue          # decks only
            m = re.search(rf"─── {fence} ·.*?─── end {fence} ───+\s*\*/", t, re.S)
            if not m: print(f"   MISSING {fence} in {k}:{os.path.relpath(p, root)}"); continue
            body = re.sub(r"· (one|two|shared) ", "· V ", m.group(0))
            seen.setdefault(hashlib.md5(body.encode()).hexdigest(), []).append(k)
    print(f"{fence}: {len(seen)} form(s) over {sum(len(v) for v in seen.values())} decks")
    for h, ks in seen.items(): print(f"   {h[:8]}  {len(ks)} decks  {'+'.join(sorted(set(ks)))}")
PY
```

Expected: `deck transport` **1 form over 4 decks**; `deck fit` **1 form over 4 decks**; `deck lockup` **2 forms** — one deck-pair on blust.ch, two decks on the product sites.

Report the output verbatim. If the numbers differ, say so plainly rather than explaining them away.

- [ ] **Step 7: Commit and open a pull request**, with the Step 6 output in the body.

---

## Rulings taken while writing this plan

**1. The runtime is not in this plan.** The spec puts it in this tier, but its ~65 non-shared lines are behavioural — `stopPropagation` on one site's language buttons, two extra key bindings, and two different strategies for detecting audio clips — each with a documented reason. Reconciling them is a plan's worth of judgment. *Cost if wrong:* the deck tier takes two plans instead of one, and ~2,000 lines of duplicated runtime stay duplicated for one plan longer.

**2. `.lcd:has(.n.msg){display:flex}` stays out of every fence.** It exists on blust.ch's decks only, no deck carries `.n.msg` in static markup, and whether the other two are missing a feature depends on the shared runtime. *Cost if wrong:* one rule stays per-deck that could have been shared, and the next plan has to move it.

**3. `footerVersion` and `FOOTER_VERSION` are deleted rather than retargeted**, and what replaces them is `design:check`, not `fences`. I wrote the opposite first and it was wrong: `fences` matches `· v\d+`, so it accepts any version and asserts only presence. The version is covered because `design:check` compares fenced bytes against the installed package and the marker is part of those bytes — which is stronger than a `FOOTER_VERSION` constant that had to be hand-edited in three repositories. *Cost if wrong:* a check is lost rather than replaced, which is why each adoption task says to state the reason in the commit and why Task 6 Step 5 runs `design:check` explicitly.

**3b. `fences` accepting any version is a real gap, and this plan does not close it.** The final review of plan 4 already logged it as follow-up: generalising `fences` to assert `v${FENCES[name].version}` would make it strictly stronger and would retire `tokenVersion` too. It belongs with the other package follow-ups, not bolted onto a deck plan. *Cost if wrong:* between a release and a site's sync, a stale marker is caught by `design:check` in CI but not named by the page-level check.

**4. The transport is transcribed, not reconciled.** Measurement says all four copies are byte-identical, and Task 2 Step 1 re-checks that before writing anything. *Cost if wrong:* the fence would silently impose one deck's transport on the others — which is why the step is a gate that stops the task rather than a note.

**5. `blocks/deck-fit.js` takes blust.ch's comment wording.** The other two describe a fixed 1600×900 canvas, which is the shape that letterboxed a 4:3 screen and was removed. *Cost if wrong:* a comment on four decks says "fixed-height" where someone wanted the exact numbers — recoverable in a comment edit.

---

## Self-review

**Spec coverage.** This plan implements the chrome half of tier 2b: closing the `deck footer` fence, which the spec calls the first fix worth doing on its own, and cutting it into the transport and lockup it has always been. It also lands the two checks the spec says must come **before** any extraction — `storageKeys` on all four decks, and a `file://` smoke test — which closes the coverage gap the spec's "And a coverage gap in the checks" paragraph names.

It corrects the spec on one measured point: the transport bar has not drifted. The runtime half of tier 2b is deferred to its own plan, with the reason stated above rather than left implicit.

Not covered, and not claimed: the deck runtime, tier 3 (imported check bodies, `head.mjs`), tier 4 (the card harness), and the branch ruleset on `robertblust/design` that criterion 13 puts on the day the last plan lands.

**Placeholder scan.** No "TBD", no "handle edge cases", no "similar to Task N" standing in for code. Two places name a file the executor writes rather than inlining it — the pull-request bodies in Tasks 6–8, whose content depends on the diff each produces. Task 8's Steps 1–5 refer to Task 7's shape; that is a deliberate exception to the no-cross-reference rule, because the two tasks are the same six commands against a different repository and repeating them verbatim would invite them to drift apart.

**Type consistency.** `opensFromFile` and `fences` are read as `spec.opensFromFile` and `spec.fences` throughout. Fence names are `"deck transport"`, `"deck lockup"` and `"deck fit"` in every task, with `versions.json` keys `transport`, `lockup` and `fit` — name and key differ deliberately, as they already do for `"design tokens"`/`tokens`. `blockFor(name, variant, params = {})` and the `parts` shape are exactly as plan 4 released them.

**One risk worth naming.** Task 2 Step 1 asserts the transport is byte-identical across all four decks before anything is written. If it is not, this plan's central claim is wrong and Task 2 must stop rather than reconcile quietly — which is why that step is written as a gate.
