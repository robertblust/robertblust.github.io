# Theme the Decks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the four talk decks the same light/dark switch the prose pages have, with the transport treated as a physical object: a pale milled slab whose readout stays dark.

**Architecture:** The deck chrome's 126 literal colours collapse to 17 shared values, which become deck tokens in the shared `design tokens` block alongside the eleven the prose pages already use. The theme fences the prose pages carry are added to the decks, with the control joining the language toggle in the transport bar rather than a header. `--lcd` is declared theme-invariant.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict` in the package; Playwright for the site suites; no build step, no framework, no external assets, and every deck must still open from a `file://` URL with no network.

**Spec:** `docs/superpowers/specs/2026-09-01-theme-switch-design.md` — decisions 1 and 3, and the Delivery section's "Plan B — the decks".

**Depends on:** Plan A (`docs/superpowers/plans/2026-09-01-theme-mechanism-and-prose.md`). Its three site branches are `theme-switch` and were **not merged** at the time this plan was written. Branch from those, not from `main`.

## Global Constraints

- The package has **zero dependencies and zero devDependencies**. Playwright stays a site devDependency; the package receives a `page`, it never creates one.
- Node 22+, ESM, `node:test` + `node:assert/strict`.
- **No external assets, anywhere.** The sun and moon are inline SVG.
- **Every deck must still open from a `file://` URL with no network**, in both themes. ES modules and `fetch` are blocked there; the boot script must stay a classic inline script and every storage access stays inside try/catch, because `file://` is an opaque origin that throws.
- Sites pin an **exact tag**, never a commit SHA.
- Merge with a merge commit — `gh pr merge --merge`, **never `--squash`**.
- Stage files by name; never `git add -A`.
- Never mention closed-source predecessor projects.
- Every gate must be a check that *can* fail. Prove it by mutation.
- **Dark is the default and `prefers-color-scheme` is never read** (spec decision 4).
- **`--lcd` does not flip** (spec decision 3), and **`--c-weak` stays non-text-only in both themes** (decision 6).

## Measurements this plan rests on

Taken 2026-09-02 against the three `theme-switch` branches. Re-derive with
`/private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/deck-colours.mjs` if they look wrong.

| Fact | Value |
|---|---|
| Literals the four decks paint, outside token declarations | **126** |
| Distinct values | **24** |
| Values all four decks share | **17 distinct, 100 occurrences** — these become tokens |
| Per-deck or per-site values | **26 occurrences** — these stay local and are re-pointed at tokens by hand |
| Deck-only tokens that already exist | `--warn:#e0705e`, `--slab:#16181d`, `--lcd:#0a0b0e`, declared per page after the fence |
| Per deck | mental-model 27, essential-complexity 38, companygraph/intro 28, guestgraph/intro 33 |

Three false-positive classes were excluded and are worth knowing about, because the first sweep counted all three: token declarations; HTML entities (`&#8220;` — a curly quote whose `#8220` looks exactly like a hex colour); and hex values quoted inside a generated fence's own prose, where a comment explains a palette decision.

**`#1b2231` is already a token.** Twelve of the 100 are the value of `--press`, added in Plan A. They are a substitution, not a new name.

## The seventeen shared values, and what each is

| value | n | where | proposed name |
|---|---|---|---|
| `#9db0ff` | 16 | `color`, `border-color` | `--deck-accent` — brighter than `--c-mid`, the deck's own interactive tone |
| `#f1ede4` | 13 | background, colour, border | `--deck-paper` — the warm off-white the slide canvas uses for inverted panels |
| `#1b2231` | 12 | background | **already `--press`** |
| `#7aa0ff` | 7 | inline SVG | `--deck-mark` — the mark's stroke |
| `#17181c` | 4 | background | `--deck-well` |
| `#1e2029` | 4 | background | `--deck-track` — the clip progress track |
| `#20242e` | 4 | background | `--deck-hover` |
| `#333743` | 4 | background | `--deck-divider` |
| `#33353d` | 4 | border | `--deck-edge` |
| `#39435c` | 4 | border | `--deck-ring` — the play button's ring |
| `#4c566e` | 4 | colour | `--deck-faint` — the LCD's separator and total |
| `#9a9dab` | 4 | colour | `--deck-quiet` |
| `#b7b0a2` | 4 | colour | `--deck-warm` |
| `rgba(255,255,255,.055)` | 4 | shadow | `--deck-lift` |
| `rgba(0,0,0,.5)` | 4 | shadow | `--deck-drop` |
| `rgba(0,0,0,.85)` | 4 | shadow | `--deck-inset` |
| `rgba(122,160,255,.1)` | 4 | shadow | `--deck-glow` |

