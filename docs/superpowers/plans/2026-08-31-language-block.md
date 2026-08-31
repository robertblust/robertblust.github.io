# The language and storage block — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give one source to the 37-line block that carries a reader's language across three domains — present on all 20 pages, in two dialects, behind no fence, with no version and no check — and teach the package its first per-site parameter along the way.

**Architecture:** Three moves, in order. The two dialects are unified by renaming the sixteen prose pages toward the decks' naming (the constrained side). The block then gets fence markers it has never had. Finally the package grows a **parameter**: `blockFor` learns to substitute a value that comes from the consuming site's own `design.config.json` rather than from the package, because the storage key legitimately differs per origin — and `planFences` learns to read that config.

**Tech Stack:** Node 22+, ESM, `node:test` with `node:assert/strict`, no dependencies. Line-and-string work only — no HTML parser, no JS parser.

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md`

**This is plan 3 of 5.** Plans 1 and 2 are merged: `@robertblust/design` is at `v0.2.1`, and 39 fences across 20 pages already have one source.

### The measurements this plan rests on

Taken from the three working trees after plan 2 merged, by hashing the actual bytes:

| | pages | state |
| --- | --- | --- |
| **prose dialect** (`KEY`/`stored`/`remember`) | 16 | **15 byte-identical**; `guestgraph.io/talks/index.html` differs by quote style alone |
| **deck dialect** (`LANG_KEY`/`langStored`/`langRemember`) | 4 | all 4 byte-identical, all single-quoted |
| difference between the dialects | — | **exactly three lines**, all identifier names |
| call sites outside the block, per prose page | 16 | **3** each — `remember(urlLang)`, `stored()`, `remember(lang)` |
| `FAMILY` — the regex naming the three domains | — | **23 places**: 20 pages + `carriesLang` in three `check.mjs` |
| fence markers | 0 | **none of the 20 pages has ever had one** |

The three lines that differ:

```js
// prose (16 pages), with `var KEY = "rb-lang";` on the line above the block
  function stored(){ try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(v){ try { localStorage.setItem(KEY, v); } catch (e) {} }

// deck (4 pages)
  var LANG_KEY = "rb-lang";
  function langStored(){ try { return localStorage.getItem(LANG_KEY); } catch (e) { return null; } }
  function langRemember(v){ try { localStorage.setItem(LANG_KEY, v); } catch (e) {} }
```

**Unify toward the deck.** A deck needs the short names `KEY`, `stored` and `remember` free for its transport code, so its naming is the constrained one, and renaming *toward* a constraint cannot break the unconstrained side. Sixteen prose pages get the longer names; the four decks are already correct and are not touched by Task 1.

### The one genuinely new capability

Every parameter the package has substituted so far comes **from the package**: `{{variant}}` is chosen from a fixed two-member set that `blockFor` itself owns. `langKey` is different in kind — it comes **from the consuming site**, and `planFences(siteRoot)` does not read `design.config.json` at all today.

**And the key can never be derived.** `blust.ch` stores under `rb-lang`; nothing about the domain yields that. More to the point, **changing a storage key silently discards every visitor's saved language** — it is a constant with a migration cost, so it belongs where changing it is a visible act, in the site's own config.

## Global Constraints

- **The package takes NO dependencies and NO devDependencies.** Do not run `npm install` in it.
- `"type": "module"`, ESM only. Tests are `node:test` + `node:assert/strict`; `npm test` runs `node --test` with no arguments and must exit 0.
- **Distribution is a git dependency**: sites pin an exact **tag**, `github:robertblust/design#vX.Y.Z`. Never a commit SHA — `dependabot-core` only bumps a ref that `pinned_ref_looks_like_version?` accepts, and a SHA is not one, so a SHA-pinned site silently never learns a release happened.
- **`design sync --check` must never write.** Exit 0 all match / 1 drift / 2 usage or config error.
- **A deck opens from `file://` with no network.** Nothing here may add a `<link>`, a `<script src>` or any external reference to a deck.
- **No per-site override.** A site that must differ takes the block out of the package and owns it.
- Merge with `gh pr merge --merge`, **never `--squash`** — GitHub re-authors a squash commit to whoever pressed the button.
- Stage files by name. Never `git add -A` or `git add .`.

## Repository paths

- package → `/Users/rob/git/robertblust/design` (public, `github.com/robertblust/design`)
- `blust.ch` → `/Users/rob/git/robertblust/robertblust.github.io`
- `companygraph.io` → `/Users/rob/git/companygraph/companygraph.github.io`
- `guestgraph.io` → `/Users/rob/git/guestgraph/guestgraph.github.io`

## Two lessons plan 2 paid for, which bind this plan

**A new fence needs a bootstrap in the pages before the tool can act.** Plan 2 discovered this the hard way: `planFences` exits 2, not 1, when a fence is malformed or under-declared, so `design:check` aborts instead of reporting drift and cannot bootstrap itself. **Every one of these 20 pages has no fence at all**, so the markers must be written in by hand first — Task 2 — before the package can own the block.

**The gate cannot be an empty diff, and pretending otherwise hides a real change.** Task 1 renames identifiers on 16 pages and Task 2 inserts markers on 20. Both are deliberate and visible. The gate is instead:

> **No behaviour may change.** The rename must be a pure rename — the same functions, the same calls, the same storage key — and the marker insertion must add only comment lines. Each task carries a command that proves its own claim.

## File Structure

**Package — new:**

| File | Responsibility |
| --- | --- |
| `blocks/lang.js` | the canonical block, fence lines included, with a `{{langKey}}` slot |
| `lib/family.mjs` | the three domains, in one place — imported by the sites' `carriesLang` |
| `test/params.test.mjs` | the parameter mechanism: config-sourced values, and what happens without them |

**Package — modified:**

| File | Change |
| --- | --- |
| `lib/fences.mjs` | `FENCES` entries gain `params`; `blockFor` takes a params object |
| `lib/sync.mjs` | `planFences` reads `design.config.json` and supplies the params |
| `versions.json` | gains `"lang"` |
| `package.json` | `exports` gains `"./family"`; version bump |
| `README.md` | a section on site-supplied parameters |

**Sites — modified:** 20 HTML pages (rename and markers), `design.config.json` (gains `langKey`), `verify/check.mjs` (`carriesLang` imports `FAMILY`), `package.json` (the pin).

---

### Task 1: Unify the two dialects

**Files:**
- Modify: 16 HTML pages across the three sites — every page carrying `var KEY = `

**Interfaces:**
- Consumes: nothing.
- Produces: 20 pages whose language block uses one set of names — `LANG_KEY`, `langStored`, `langRemember`. Task 2 fences them; Task 3 stores the result as the canonical block.

**This is a pure rename and must be provably nothing else.** Three identifiers, on 16 pages, in the block and at 3 call sites each. No behaviour changes: same functions, same calls, same storage key, same order.

The four decks already use these names and **must not be touched by this task.**

- [ ] **Step 1: Record the before-state of every page**

Behaviour is what must not move, so capture it before touching anything. For each of the 20 pages, extract the language block and its call sites with the identifier names normalised away — that is the shape that must be identical afterwards:

```bash
cd /Users/rob/git
cat > /tmp/langshape.sh <<'SH'
# Print a page's language machinery with the three identifier names folded to one form,
# so a pure rename is a no-op and anything else shows up.
# perl, not sed: BSD sed on macOS silently ignores \b, so a sed version of this would
# normalise nothing and the "pure rename" proof below would be vacuous — it would compare
# un-normalised text and pass or fail for the wrong reason. Verified: perl folds the names,
# sed leaves them untouched.
norm() { perl -pe 's/\bLANG_KEY\b/K/g; s/\bKEY\b/K/g; s/\blangStored\b/S/g; s/\bstored\b/S/g; s/\blangRemember\b/R/g; s/\bremember\b/R/g' ; }
# Bounded at the click listener, not run to end-of-file. Unbounded, this sweeps in every
# page's own SEO strings and trailing scripts, so the hashes become per-page noise and the
# "two hashes" expectation below is meaningless.
awk '/var (LANG_)?KEY = /{on=1} on{print; if(/carryLang, true\)/)exit}' "$1" | norm
SH
chmod +x /tmp/langshape.sh
for r in robertblust/robertblust.github.io companygraph/companygraph.github.io guestgraph/guestgraph.github.io; do
  find /Users/rob/git/$r -name '*.html' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort | while read f; do
    grep -q "var KEY = \|var LANG_KEY" "$f" || continue
    printf "%s  %s\n" "$(bash /tmp/langshape.sh "$f" | md5 -q)" "${f#/Users/rob/git/}"
  done
done | tee /tmp/lang-before.txt | awk '{print $1}' | sort | uniq -c
```

Expected: **two** hashes — one covering most pages, one covering `guestgraph.io/talks/index.html`, whose block is single-quoted. Keep `/tmp/lang-before.txt`; Step 4 compares against it.

- [ ] **Step 2: Rename, on the 16 prose pages only**

A prose page is one carrying `var KEY = `. Rename three identifiers, whole-word, throughout the file — the definitions inside the block and the three call sites after it:

```bash
cd /Users/rob/git
for r in robertblust/robertblust.github.io companygraph/companygraph.github.io guestgraph/guestgraph.github.io; do
  find /Users/rob/git/$r -name '*.html' -not -path '*/node_modules/*' -not -path '*/.git/*' | while read f; do
    grep -q "var KEY = " "$f" || continue
    # SCOPED to JavaScript identifiers, not the whole file. `stored` and `remember` are
    # ordinary English words: they appear in these pages' visible copy ("everything that gets
    # stored"), in JS comments, and inside a committed JSON data payload. An unscoped
    # whole-word rename edits all of those — it did, on seven lines across three sites, and it
    # put "langStored" into the published lede of every privacy page.
    #
    # An identifier is only ever a call or a definition here, so match the parenthesis:
    perl -pi -e 's/\bKEY\b/LANG_KEY/g; s/\bstored\(/langStored(/g; s/\bremember\(/langRemember(/g; s/\bfunction langStored\(/function langStored(/g;' "$f"
    printf "  renamed %s\n" "${f#/Users/rob/git/}"
  done
done
```

Sixteen lines expected. `\b` is a word boundary, so `remembered` or `KEYS` would not match — but check, because a false match in prose would be an edit to page copy:

**Do not use a check that filters out the new names.** `grep -vE "LANG_KEY|langStored|langRemember"`
on added lines cannot catch this task's real failure mode, because the failure *is* one of those
names appearing where it should not — every corrupted line contains one, so such a check passes by
construction. It did, and it let corrupted prose through.

Check instead that every occurrence of the new names is a JavaScript identifier — a call or a
definition — which is the only place they belong:

```bash
cd /Users/rob/git
for r in robertblust/robertblust.github.io companygraph/companygraph.github.io guestgraph/guestgraph.github.io; do
  find /Users/rob/git/$r -name '*.html' -not -path '*/node_modules/*' -not -path '*/.git/*' | while read f; do
    grep -oE ".{0,12}lang(Stored|Remember).{0,2}" "$f" \
      | grep -vE "function lang(Stored|Remember)\(|lang(Stored|Remember)\(" \
      | sed "s|^|  ${f#/Users/rob/git/}: |"
  done
done
```

Expected: **no output.** Anything printed is the rename having escaped into prose, a comment or
data. And confirm nothing was left behind:

```bash
grep -rlE "[^g](stored|remember)\(" /Users/rob/git/*/[a-z]*.github.io --include=*.html 2>/dev/null
```

Expected: no output — no page still calls `stored(` or `remember(`.

- [ ] **Step 3: Confirm the decks were not touched**

```bash
cd /Users/rob/git
for f in robertblust/robertblust.github.io/talks/mental-model/index.html \
         robertblust/robertblust.github.io/talks/essential-complexity/index.html \
         companygraph/companygraph.github.io/talks/intro/index.html \
         guestgraph/guestgraph.github.io/talks/intro/index.html; do
  printf "  %-58s %s\n" "$f" "$(git -C "$(echo $f | cut -d/ -f1-2)" diff --stat -- "${f#*/*/}" | wc -l | tr -d ' ')"
done
```

Expected: `0` for all four — the decks already had the target names.

- [ ] **Step 4: Prove it was a pure rename**

Re-derive the normalised shapes and compare against Step 1's record:

```bash
cd /Users/rob/git
for r in robertblust/robertblust.github.io companygraph/companygraph.github.io guestgraph/guestgraph.github.io; do
  find /Users/rob/git/$r -name '*.html' -not -path '*/node_modules/*' -not -path '*/.git/*' | sort | while read f; do
    grep -q "var LANG_KEY" "$f" || continue
    printf "%s  %s\n" "$(bash /tmp/langshape.sh "$f" | md5 -q)" "${f#/Users/rob/git/}"
  done
done > /tmp/lang-after.txt
diff /tmp/lang-before.txt /tmp/lang-after.txt && echo "  ✓ pure rename — every page's normalised shape is unchanged"
```

Expected: `✓ pure rename`. **Any difference means behaviour moved and this task stops.**

Then confirm all 20 now agree on names:

```bash
grep -rl "var KEY = " /Users/rob/git/*/[a-z]*.github.io --include=*.html 2>/dev/null | wc -l
```

Expected: `0` — no page still uses the old name.

- [ ] **Step 5: Run all three suites**

For each site in turn, with port 8000 free between runs (`lsof -ti:8000 | xargs -r kill`):

```bash
cd <site> && python3 -m http.server 8000 > /dev/null 2>&1 &
sleep 2 && npm run verify ; kill %1
```

Expected: all three fully green. The language machinery is exercised by `carriesLang` and `storageKeys` on every page, so a broken rename fails here rather than in production.

- [ ] **Step 6: Commit in each repository, on a branch**

```bash
cd <site>
git checkout -b lang-block
git add $(git diff --name-only | grep '\.html$')
git commit -m "Rename the language block's identifiers toward the decks' naming

A deck needs KEY, stored and remember free for its transport code, so its
naming is the constrained one and the prose pages move to it. Renaming toward
a constraint cannot break the unconstrained side.

Pure rename: same functions, same calls, same storage key. Proved by folding
the three names to one form and comparing every page's shape before and after."
git push -u origin lang-block
```

Do **not** open a pull request — later tasks land on this branch.

---

### Task 2: Fence the block

**Files:**
- Modify: the same 20 HTML pages

**Interfaces:**
- Consumes: Task 1's unified naming.
- Produces: 20 pages carrying `language · v1 · <variant> ─` … `end language ─` markers, which Task 5's `planFences` discovers.

**Why by hand, and why now.** `planFences` can only rewrite a fence that already exists — discovery finds markers, it does not invent them. Plan 2 learned this when a missing variant word made `design:check` exit 2 instead of reporting drift. **No page here has ever had a fence**, so this is the bootstrap, and it is the last hand-edit these 20 blocks ever need.

**The variant.** The block itself is identical in all 20 pages after Task 1, but the fence still takes a variant word, for the same reason the token fence does: the two page kinds differ in what surrounds them, and a wrong word must be catchable. Prose pages use `page`; the four decks use `deck`. The package's variant guard — which throws when a declared variant disagrees with the page's own shape — is what makes the word verifiable rather than decorative.

- [ ] **Step 1: Insert the markers**

The block runs from `var LANG_KEY = ` through the line
`document.addEventListener("click", carryLang, true);` (single-quoted on the four decks and on
`guestgraph.io/talks/index.html`). Wrap exactly that range. The opening marker carries the fence
name, a version and the variant; the closing marker names the fence:

```js
  /* ─── language · v1 · page ─────────────────────────────────────────────
     One language across three domains, and where it is remembered. Generated
     from @robertblust/design — editing it here does nothing, because the next
     `npm run design` overwrites it. Change it in the package.
  */
  var LANG_KEY = "rb-lang";
  …
  document.addEventListener("click", carryLang, true);
  /* ─── end language ─────────────────────────────────────────────────── */
```

Two things to get exactly right, because the rewriter matches on them:

- the opening line's form is `/* ─── <name> · <vN> · <variant> ───`, and the closing line is
  `/* ─── end <name> ───…*/` **with trailing box-drawing characters** — the package's `close()`
  requires them, and a marker without them throws rather than matching;
- indentation is two spaces, matching every other fence in these files.

Use `deck` on exactly these four pages, `page` on the other sixteen:

```
robertblust.github.io/talks/mental-model/index.html
robertblust.github.io/talks/essential-complexity/index.html
companygraph.github.io/talks/intro/index.html
guestgraph.github.io/talks/intro/index.html
```

- [ ] **Step 2: Prove the markers added nothing but comments**

```bash
cd <site>
git diff -U0 -- '*.html' | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/|^[+-]\s*[A-Za-z]" | sort -u
```

Expected: **no output** in each repository. Every added line is a comment; nothing was removed.

Then confirm the count:

```bash
grep -rl "language · v1" /Users/rob/git/*/[a-z]*.github.io 2>/dev/null | grep '\.html$' | grep -v node_modules | wc -l
```

Expected: `20`.

- [ ] **Step 3: Run all three suites, and commit**

Each site, port 8000 free between runs, `npm run verify` fully green. Then in each repository, on
the same `lang-block` branch:

```bash
git add $(git diff --name-only | grep '\.html$')
git commit -m "Fence the language block, so the package can own it

Twenty pages carrying one contract, and until now no fence, no version and
nothing checking any of it. The markers are the bootstrap: planFences can
rewrite a fence that exists, it cannot invent one."
git push
```

---

### Task 3: The canonical block, and the parameter mechanism

**Files:**
- Create: `/Users/rob/git/robertblust/design/blocks/lang.js`
- Create: `/Users/rob/git/robertblust/design/lib/family.mjs`
- Modify: `/Users/rob/git/robertblust/design/lib/fences.mjs`
- Modify: `/Users/rob/git/robertblust/design/versions.json`
- Modify: `/Users/rob/git/robertblust/design/package.json` (`exports` only)
- Modify: `/Users/rob/git/robertblust/design/test/fences.test.mjs` — **exactly two tests**

**Two existing tests must change, and they are not force-passes.** `test/fences.test.mjs` was
written when three fences existed and encoded that as a fact:

- `"names exactly the three fences this release ships"` asserts the exact list. Its *purpose* is to
  fail when the fence set changes — a "did you mean to add this?" guard. Update it to four names
  and keep it an **exact list**; do not loosen it to a `.includes()` or a length check, which would
  trade a guard that fires for one that never can.
- `"each block carries its own opening and closing markers"` calls `blockFor(n, variant)` with two
  arguments, which now throws for a fence declaring `params`. Drive the params from
  `FENCES[n].params` rather than a hardcoded name, so it keeps working when a fifth fence arrives.

Nothing else in that file, and no other existing test file, may be touched.
- Test: `/Users/rob/git/robertblust/design/test/params.test.mjs`

**Interfaces:**
- Consumes: `findFence` from `lib/rewrite.mjs`.
- Produces, for Task 4:
  - `FENCES["language"]` = `{ key: "lang", source: "blocks/lang.js", version, variants: ["page","deck"], closes: null, params: ["langKey"] }` — `params` is new and lists the slot names this block needs the *site* to supply.
  - `blockFor(name, variant, params = {})` — **the signature gains a third argument.** It throws when a block declares a param the caller did not supply, and when the caller supplies one the block does not declare.
  - `FAMILY` exported from `lib/family.mjs`, and re-exported so `@robertblust/design/family` resolves.

- [ ] **Step 1: Extract the canonical block**

Take it from `blust.ch/index.html` — a prose page, double-quoted, and after Task 1 identical to
fourteen others. **Keep the fence markers Task 2 added**: as with `blocks/tokens.css` and its
siblings, the stored block *is* the whole fence, markers included, and `blockFor` returns it that
way. Task 3's tests assert exactly that (`f.start === 0`, `f.end === lines - 1`).

```bash
cd /Users/rob/git/robertblust/design
RB=/Users/rob/git/robertblust/robertblust.github.io
awk '/language · v1/{on=1} on{print; if(/end language/)exit}' "$RB/index.html" > blocks/lang.js
wc -l blocks/lang.js
```

Then replace the site's own storage key with the slot the parameter fills, and the variant word
with its slot:

```bash
cd /Users/rob/git/robertblust/design
perl -pi -e 's/"rb-lang"/"{{langKey}}"/; s/· v1 · page/· v1 · {{variant}}/;' blocks/lang.js
grep -n "{{langKey}}\|{{variant}}" blocks/lang.js
```

Expected: exactly one `{{langKey}}` and one `{{variant}}`. **If `{{langKey}}` appears twice the
block references the key somewhere else and the substitution must be reviewed**, because a
single-occurrence `replace` would fill only the first.

- [ ] **Step 2: Write the failing test**

Create `test/params.test.mjs`:

```javascript
// The parameter mechanism, and the difference between a value the package owns and a value the
// site owns.
//
// Every substitution before this one came from the package: `{{variant}}` is chosen from a fixed
// two-member set that blockFor itself holds. `langKey` is the first that comes from the consuming
// site — and it can never be derived. blust.ch stores under "rb-lang"; nothing about the domain
// yields that. More importantly, changing a storage key silently discards every visitor's saved
// language, so it is a constant with a migration cost and belongs where changing it is visible.
import { test } from "node:test";
import assert from "node:assert/strict";

import { FENCES, blockFor } from "../lib/fences.mjs";
import { FAMILY } from "../lib/family.mjs";
import { findFence } from "../lib/rewrite.mjs";

test("the language fence declares langKey as a site-supplied parameter", () => {
  assert.deepEqual(FENCES["language"].params, ["langKey"]);
});

test("no other fence declares a parameter", () => {
  for (const [name, spec] of Object.entries(FENCES))
    if (name !== "language") assert.equal(spec.params, undefined, name);
});

test("blockFor substitutes the site's key", () => {
  const out = blockFor("language", "page", { langKey: "rb-lang" });
  assert.match(out, /var LANG_KEY = "rb-lang";/);
  assert.ok(!out.includes("{{langKey}}"), "the slot was left unfilled");
});

test("a different site gets a different key and nothing else differs", () => {
  const rb = blockFor("language", "page", { langKey: "rb-lang" });
  const gg = blockFor("language", "page", { langKey: "gg-lang" });
  assert.notEqual(rb, gg);
  assert.equal(rb.replace(/rb-lang/, "X"), gg.replace(/gg-lang/, "X"));
});

test("omitting a declared parameter throws, and the message names it", () => {
  assert.throws(() => blockFor("language", "page", {}), /langKey/);
  assert.throws(() => blockFor("language", "page"), /langKey/);
});

test("supplying a parameter a block does not declare throws", () => {
  assert.throws(() => blockFor("design tokens", "page", { langKey: "rb-lang" }),
    /design tokens|langKey/);
});

test("the emitted block is a findable fence with the right variant", () => {
  for (const variant of ["page", "deck"]) {
    const out = blockFor("language", variant, { langKey: "rb-lang" });
    const f = findFence(out, "language");
    assert.ok(f, `${variant}: not a findable fence`);
    assert.equal(f.variant, variant);
    assert.equal(f.start, 0);
    assert.equal(f.end, out.split("\n").length - 1);
  }
});

test("both variants emit the same bytes — the block itself does not vary", () => {
  const p = blockFor("language", "page", { langKey: "rb-lang" });
  const d = blockFor("language", "deck", { langKey: "rb-lang" });
  assert.equal(p.replace("· page ", "· X "), d.replace("· deck ", "· X "),
    "the two variants differ by more than the variant word");
});

test("FAMILY names exactly the three domains and matches them with and without www", () => {
  for (const h of ["blust.ch", "www.blust.ch", "companygraph.io", "guestgraph.io"])
    assert.ok(FAMILY.test(h), h);
  for (const h of ["example.com", "notblust.ch", "blust.ch.evil.com"])
    assert.ok(!FAMILY.test(h), h);
});

test("the block carries FAMILY's source text, so page and check agree", () => {
  const out = blockFor("language", "page", { langKey: "rb-lang" });
  assert.ok(out.includes(FAMILY.source),
    "the block's inline FAMILY regex has drifted from lib/family.mjs");
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `cd /Users/rob/git/robertblust/design && node --test test/params.test.mjs`
Expected: FAIL — `lib/family.mjs` does not exist and `FENCES["language"]` is undefined.

- [ ] **Step 4: Write `lib/family.mjs`**

```javascript
// The three domains that carry a reader's language between them, in one place.
//
// This regex was hardcoded in twenty-three places — every page's language block, and the
// `carriesLang` check in all three verify suites. Adding a fourth site was a twenty-three-file
// edit, and a partial one produced a site that silently dropped the language on the way out.
//
// The pages get it substituted into their block; the checks import it from here. Both read the
// same source, so a page and the check that guards it cannot disagree.
export const FAMILY = /^(www\.)?(blust\.ch|companygraph\.io|guestgraph\.io)$/;
```

- [ ] **Step 5: Add the fence and the parameter mechanism**

In `versions.json`, add `"lang": "v1"` beside the existing three.

In `lib/fences.mjs`, add the entry — note `closes: null`, because unlike the token block this one
has no brace to place, and `params`, which is new:

```javascript
  // The first block whose substitution comes from the SITE rather than from this package.
  // `{{variant}}` is chosen from a set this file owns; `{{langKey}}` is not — blust.ch stores
  // under "rb-lang" and nothing about the domain yields that. It is also a constant with a
  // migration cost: changing a storage key silently discards every visitor's saved language.
  // So it lives in the site's design.config.json, where changing it is a visible act.
  "language": {
    key: "lang", source: "blocks/lang.js", version: versions.lang,
    variants: ["page", "deck"], closes: null, params: ["langKey"],
  },
```

Then extend `blockFor` to take and validate a third argument. Keep the existing variant and
`closes` behaviour exactly as it is; add, after the variant checks:

- if `spec.params` is set, every name in it must be present in the supplied object — otherwise
  throw an `Error` naming the fence and the missing parameter, and saying it comes from the
  site's `design.config.json`;
- if `spec.params` is unset, supplying any parameter must throw, naming the fence — a caller
  passing `langKey` to the token block has misunderstood something and should hear about it;
- substitute each `{{name}}` slot with its value, replacing **all** occurrences.

- [ ] **Step 6: Run the tests**

Run: `npm test`
Expected: 68 existing plus 10 new — **78 passing, 0 failing.**

- [ ] **Step 7: Export `./family` and commit**

In `package.json`, add `"./family": "./lib/family.mjs"` to `exports`. Change nothing else — the
version bump is Task 5's.

```bash
cd /Users/rob/git/robertblust/design
git add blocks/lang.js lib/family.mjs lib/fences.mjs versions.json package.json test/params.test.mjs
git commit -m "The language block, and the first parameter that comes from the site"
```

---

### Task 4: Teach `planFences` to read the site's config

**Files:**
- Modify: `/Users/rob/git/robertblust/design/lib/sync.mjs`
- Modify: `/Users/rob/git/robertblust/design/bin/design.mjs`
- Test: `/Users/rob/git/robertblust/design/test/sync-params.test.mjs`

**Interfaces:**
- Consumes: `FENCES`, `blockFor` (three-argument form) from `lib/fences.mjs`; `readConfig` and the existing `planFences`/`applyFences` in `lib/sync.mjs`.
- Produces: `planFences(siteRoot)` unchanged in signature but now reading `design.config.json` for the parameters a fence declares. `readConfig` returns `{ groups, langKey }`, with `langKey` optional and `undefined` when absent.

**The failure that must be loud.** A site whose pages carry a `language` fence but whose config has
no `langKey` must exit **2** with a message naming the file and the key — not write an empty string
into twenty pages' `localStorage` calls. That would not throw anywhere; it would quietly give every
visitor a shared, nameless key.

- [ ] **Step 1: Write the failing test**

Create `test/sync-params.test.mjs`:

```javascript
// planFences reading the consuming site's own config.
//
// Everything the tool substituted before this came from the package. This is the first value it
// has to go and fetch from the site, which means a new way to be misconfigured — and the one that
// matters is a page carrying the fence while the config carries no key. Writing an empty key would
// throw nowhere and would silently give every visitor of that site the same nameless storage slot.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { readConfig, planFences, applyFences } from "../lib/sync.mjs";
import { blockFor } from "../lib/fences.mjs";

function site(config, pages = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-params-"));
  fs.writeFileSync(path.join(root, "design.config.json"), JSON.stringify(config));
  for (const [rel, body] of Object.entries(pages)) {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body);
  }
  return root;
}
const wrap = (b) => ["<script>", "  // before", b, "  // after", "</script>"].join("\n");