**These names are proposals and the light values below are mine, derived from the Device mockup that was approved.** They are the part of this plan a human should look at first, on a rendered deck, before anything else. If a name reads wrong, changing it is cheap now and expensive after four decks carry it.

## Rulings made while writing this plan

**Ruling 1 — the deck tokens live in the shared `design tokens` block, not in a new fence.** The block already has a `deck` variant and already leaves `:root` open for the deck's own three tokens. Adding a fourth group there keeps one place where a palette is defined. Cost if wrong: prose pages carry seventeen token declarations they never read — about 400 bytes per page, uncompressed.

**Ruling 2 — `--lcd` is declared theme-invariant in the block itself, not by omission.** Spec decision 3 says the readout stays dark because a real one does. If the light half simply omits `--lcd`, a future reader cannot tell whether that was a decision or an oversight, and the next person to "complete" the palette will add it. It gets an explicit declaration with the same value in both halves and a comment saying why. Cost if wrong: one redundant-looking line, which is the point.

**Ruling 3 — the 26 per-deck literals are re-pointed at existing tokens by hand, not given names.** They are inline SVG fills on individual marks (`#0c0e13` ×6 on one deck, `#191b20` ×4, `#4a4d55` ×4, `#9a9384` ×3, `#282a30` ×2, one rgba). Naming a token used once, on one deck, adds a word to the vocabulary and buys nothing. Each becomes `var(--ground)`, `var(--slab)` or the nearest existing token, chosen by what it is rather than what it equals. Cost if wrong: a mark whose fill is fractionally off in one theme, visible on inspection.

---

## File Structure

**Modified in `@robertblust/design`:**
- `blocks/tokens.css` — the seventeen deck tokens in both halves; `--lcd` declared invariant. Fence → v7.
- `blocks/deck-transport.css` — its literals become tokens. Fence → v5.
- `blocks/deck-lockup-one.css`, `blocks/deck-lockup-two.css` — same. Fences bump.
- `blocks/theme-boot.js`, `blocks/theme.js` — gain a `deck` variant, mirroring how `language` already has one.
- `lib/fences.mjs` — the two theme fences gain `variants: ["page", "deck"]`.
- `verify/pages.mjs` — `contrast` extended to the deck token pairs.
- `versions.json`, `package.json`.

**Modified in each site:** each deck's `index.html` — the two theme fences, the control in the transport bar, and its share of the 26 local literals; `verify/check.mjs` — `contrast`, `noFlash` and the theme half of `storageKeys` turned on for deck pages.

---

## Task 1: The seventeen deck tokens

**Files:**
- Modify: `/Users/rob/git/robertblust/design/blocks/tokens.css`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/theme.test.mjs`

**Interfaces:**
- Produces: seventeen `--deck-*` tokens in both themes, plus `--lcd` declared in both with the same value. Fence `design tokens` at **v7**.

- [ ] **Step 1: Add the deck group to both halves**

The deck tokens go in **both** rules, after the existing eleven, separated by a blank line and this comment. Remember the light rule is written first and the dark `:root` last and unclosed — see the fence's own layout, and do not reorder it.

```css
    /* The deck's own chrome. A transport is a physical object in this design — the source
       calls --slab "the slab it is milled from" and --lcd "the recessed window the track
       number sits in" — so the light theme makes the slab pale milled metal and leaves the
       readout dark. A real machine with an aluminium body still has a dark display, and that
       is the whole reason --lcd appears in both halves with the same value: it is a decision,
       not an omission, and the next person to "complete" this palette should read this line
       before adding a light one. */
```

Light half:

```css
    --deck-accent:#2F5F96; --deck-paper:#1A1C21; --deck-mark:#3A6DA6;
    --deck-well:#EDEAE2;   --deck-track:#D8D4CA; --deck-hover:#E4E0D6;
    --deck-divider:#D2CEC3; --deck-edge:#DFDCD3; --deck-ring:#B9C4D6;
    --deck-faint:#7C8496;  --deck-quiet:#5F6058; --deck-warm:#6B6455;
    --deck-lift:rgba(0,0,0,.04); --deck-drop:rgba(0,0,0,.10);
    --deck-inset:rgba(0,0,0,.18); --deck-glow:rgba(58,109,166,.10);
    --lcd:#0a0b0e; --lcd-ink:#7FA3D8; --lcd-faint:#7C8496; --lcd-flag:#D9A44F;
```

Dark half:

```css
    --deck-accent:#9db0ff; --deck-paper:#f1ede4; --deck-mark:#7aa0ff;
    --deck-well:#17181c;   --deck-track:#1e2029; --deck-hover:#20242e;
    --deck-divider:#333743; --deck-edge:#33353d; --deck-ring:#39435c;
    --deck-faint:#4c566e;  --deck-quiet:#9a9dab; --deck-warm:#b7b0a2;
    --deck-lift:rgba(255,255,255,.055); --deck-drop:rgba(0,0,0,.5);
    --deck-inset:rgba(0,0,0,.85); --deck-glow:rgba(122,160,255,.1);
    --lcd:#0a0b0e; --lcd-ink:#7FA3D8; --lcd-faint:#7C8496; --lcd-flag:#D9A44F;
```

**The readout's contents are invariant too, and that is the correction this plan needed.** The
Device decision keeps `--lcd` dark in both themes — but the digits inside it are painted with
`var(--c-mid)` and the message with `var(--c-flag)`, and both of those *flip*. Measured against
the permanently dark `--lcd`, the light theme would print 0.76rem digits at **3.67:1** and a
message at **3.33:1**, inside the one element the whole metaphor exists to preserve. The
separator is worse and already is: `#4c566e` on `--lcd` is **2.68:1** today, in both themes.

So the readout gets its own constant palette — `--lcd-ink`, `--lcd-faint`, `--lcd-flag` —
declared identically in both halves beside `--lcd`, for the same reason. A real instrument's
digits do not change colour because the room did. `--deck-accent` and `--deck-faint` are then
only for chrome that genuinely flips.

Note `--deck-paper` and `--deck-well` **swap roles** between themes: on dark, paper is the warm off-white that inverted panels use and well is a dark recess; on light, paper is the dark text tone and well is the pale slab. That is the Device treatment — the object's body follows the theme, its readout does not. Set the fence's first line to `v7` and `versions.json`'s `tokens` to `"v7"`.

Each deck page currently declares `--lcd` itself, after the fence. Task 4 removes that declaration, since the block now owns it.

- [ ] **Step 2: Write the failing tests**

Append to `test/theme.test.mjs`. `palette` and the contrast helpers already exist in that file — reuse them, do not redefine.