test("readConfig returns langKey when the site declares one", () => {
  const root = site({ groups: ["fonts"], langKey: "rb-lang" });
  assert.equal(readConfig(root).langKey, "rb-lang");
});

test("readConfig leaves langKey undefined when the site has none", () => {
  const root = site({ groups: ["fonts"] });
  assert.equal(readConfig(root).langKey, undefined);
});

test("a page carrying the shipped block reports same", () => {
  const root = site({ groups: ["fonts"], langKey: "rb-lang" },
    { "index.html": wrap(blockFor("language", "page", { langKey: "rb-lang" })) });
  const e = planFences(root).find(x => x.fence === "language");
  assert.equal(e.state, "same");
});

test("the site's own key is what gets written, not the package's", () => {
  const stale = blockFor("language", "page", { langKey: "gg-lang" }).replace(/· v\d+ ·/, "· v0 ·");
  const root = site({ groups: ["fonts"], langKey: "gg-lang" }, { "index.html": wrap(stale) });
  applyFences(root, planFences(root));
  const out = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(out, /var LANG_KEY = "gg-lang";/);
  assert.ok(!out.includes("rb-lang"), "another site's key was written in");
});

test("a fenced page with no langKey in the config throws, naming the file and the key", () => {
  const root = site({ groups: ["fonts"] },
    { "index.html": wrap(blockFor("language", "page", { langKey: "rb-lang" })) });
  assert.throws(() => planFences(root), (e) =>
    /langKey/.test(e.message) && /design\.config\.json/.test(e.message));
});