```js
const DECK_TOKENS = ["deck-accent", "deck-paper", "deck-mark", "deck-well", "deck-track",
  "deck-hover", "deck-divider", "deck-edge", "deck-ring", "deck-faint", "deck-quiet",
  "deck-warm", "deck-lift", "deck-drop", "deck-inset", "deck-glow"];

test("both themes define every deck token", () => {
  // Seventeen names arriving in one half and not the other is the failure that shows up as a
  // single wrong colour on one deck in one theme, which nobody looks at.
  const css = blockFor("design tokens", "deck");
  const dark = palette(css, ":root");
  const light = palette(css, ':root\\[data-theme="light"\\]');
  for (const t of DECK_TOKENS) {
    assert.ok(dark[t], `--${t} missing from the dark half`);
    assert.ok(light[t], `--${t} missing from the light half`);
  }
});

test("--lcd is declared in both halves with the same value", () => {
  // Spec decision 3, asserted rather than described. A real machine with a pale body still has
  // a dark readout. If someone "completes" the light palette by giving --lcd a light value,
  // this is what says no.
  const css = blockFor("design tokens", "deck");
  const dark = palette(css, ":root");
  const light = palette(css, ':root\\[data-theme="light"\\]');
  assert.ok(dark["lcd"], "--lcd missing from the dark half");
  for (const t of ["lcd", "lcd-ink", "lcd-faint", "lcd-flag"])
    assert.equal(light[t], dark[t],
      `--${t} differs between themes; the readout and everything printed on it stay constant`);
});

test("the deck's readable tokens clear AA against the surface each is painted on", () => {
  // The pairs the transport actually paints, taken from deck-transport.css rather than
  // guessed: the accent and the faint separator sit on the LCD, the quiet and warm tones sit
  // on the slab. Plan A shipped a token pair at 4.35:1 because only token-against-background
  // was ever measured; this is that lesson applied to the deck.
  const css = blockFor("design tokens", "deck");
  for (const [name, sel] of [["dark", ":root"], ["light", ':root\\[data-theme="light"\\]']]) {
    const p = palette(css, sel);
    for (const [fg, bg] of [["lcd-ink", "lcd"], ["lcd-faint", "lcd"], ["lcd-flag", "lcd"],
                            ["deck-quiet", "deck-well"], ["deck-warm", "deck-well"]]) {
      const r = ratio(p[fg], p[bg]);
      assert.ok(r >= 4.5, `${name}: --${fg} on --${bg} is ${r.toFixed(2)}:1, needs 4.5`);
    }
  }
});

test("the deck tokens do not leak a light value into --lcd's neighbours by accident", () => {
  // --deck-paper and --deck-well swap roles between themes. If someone copies the dark block
  // into the light one wholesale, this catches it: on light, the well must be lighter than the
  // paper, and on dark the reverse.
  const css = blockFor("design tokens", "deck");
  const d = palette(css, ":root"), l = palette(css, ':root\\[data-theme="light"\\]');
  assert.ok(lum(d["deck-paper"]) > lum(d["deck-well"]), "dark: --deck-paper is not the lighter of the pair");
  assert.ok(lum(l["deck-well"]) > lum(l["deck-paper"]), "light: --deck-well is not the lighter of the pair");
});
```

- [ ] **Step 3: Run, then prove each can fail**

Run: `cd /Users/rob/git/robertblust/design && npm test`. Expected: FAIL before Step 1, PASS after.

Four mutations, each restored and re-confirmed:
1. Delete `--deck-ring` from the light half → test 1 fails naming it.
2. Give light `--lcd` the value `#EDEAE2` → test 2 fails.
3. Set light `--deck-quiet` to `#B9BCC6` → test 3 fails with a ratio under 4.5.
4. Copy the dark deck block verbatim into the light half → test 4 fails on the light pair.

Record each verbatim.

- [ ] **Step 4: Commit**

```bash
git add blocks/tokens.css versions.json test/theme.test.mjs
git commit -m "design tokens v7: the deck's own chrome, in both themes"
```

---

## Task 2: The transport and lockup blocks stop painting literals

**Files:**
- Modify: `/Users/rob/git/robertblust/design/blocks/deck-transport.css`, `blocks/deck-lockup-one.css`, `blocks/deck-lockup-two.css`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/blocks.test.mjs`

**Interfaces:**
- Consumes: the seventeen tokens from Task 1.
- Produces: `deck transport` and both `deck lockup` variants painting only `var(--…)`.

- [ ] **Step 1: Replace every literal with its token**

Work from the mapping table above. Every literal in these three blocks is one of the seventeen — verify that before you start:

```bash
cd /Users/rob/git/robertblust/design
grep -ohE '(?<!&)#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)' blocks/deck-transport.css blocks/deck-lockup-*.css | sort -u
```

Every value it prints must appear in Task 1's table. If one does not, stop and report it — an unlisted value means the sweep missed something and the plan's count is wrong.

`#1b2231` becomes `var(--press)`, which already exists. Four rules inside the readout re-point at
the invariant names rather than the flipping ones: `.lcd .n` takes `var(--lcd-ink)`,
`.lcd .n .sep` and `.lcd .n #tot` take `var(--lcd-faint)`, and `.lcd .n.msg` takes
`var(--lcd-flag)`. Those four are the reason the readout survives a theme it does not follow. Bump `deck transport` to **v5**, the two lockup fences by one each, and update `versions.json`.

- [ ] **Step 2: Write the failing test**

```js
test("the deck's chrome blocks paint no literal colours", () => {
  // The whole point of the deck tokens: a block that still names a colour cannot follow the
  // theme, and it will be a single wrong element on a light deck that nobody notices because
  // everything around it is right.
  for (const [name, variant] of [["deck transport", null], ["deck lockup", "one"], ["deck lockup", "two"]]) {
    const css = blockFor(name, variant).replace(/\/\*[\s\S]*?\*\//g, "");
    const literals = css.match(/(?<!&)#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)/g) ?? [];
    assert.deepEqual(literals, [],
      `${name}${variant ? " · " + variant : ""} still paints ${literals.join(", ")}`);
  }
});
```

Comments are stripped first, because these blocks' prose quotes hex values when explaining a decision and prose is not paint — the same distinction that produced three false positives in the measurement this plan rests on.

- [ ] **Step 3: Run, mutate, commit**

Run `npm test`. Then put one literal back — change a `var(--deck-ring)` to `#39435c` — and confirm the test fails naming it. Restore.

---

## Task 3: The theme fences gain a deck variant, and the control gets its transport styling

**Files:**
- Modify: `/Users/rob/git/robertblust/design/blocks/theme-boot.js`, `blocks/theme.js`, `blocks/deck-transport.css`, `lib/fences.mjs`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/theme.test.mjs`

**Interfaces:**
- Produces: `theme boot` and `theme` with `variants: ["page", "deck"]`; `.seg.theme` rules inside `deck transport`.

- [ ] **Step 1: Give both theme fences a deck variant**

`language` already has `variants: ["page", "deck"]` and the two variants differ only in indentation — read how it does that before changing anything. Give the theme fences the same treatment in `lib/fences.mjs`:

```js
  "theme boot": {
    key: "themeBoot", source: "blocks/theme-boot.js", version: versions.themeBoot,
    variants: ["page", "deck"], closes: null, params: ["themeKey"],
  },
  "theme": {
    key: "theme", source: "blocks/theme.js", version: versions.theme,
    variants: ["page", "deck"], closes: null, params: ["themeKey"],
  },
```

If the two variants would emit identical bytes, say so in your report rather than inventing a difference — `variants` exists so the marker records which surface a block is on, and identical bytes under two variant names is a legitimate outcome the `language` fence already has.

- [ ] **Step 2: Style the control for the transport bar**

The deck's control sits in the transport, not a header, so it needs the transport's own sizing rather than the header's. Add to `blocks/deck-transport.css`, beside the existing `.seg` rules:

```css
  /* The theme control rides in the transport beside the language one, so it takes the
     transport's touch sizing rather than the header's — the same 44px minimum the seg buttons
     already meet at the mobile breakpoints. */
  .seg.theme button{display:grid; place-items:center; padding:.26rem .42rem}
  .seg.theme svg{width:13px; height:13px; display:block; fill:none; stroke:currentColor;
                 stroke-width:2; stroke-linecap:round; stroke-linejoin:round}
```

- [ ] **Step 3: Test, mutate, commit**

```js
test("both theme fences offer a deck variant", () => {
  for (const f of ["theme boot", "theme"]) {
    assert.deepEqual(FENCES[f].variants, ["page", "deck"]);
    assert.doesNotThrow(() => blockFor(f, "deck", { themeKey: "x-theme" }));
  }
});