test("a site with no language fence needs no langKey", () => {
  const root = site({ groups: ["fonts"] }, { "index.html": "<script>  // nothing</script>" });
  assert.deepEqual(planFences(root).filter(e => e.fence === "language"), []);
});

test("a second run reports same and writes nothing", () => {
  const stale = blockFor("language", "deck", { langKey: "cg-lang" }).replace(/· v\d+ ·/, "· v0 ·");
  const root = site({ groups: ["fonts"], langKey: "cg-lang" },
    { "talks/t/index.html": wrap(stale) });
  applyFences(root, planFences(root));
  const second = planFences(root);
  assert.ok(second.every(e => e.state === "same"), JSON.stringify(second));
  assert.deepEqual(applyFences(root, second), []);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node --test test/sync-params.test.mjs`
Expected: FAIL — `readConfig` does not return `langKey`, and `planFences` calls `blockFor` with two
arguments.

- [ ] **Step 3: Implement**

In `lib/sync.mjs`:

- `readConfig` also reads `langKey`. Validate it the way `groups` is validated: if present it must
  be a non-empty string, otherwise throw naming the file. Absent is legal — a site with no
  language fence needs none.
- `planFences` reads the config once, before the page loop, and builds the params object each
  fence needs from it. When a fence declares a param the config does not supply, throw a
  `FenceError` — exit 2 — naming the page, the fence, the missing key, and `design.config.json` as
  where it belongs.
- Both `planFences` and `applyFences` pass the params through to `blockFor`.

In `bin/design.mjs`, nothing changes: `readConfig` already throws with a readable message and the
CLI already maps that to exit 2. Confirm by reading it rather than assuming.

- [ ] **Step 4: Run the tests and exercise the CLI**

Run: `npm test`
Expected: **85 passing** (78 from Task 3 plus 7), 0 failing.

Then the misconfiguration case by hand, because its message is what a person meets:

```bash
cd /tmp && rm -rf nokey && mkdir nokey && cd nokey
printf '{"groups":["fonts"]}' > design.config.json
node -e '
  const { blockFor } = await import("/Users/rob/git/robertblust/design/lib/fences.mjs");
  const fs = await import("node:fs");
  fs.writeFileSync("index.html", "<script>\n" + blockFor("language","page",{langKey:"rb-lang"}) + "\n</script>");
' --input-type=module
node /Users/rob/git/robertblust/design/bin/design.mjs sync --check; echo "  exit $?  (2 expected)"
```

Expected: exit **2**, with a message naming `design.config.json` and `langKey`.

- [ ] **Step 5: Commit**

```bash
cd /Users/rob/git/robertblust/design
git add lib/sync.mjs test/sync-params.test.mjs
git commit -m "Read the site's own config for the parameters a fence declares"
```

---

### Task 5: Document and release v0.3.0

**Files:**
- Modify: `/Users/rob/git/robertblust/design/README.md`
- Modify: `/Users/rob/git/robertblust/design/package.json` (version)

**Interfaces:** consumes Tasks 3 and 4; produces tag `v0.3.0`, which Tasks 6–8 install.

**A minor, not a major.** A site must add `langKey` to its config — but only a site whose pages
carry the new fence, and no page carries it until that site adds the markers, which they already
did in Task 2. Adopting is `npm run design` plus one config line.

- [ ] **Step 1: Add a parameters section to the README**

After the existing Fences section, in the README's plain-prose voice, explain: that a block may
declare parameters the *site* supplies through `design.config.json`; that `langKey` is the first
and why it cannot be derived — `blust.ch` stores under `rb-lang`, and changing a storage key
silently discards every visitor's saved language; that a fenced page with no key is an error, not
a default; and that `FAMILY` is deliberately **not** a parameter, because the three domains are the
same everywhere and live in `lib/family.mjs`.

- [ ] **Step 2: Bump, verify, commit**

```bash
cd /Users/rob/git/robertblust/design
npm version 0.3.0 --no-git-tag-version
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)"
npm pack --dry-run 2>&1 | grep -E "blocks/lang.js|family.mjs|total files"
git add README.md package.json && git commit -m "Release 0.3.0 — the language block, and site-supplied parameters"
git push
```

Expected: 85 passing; the tarball lists `blocks/lang.js` and `lib/family.mjs`.

- [ ] **Step 3: Watch CI, then tag and release**

```bash
gh run list --limit 3
gh run watch <the CI run id> --exit-status --compact
```

`gh run watch` with no id fails non-interactively — take the id from `gh run list`. Do not tag a
red commit. Then tag `v0.3.0` and write release notes covering: the new fence and that
`design:check` goes red in all three sites; that each site must add `langKey` to
`design.config.json` and what happens if it does not (exit 2, not a default); that `FAMILY` is now
importable so `carriesLang` can stop hardcoding it; and the `npm run design && npm run og` pair.

---

### Task 6: blust.ch adopts

**Files:**
- Modify: `design.config.json`, `package.json`, `package-lock.json`, `verify/check.mjs`, and the 8 pages the tool rewrites

**Interfaces:** consumes `@robertblust/design@v0.3.0`; produces nothing other tasks consume.

- [ ] **Step 1: Install, and watch it fail for the right reason**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io   # already on branch lang-block
npm install --save-dev "github:robertblust/design#v0.3.0"
npm run design:check; echo "  exit $?"
```

Expected: **exit 2**, naming `design.config.json` and `langKey` — the pages carry the fence and the
config does not yet carry the key. That is the misconfiguration guard working. Record the output.

- [ ] **Step 2: Add the key, then see real drift**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
node -e '
  const fs = await import("node:fs");
  const c = JSON.parse(fs.readFileSync("design.config.json","utf8"));
  c.langKey = "rb-lang";
  fs.writeFileSync("design.config.json", JSON.stringify(c, null, 2) + "\n");
' --input-type=module
cat design.config.json
npm run design:check; echo "  exit $?  (1 expected)"
```

Expected: `{"groups":["fonts","stage"],"langKey":"rb-lang"}` and **exit 1**, naming 8 stale
`language` fences alongside the 15 that already match. Record it.

- [ ] **Step 3: Sync, and prove behaviour did not move**

```bash
npm run design
git diff --stat -- '*.html'
```

The gate. Every changed line must be a comment, **and the storage key must still be `rb-lang` on
every page**:

```bash
git diff -U0 -- '*.html' | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/" | grep -vE "LANG_KEY|langStored|langRemember|FAMILY|carryLang|langFromUrl|addEventListener" | sort -u
grep -rc 'var LANG_KEY = "rb-lang";' --include=*.html . 2>/dev/null | grep -v ':0' | wc -l
```

Expected: the first prints nothing surprising — only lines belonging to the block; the second
prints `8`, one per page. **A page whose key changed means the parameter did not reach it — stop.**

- [ ] **Step 4: Import `FAMILY` in `carriesLang`**

In `verify/check.mjs`, add to the imports at the top:

```javascript
import { FAMILY } from "@robertblust/design/family";
```

and in the `carriesLang` check, delete the inline
`const FAMILY = /^(www\.)?(blust\.ch|companygraph\.io|guestgraph\.io)$/;` declared inside
`page.evaluate`, passing the imported `FAMILY.source` in instead — `page.evaluate` runs in the
browser, where the module does not exist, so the regex must cross as a **string** and be rebuilt
with `new RegExp(src)` on the other side.

Note that `carriesLang`'s `page.evaluate(() => { … })` currently takes **no** argument, so you are
changing its signature to `page.evaluate((src) => { … }, FAMILY.source)`. The `fontsAvailable`
check in `verify/design.mjs` already does exactly this — it passes `[...SYSTEM_FACES]` in as a
second argument — so read that one for the shape rather than the neighbouring `evaluate` calls,
which take none.

- [ ] **Step 5: Cards, suite, commit**

```bash
npm run og:check && npm run og && npm run og:check
lsof -ti:8000 | xargs -r kill 2>/dev/null
python3 -m http.server 8000 > /dev/null 2>&1 & sleep 2 && npm run verify ; kill %1
```

Expected: `verify` fully green — `carriesLang` and `storageKeys` both exercise this block on every
page, so a broken substitution fails here.

Commit `design.config.json`, `package.json`, `package-lock.json`, `verify/check.mjs`, the rewritten
pages and the regenerated cards, staging by name. Push. **Do not open a pull request yet** — Task 9
lands on this branch.

---

### Task 7: companygraph.io adopts

**Files:**
- Modify: `design.config.json`, `package.json`, `package-lock.json`, `verify/check.mjs`, and the 7 pages the tool rewrites

**Interfaces:** consumes `@robertblust/design@v0.3.0`; produces nothing other tasks consume.

Identical in shape to Task 6, repeated in full because tasks may be read out of order. **This
site's key is `cg-lang`.**

- [ ] **Step 1: Install, and watch it fail for the right reason**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io   # already on branch lang-block
npm install --save-dev "github:robertblust/design#v0.3.0"
npm run design:check; echo "  exit $?"
```

Expected: **exit 2**, naming `design.config.json` and `langKey`. Record the output.

- [ ] **Step 2: Add the key, then see real drift**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
node -e '
  const fs = await import("node:fs");
  const c = JSON.parse(fs.readFileSync("design.config.json","utf8"));
  c.langKey = "cg-lang";
  fs.writeFileSync("design.config.json", JSON.stringify(c, null, 2) + "\n");
' --input-type=module
cat design.config.json
npm run design:check; echo "  exit $?  (1 expected)"
```

Expected: `langKey` is `cg-lang`, and **exit 1** naming 7 stale `language` fences. Record it.

- [ ] **Step 3: Sync, and prove behaviour did not move**

```bash
npm run design
git diff -U0 -- '*.html' | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/" | grep -vE "LANG_KEY|langStored|langRemember|FAMILY|carryLang|langFromUrl|addEventListener" | sort -u
grep -rc 'var LANG_KEY = "cg-lang";' --include=*.html . 2>/dev/null | grep -v ':0' | wc -l
```

Expected: nothing surprising from the first; `7` from the second. **A page whose key changed means
the parameter did not reach it — stop.**

- [ ] **Step 4: Import `FAMILY` in `carriesLang`**

In `verify/check.mjs`, add `import { FAMILY } from "@robertblust/design/family";` to the imports
and delete the inline `const FAMILY = …` inside `carriesLang`'s `page.evaluate`. That callback
currently takes **no** argument, so its signature becomes
`page.evaluate((src) => { … }, FAMILY.source)` and the regex is rebuilt with `new RegExp(src)`
inside the browser, where the module does not exist. `fontsAvailable` in `verify/design.mjs`
already passes an argument this way — read that for the shape.

- [ ] **Step 5: Cards, suite, commit**

```bash
npm run og:check && npm run og && npm run og:check
lsof -ti:8000 | xargs -r kill 2>/dev/null
python3 -m http.server 8000 > /dev/null 2>&1 & sleep 2 && npm run verify ; kill %1
```

Expected: fully green. Commit the same six kinds of file, staging by name, and push. **No pull
request yet.**

---

### Task 8: guestgraph.io adopts

**Files:**
- Modify: `design.config.json`, `package.json`, `package-lock.json`, `verify/check.mjs`, and the 5 pages the tool rewrites

**Interfaces:** consumes `@robertblust/design@v0.3.0`; produces nothing other tasks consume.

Identical in shape, repeated in full. **This site's key is `gg-lang`.** It also carries the one
page whose block was single-quoted — `talks/index.html` — so expect its diff to be slightly larger
than its siblings': the sync rewrites that block to the canonical double-quoted form. That is a
correction, not drift, and it is the last of the cosmetic divergence this whole effort started with.

- [ ] **Step 1: Install, and watch it fail for the right reason**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io   # already on branch lang-block
npm install --save-dev "github:robertblust/design#v0.3.0"
npm run design:check; echo "  exit $?"
```

Expected: **exit 2**, naming `design.config.json` and `langKey`. Record the output.

- [ ] **Step 2: Add the key, then see real drift**

```bash
cd /Users/rob/git/guestgraph/guestgraph.github.io
node -e '
  const fs = await import("node:fs");
  const c = JSON.parse(fs.readFileSync("design.config.json","utf8"));
  c.langKey = "gg-lang";
  fs.writeFileSync("design.config.json", JSON.stringify(c, null, 2) + "\n");
' --input-type=module
cat design.config.json
npm run design:check; echo "  exit $?  (1 expected)"
```

Expected: `langKey` is `gg-lang`, and **exit 1** naming 5 stale `language` fences. Record it.

- [ ] **Step 3: Sync, and prove behaviour did not move**

```bash
npm run design
git diff -U0 -- '*.html' | grep -E "^[+-]" | grep -vE "^(\+\+\+|---)" \
  | grep -vE "^[+-]\s*/\*|^[+-]\s*\*/" | grep -vE "LANG_KEY|langStored|langRemember|FAMILY|carryLang|langFromUrl|addEventListener" | sort -u
grep -rc "var LANG_KEY = \"gg-lang\";" --include=*.html . 2>/dev/null | grep -v ':0' | wc -l
```

Expected: nothing surprising from the first; `5` from the second — including `talks/index.html`,
whose key line was single-quoted before and is double-quoted after.

- [ ] **Step 4: Import `FAMILY` in `carriesLang`**

In `verify/check.mjs`, add `import { FAMILY } from "@robertblust/design/family";` to the imports
and delete the inline `const FAMILY = …` inside `carriesLang`'s `page.evaluate`. That callback
currently takes **no** argument, so its signature becomes
`page.evaluate((src) => { … }, FAMILY.source)` and the regex is rebuilt with `new RegExp(src)`
inside the browser, where the module does not exist. `fontsAvailable` in `verify/design.mjs`
already passes an argument this way — read that for the shape.

- [ ] **Step 5: Cards, suite, commit**

```bash
npm run og:check && npm run og && npm run og:check
lsof -ti:8000 | xargs -r kill 2>/dev/null
python3 -m http.server 8000 > /dev/null 2>&1 & sleep 2 && npm run verify ; kill %1
```

Expected: fully green. Commit, push. **No pull request yet.**

---

### Task 9: Prove the contract still holds across the three sites, and open the pull requests

**Files:**
- Modify: none, unless a check below fails.

**Interfaces:** consumes Tasks 6–8; produces three open pull requests.

The block's whole purpose is behaviour **between** sites: a reader switching to German on one
domain and following a link to another arrives in German. No single site's suite can test that —
each one only ever renders itself. This task checks the seam by hand, once, before the change ships.

- [ ] **Step 1: Confirm the three keys survived, and are still three**

```bash
cd /Users/rob/git
for r in robertblust/robertblust.github.io companygraph/companygraph.github.io guestgraph/guestgraph.github.io; do
  printf "  %-38s config=%-9s pages=%s\n" "$(basename $r)" \
    "$(node -p "require('/Users/rob/git/$r/design.config.json').langKey")" \
    "$(grep -rhoE 'var LANG_KEY = "[a-z-]+"' /Users/rob/git/$r --include=*.html 2>/dev/null | sort -u | tr -d '\n')"
done
```

Expected: `rb-lang`, `cg-lang`, `gg-lang` — each site's config key matching the one key its pages
carry, and **three distinct keys**. Two sites sharing a key would mean one site's visitors reading
another's stored preference on their own origin.

- [ ] **Step 2: Confirm every page's `FAMILY` matches the package's**

```bash
cd /Users/rob/git
node -e '
  const { FAMILY } = await import("/Users/rob/git/robertblust/design/lib/family.mjs");
  const fs = await import("node:fs"); const { execSync } = await import("node:child_process");
  let bad = 0, seen = 0;
  for (const r of ["robertblust/robertblust.github.io","companygraph/companygraph.github.io","guestgraph/guestgraph.github.io"]) {
    for (const f of execSync(`find /Users/rob/git/${r} -name "*.html" -not -path "*/node_modules/*" -not -path "*/.git/*"`).toString().trim().split("\n")) {
      const t = fs.readFileSync(f,"utf8");
      if (!t.includes("var FAMILY")) continue;
      seen++;
      if (!t.includes(FAMILY.source)) { bad++; console.log("  ✗", f); }
    }
  }
  console.log(`  ${seen} pages carry FAMILY, ${bad} disagree with the package`);
' --input-type=module
```

Expected: `20 pages carry FAMILY, 0 disagree`.

- [ ] **Step 3: Drive the cross-domain hand-off in a browser**

Serve all three at once on different ports and follow a link between them, which is the one thing
no suite does:

```bash
cd /Users/rob/git
lsof -ti:8001,8002,8003 2>/dev/null | xargs -r kill 2>/dev/null
(cd robertblust/robertblust.github.io && python3 -m http.server 8001 >/dev/null 2>&1 &)
(cd companygraph/companygraph.github.io && python3 -m http.server 8002 >/dev/null 2>&1 &)
(cd guestgraph/guestgraph.github.io && python3 -m http.server 8003 >/dev/null 2>&1 &)
sleep 2
```

Then, with Playwright from any of the three site directories, load `http://localhost:8001/`,
switch to German by clicking `#lde`, and assert three things: `document.documentElement.lang` is
`de`; `localStorage.getItem("rb-lang")` is `"de"`; and pressing a link to a family domain rewrites
its `href` to carry `?lang=de` — the `carryLang` behaviour, which fires on `mousedown` as well as
`click` so a middle-click carries it too. Then load
`http://localhost:8002/?lang=de` and assert its `documentElement.lang` becomes `de`, its
`localStorage.getItem("cg-lang")` is `"de"`, and the query string has been cleaned out of the
address bar by `replaceState`.

Kill all three servers afterwards.

Expected: every assertion passes. **This is the behaviour the block exists for, and the only place
in the whole plan where it is exercised end to end.**

- [ ] **Step 4: Open the three pull requests**

**Do not use `--fill`** — it takes the body from the commit body and these commits have single-line
messages, which yields an empty description. Write each body with `--body-file`, carrying:

- the **exit 2** output from that site's Step 1, showing the misconfiguration guard firing before
  the key was added, and the **exit 1** output after — both pasted verbatim;
- the statement that behaviour did not change, with the command that proves the storage key is
  unchanged on every page;
- that `FAMILY` moved from 23 hardcoded places to one, and that `carriesLang` now imports it;
- for guestgraph.io, that `talks/index.html`'s block was single-quoted and is now canonical — the
  last of the cosmetic divergence this effort began with;
- the result of Step 3's cross-domain check.

```bash
gh pr create --title "Take the language block from @robertblust/design v0.3.0" \
             --body-file <a body file you write>
```

Stop at the open pull request. **Do not merge** without an explicit go-ahead.

---

## Done when

- `robertblust/design` is tagged `v0.3.0` and `blocks/lang.js` is the only copy of the block.
- **20 language fences across three repositories have one source**, and `design:check` asserts each
  byte-for-byte in CI.
- Each site declares its own `langKey`; the three keys are still distinct; a fenced page with no
  key exits 2 rather than defaulting.
- `FAMILY` is named in **one file** instead of 23. Adding a fourth site is one edit.
- The cross-domain hand-off works, checked in a browser across three origins.
- Three pull requests open, green, unmerged.

## Not in this plan

- **The `<head>`** — meta and JSON-LD, 20 pages, six shapes where three belong. Per the spec's third
  clause it is never generated; only its *shape* is shared, as an assertion. That mechanism does not
  exist yet and is its own plan.
- **The deck** — runtime, markup, layout CSS, and the footer fence that measurement showed is two
  things wearing one name. Plan 4.
- **The prose typography kit** — 16 pages, 54 common lines to carve out of 57–150. Plan 5.
- **`blocks/header.css` says "fifteen pages" where there are sixteen.** A one-word fix that makes
  all 16 header fences stale, so it rides with this plan's release rather than earning its own.
  Fold it into Task 3 if convenient; it is not a reason to bump anything on its own.
- `verify/design.mjs` still exists three times.