test("the deck's theme control is styled where it lives", () => {
  // In the transport, not a header — the deck has no header. If these rules ever move to the
  // header block the control loses its sizing on every deck at once.
  const css = blockFor("deck transport", null);
  assert.match(css, /\.seg\.theme button\{/);
  assert.match(css, /\.seg\.theme svg\{/);
});
```

Bump `package.json` to **0.11.0** — new variants and new tokens are a minor. Commit, then **stop**: open a pull request and wait. The release is the repository owner's call.

---

## Task 4: The four decks adopt the theme

**Files:** each site's deck `index.html`, and `verify/check.mjs`.

**Interfaces:**
- Consumes: the package release from Task 3.

- [ ] **Step 1: Re-pin and sync**

Per site, once the tag exists:

```bash
npm install "@robertblust/design@github:robertblust/design#v0.11.0" --save-dev
npm run design && npm run design:check
```

`npm install` alone will not refetch a moved tag.

- [ ] **Step 2: Place the fences and the control**

Per deck, mirroring what the prose pages already do:
- `theme boot` in `<head>`, **above** the `<style>` element.
- `theme` at the end of the body, immediately after the `language` fence, with `var theme` declared **after** the fence — the fence defines `themeFromUrl()`, so the shape is fence-then-var, exactly as `lang` does it.
- The control in the transport bar, immediately after the existing `<div class="seg" id="lang">`, wrapped so the two sit together the way the prose pages' `#langind` wrapper does.
- Wire both buttons to `setTheme("light")` / `setTheme("dark")` and call `applyTheme()`.
- Remove each deck's own `--lcd:#0a0b0e;` declaration — the block owns it now.

- [ ] **Step 3: Re-point the 26 local literals**

These are inline SVG fills on individual marks and are per-deck. Replace each with the nearest existing token by *meaning*: a fill that is the page ground becomes `var(--ground)`, one that is the slab becomes `var(--slab)`, and so on. Do not add token names for these — Ruling 3.

Then prove none remain:

```bash
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/deck-colours.mjs
```

It must report **0**.

- [ ] **Step 4: Turn the checks on**

Add `contrast: true` and `noFlash: "rb-theme"` to each deck's `PAGES` entry. The decks already carry `opensFromFile` and `storageKeys`.

- [ ] **Step 5: Verify, including the two things a green suite will not show**

Run every CI script per site. Then:

- **Both themes under `file://`.** Open each deck as a `file://` URL, in dark and in light. The boot script must set the theme with no network and no module. Storage on an opaque origin throws in some browsers, so a deck that cannot read a preference must still open — in dark. Confirm it does.
- **The readout stays dark in light.** Switch a deck to light and confirm the LCD is still the dark recess while the slab has gone pale. That is the Device decision and no check asserts it.

- [ ] **Step 6: Commit per site, open one PR per site, stop**

---

## Task 5: The sweep, and the cards

- [ ] **Step 1: Confirm the spec's criterion 9 across all twenty pages**

```bash
node /private/tmp/claude-501/-Users-rob-git-robertblust/9d8e94dd-36d8-4964-8358-39b2f85b06a8/scratchpad/colours.mjs
```

Zero literal colours on any of the twenty pages. This is the criterion Plan A met for prose and this plan finishes.

- [ ] **Step 2: The deck cards**

Each deck has an `og.png`. The renderer pins `rb-theme=dark`, so they must not change. Run `npm run og && npm run og:check` per site and confirm no `og.png` moves. If one does, the pin failed on decks and that is a finding, not a re-render.

---

## Self-Review

**Spec coverage.** Decision 1 (all twenty pages) — this plan is the remaining four. Decision 3 (the Device treatment, `--lcd` invariant) — Task 1 Step 1 and its second test. Decision 4 (dark default, OS never read) — inherited from Plan A's fences, unchanged. Decision 6 (`--c-weak` non-text-only) — unchanged. Criterion 1 (every page switches) — Task 4. Criterion 8 (decks open from `file://` in both themes) — Task 4 Step 5, which is the only place it is actually exercised; Plan A met it vacuously because the decks were dark-only. Criterion 9 (zero literals) — Task 5 Step 1.

**Placeholder scan.** No TBDs. The seventeen light values in Task 1 are concrete; they are flagged as proposals to be looked at, not as undecided.

**Type consistency.** The seventeen `--deck-*` names are introduced in Task 1's table, defined in Step 1, asserted in Step 2's `DECK_TOKENS`, consumed in Task 2, and re-pointed to in Task 4 Step 3. `--lcd` is owned by the block from Task 1 and removed from the pages in Task 4 Step 2.
