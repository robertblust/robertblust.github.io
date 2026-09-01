# The Deck Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four decks' runtimes one thing — first identical, then generated — and give the transport bar the boundary state it has never had.

**Architecture:** Three phases with a hard seam between the first two. **Phase A** makes the four runtimes identical by aligning every behavioural difference to blust.ch's form, and is the only phase where a visitor sees anything change. **Phase B** carves the per-talk payload out of the runtime and puts the remaining ~349 lines in the package. **Phase C** adopts, and must diff empty. The boundary between generic behaviour and per-instance payload is the one the measurement handed us: `UI` has 28 keys identical on all four decks and 4 that are per-talk.

**Tech Stack:** Node 22+, ESM, `node:test` + `node:assert/strict`, zero dependencies. `@robertblust/design` as a git dependency pinned to an exact tag. Playwright for the site suites.

**Spec:** `docs/superpowers/specs/2026-08-30-shared-design-system-design.md`

## Global Constraints

- The package takes **no dependencies and no devDependencies**. Never run `npm install` in it. A consuming site has dependencies by design and installs normally.
- ESM only in the package; `node:test` + `node:assert/strict`; `npm test` must exit 0.
- **No external assets, anywhere.** No font CDN, no remote stylesheet, no linked image.
- **A deck must open from a `file://` URL, with the repository intact, and present.** Relative paths upward are allowed and already used. What is forbidden is needing a server.
- Sites pin `github:robertblust/design#vX.Y.Z` — an exact **tag**, never a commit SHA. A SHA fails Dependabot's `pinned_ref_looks_like_version?` and the site silently never learns a release happened.
- **A fence's blocks must be placed in the order the package expects.** Two fences whose rules share a selector are order-dependent, and the last plan shipped a visible regression because nothing recorded that. See Task 6.
- Stage by name. Never `git add -A` or `git add .`.
- Merge with `gh pr merge --merge`. **Never `--squash`.**
- Do not merge any pull request. Open them and stop.
- Never mention closed-source predecessor projects.
- The git author must be `robert.blust@flatland.ch`.

---

## What the measurement found, and the four decisions taken

The runtime is **~420 lines per deck, of which ~349 are already identical on all four**. Everything that differs falls into five groups, and four of them were decided before this plan was written.

| difference | decision |
| --- | --- |
| companygraph's `#langtoggle` container, its click handler, `stopPropagation` on each button, `toggleLang()`, and the `<div class="tdiv">` divider | **removed** — all four get blust.ch's plain `<div class="seg" id="lang">` with two buttons |
| companygraph's `N` and `L` key bindings | **removed** — all four keep only the navigation keys |
| `clipsSeen` | **blust.ch's two lines** — see below |
| the per-talk `title` and `desc` strings | **stay per-deck**, as a payload the fence consumes |
| `role="group"` + `aria-label` | **added to all four**, on the plain control |

**`clipsSeen` was not a real difference.** companygraph's eight-line version reads as a lazy check and is not one:

```js
var clipsSeen = null;
function hasClips(){
  if (clipsSeen !== null) return clipsSeen;
  clipsSeen = true;                       // assume yes; clip.onerror handles the truth
  return clipsSeen;
}
```

It memoises `true` and probes nothing. Its comment claims *"Checked lazily so the deck makes no network request until someone actually presses play"* — neither version makes a request. blust.ch's `var clipsSeen = true; function hasClips(){ return clipsSeen; }` is behaviourally identical and honest. All four decks do carry recordings — 40 to 48 clips, 8 to 11 MB, under `audio/<lang>/` — so the optimism is correct everywhere.

**The ARIA attributes cost nothing visually.** Measured in Chromium: a plain `.seg` and the same markup with `role="group" aria-label="…"` render to the same box, the same buttons, and identical computed styles. What changes is only what a screen reader announces.

### The boundary the payload sits on

`UI` is one object with a `de` and an `en` key. Across the four decks:

- **28 keys are identical everywhere** — `label`, `close`, `play`, `pause`, `first`, `prev`, `next`, `full`, `unfull`, `notes`, `de`, `en`, `novoice`, `up`, in both languages. They describe the **transport**, not the talk.
- **4 keys are per-talk** — `title` and `desc`, in both languages.

So the deck declares a four-string payload and the fenced runtime consumes it. That is the same generic-behaviour-over-per-instance-payload boundary the stage already uses, and it is the only per-deck material inside the entire runtime block.

### `.lcd:has(.n.msg)` — decidable now, and it is a fix

The last plan left this rule outside every fence because deciding it needed the runtime. It is decided: **both** runtimes call `lcdn.classList.add('msg')`, so `.n.msg` is created by shared code on every deck. The rule sits inside `@media (max-width: 400px)`, where `.lcd{display:none}` hides the counter entirely — it re-shows the LCD when there is a message to show. blust.ch's two decks have it; companygraph's and guestgraph's do not, so on a narrow screen **they can never display a "No voice" message at all**. It goes into the shared transport block, which makes it a fix for two decks rather than a blust.ch peculiarity.

---

## File Structure

**In `/Users/rob/git/robertblust/design`:**

| file | responsibility |
| --- | --- |
| `blocks/deck-runtime.js` | new — the ~349 shared lines, consuming a `TALK` payload the page declares |
| `blocks/deck-transport.css` | `:disabled` styling and `.lcd:has(.n.msg)`; `transport` → v2 |
| `lib/fences.mjs` | one new `FENCES` entry, `deck runtime` |
| `versions.json` | `runtime: "v1"`, `transport` → `"v2"` |
| `test/blocks.test.mjs` | the runtime block's assertions |

**In each site:**

| file | responsibility |
| --- | --- |
| each deck | the language control's markup; the runtime aligned then fenced; a `TALK` payload above the fence |
| `verify/design.mjs` | a new `fenceOrder` check |
| `verify/check.mjs` | `PAGES` — `fenceOrder` per deck; companygraph's `translates` spec retargeted |

`verify/design.mjs` is byte-identical across the three repositories and must stay so.

---

# Phase A — make the four decks the same

Nothing in this phase is generated. It is four decks edited to agree, and it is the only phase where rendering changes.

### Task 1: companygraph's runtime loses what the other three never had

**Files:**
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/talks/intro/index.html`
- Modify: `/Users/rob/git/companygraph/companygraph.github.io/verify/check.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a companygraph deck whose runtime differs from blust.ch's only in the four per-talk `UI` strings. Tasks 4 and 5 depend on that.

- [ ] **Step 1: Replace the language control markup**

It currently reads:

```html
    <div class="seg" id="langtoggle" role="group" aria-label="Sprache wechseln — switch language">
      <button type="button" id="langDe" aria-pressed="false">DE</button>
      <div class="tdiv" aria-hidden="true"></div>
      <button type="button" id="langEn" aria-pressed="true">EN</button>
    </div>
```

Replace it with the form blust.ch and guestgraph carry, keeping the two ARIA attributes — Task 2 adds those to the other three, so all four end identical:

```html
    <div class="seg" id="lang" role="group" aria-label="Sprache wechseln — switch language">
      <button type="button" id="langDe" aria-pressed="false">DE</button>
      <button type="button" id="langEn" aria-pressed="true">EN</button>
    </div>
```

The `<div class="tdiv" aria-hidden="true">` between the buttons goes. It is the one visible difference — a grey divider — and it goes with the container handler that gave it meaning.

Delete the seven-line HTML comment above that block explaining `id="langtoggle"`. It describes a mechanism that will not exist.

- [ ] **Step 2: Replace the language listeners**

Currently nine lines:

```js
  // Each button picks its language directly and stops the click there, so it never
  // also reaches #langtoggle's own listener below — a mouse user who clicks the
  // already-active button sees nothing happen, same as before this control existed.
  langDe.addEventListener('click', function(e){ e.stopPropagation(); setLang('de'); });
  langEn.addEventListener('click', function(e){ e.stopPropagation(); setLang('en'); });
  // A click that lands on the divider between the two buttons (or, from a script,
  // on #langtoggle itself) is not aimed at either language specifically — it toggles,
  // the same as the talks index's single #langind control does.
  document.getElementById('langtoggle').addEventListener('click', toggleLang);
```

Replace with the two lines the other three carry:

```js
  langDe.addEventListener('click', function(){ setLang('de'); });
  langEn.addEventListener('click', function(){ setLang('en'); });
```

- [ ] **Step 3: Remove `toggleLang` and the two key bindings**

Delete `function toggleLang(){ setLang(lang === 'de' ? 'en' : 'de'); }` — with the `#langtoggle` listener and the `L` key gone, nothing calls it, and a function nothing calls is worse than no function.

In the `keydown` handler, delete these two lines:

```js
    else if(e.key==='n'||e.key==='N'){ setNotes(!notesOpen); e.preventDefault(); }
    else if(e.key==='l'||e.key==='L'){ toggleLang(); e.preventDefault(); }
```

Then rewrite the comment above the handler. It currently explains N and L at length; it must describe only the navigation keys, matching blust.ch's:

```js
  /* The deck is driven by the buttons. These keys stay because a presenter remote sends
     them — it is a clicker pretending to be a keyboard — and are deliberately not
     advertised anywhere on screen. */
```

- [ ] **Step 4: Replace `clipsSeen` with blust.ch's**

Delete the eight-line lazy version and its comment, and write:

```js
  /* Optimistic, and correct now that this deck has recorded clips: if a clip exists we
     never need a voice installed, and clip.onerror handles the case where one is missing
     by falling back to the browser voice. Reporting false here would refuse to play for
     a viewer with no installed voice even though the recordings would play fine. */
  var clipsSeen = true;
  function hasClips(){ return clipsSeen; }

**Copy this verbatim from `talks/mental-model/index.html` rather than from this plan.** The four
decks must end byte-identical here, and a paraphrase that wraps differently makes four comment lines
differ for no reason — which is exactly what happened when this plan first said "and correct — this
deck has recorded clips".
```

- [ ] **Step 5: Retarget the `translates` spec**

`translates` clicks a single id and clicks a second to return. Its own comment says so: *"A deck's transport carries its own control under its own id, so the spec names it rather than this check branching on which page it is."* With `#langtoggle` gone the deck's entry in `PAGES` must name the two buttons:

Change `translates: { ... id: "langtoggle" ... }` on the `/talks/intro/` entry so it reads `id: "langDe", backId: "langEn"`, leaving every other key in that spec untouched. Read the entry first — do not retype the `shows`/`hides` arrays.

- [ ] **Step 6: Run the suite**

```bash
cd /Users/rob/git/companygraph/companygraph.github.io
lsof -ti:8000 || python3 -m http.server 8000 >/dev/null 2>&1 &
npm run verify
```

Expected: pass, with `translates` on `/talks/intro/` exercising the two buttons.

**If `translates` fails, do not weaken it.** It is the check that proves the language round-trip still works through the plainer control, and this task is exactly the change that could break it.

- [ ] **Step 7: Confirm the runtime now differs only in the per-talk strings**

```bash
python3 - <<'PY'
import re
def rt(p):
    t=open(p,encoding='utf-8').read()
    b=re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>',t,re.S)[1]
    return [re.sub(r'\s+',' ',l.strip()) for l in b.split("\n") if l.strip()]
a=rt("/Users/rob/git/robertblust/robertblust.github.io/talks/mental-model/index.html")
b=rt("/Users/rob/git/companygraph/companygraph.github.io/talks/intro/index.html")
only_a=[l for l in a if l not in b]; only_b=[l for l in b if l not in a]
print(f"only in blust.ch: {len(only_a)}   only in companygraph: {len(only_b)}")
for l in only_a+only_b: print("   ", l[:104])
PY
```

Expected: the only remaining lines are `title:` and `desc:` in each language, plus the `var LANG_KEY` line inside the language fence. Anything else is an alignment this task missed — record it in the report.

- [ ] **Step 8: Commit**

```bash
git add talks/intro/index.html verify/check.mjs
git commit -m "The deck's language control loses what the other three never had

#langtoggle was a container with its own click handler, so a click on the
divider between DE and EN swapped the language wholesale. The buttons then
had to stopPropagation so a direct click did not fire twice, and toggleLang
existed to serve both that handler and an L key binding this deck alone had.

None of it is on the other three decks, and the check it was partly built
for is parameterised — translates names the control in PAGES rather than
assuming an id, so pointing it at langDe and langEn is a spec edit.

clipsSeen goes with them, and it was never a difference: the lazy version
memoised true and probed nothing, under a comment claiming it avoided a
network request that neither version makes."
```

---

### Task 2: The other three get the ARIA, and all four get the boundary state

**Files:**
- Modify: `talks/mental-model/index.html`, `talks/essential-complexity/index.html` in `/Users/rob/git/robertblust/robertblust.github.io`
- Modify: `talks/intro/index.html` in `/Users/rob/git/guestgraph/guestgraph.github.io`
- Modify: all four decks' `render()`

**Interfaces:**
- Consumes: Task 1's aligned companygraph deck.
- Produces: four decks whose runtime and language markup are identical but for the per-talk strings. Task 5 fences exactly that.

- [ ] **Step 1: Add the ARIA attributes to the three plain controls**

blust.ch's two decks and guestgraph's each carry:

```html
    <div class="seg" id="lang">
```

Change to:

```html
    <div class="seg" id="lang" role="group" aria-label="Sprache wechseln — switch language">
```

Nothing else in that block changes. The label is deliberately bilingual — the control is the one thing on the page that means the same in both languages, and it is read by a screen reader before the user has chosen one.

- [ ] **Step 1b: guestgraph's `clipsSeen`, which this plan first missed**

guestgraph carries the same eight-line lazy version companygraph had — `var clipsSeen = null` with a
`hasClips()` that memoises `true` and probes nothing. Task 1 aligned companygraph and this plan said
nothing about guestgraph, which was an omission: blust.ch's two decks and companygraph's now agree
and guestgraph's does not.

Replace it with blust.ch's form, **copied verbatim from `talks/mental-model/index.html`** rather than
retyped, so all four end byte-identical. Confirm by grep afterwards that `clipsSeen = null` appears
in no deck.

- [ ] **Step 2: Add the boundary state to `render()`, in all four decks**

`render()` already runs on every slide change and already updates the progress bar and the counter. It ends:

```js
    if(notesOpen){
      var d = slides[i].dataset;
      ntext.innerHTML = (lang === 'en' && d.notesEn) ? d.notesEn : d.notes;
      ntime.textContent = d.time || '';
    }
    fitNotes();
  }
```

Insert before `fitNotes();`:

```js
    /* The ends of the deck, made visible. go() has always clamped, so these controls
       were already no-ops here — this is the state saying so rather than a click that
       does nothing. `first` goes with `prev`: at slide zero it is equally inert, and
       dimming one while the other stays lit next to it reads as a bug. */
    btn.prev.disabled = btn.first.disabled = (i === 0);
    btn.next.disabled = (i === slides.length - 1);
```

`btn` is already declared in every deck as `var btn = { first:…, prev:…, play:…, next:…, full:…, notes:… }`. Use it; do not re-query the DOM.

- [ ] **Step 3: Check the boundary state in a browser**

The styling arrives with the package in Phase B, so at this point the attribute is set and nothing looks different. Assert the attribute, not the appearance:

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
node -e '
const { chromium } = require("playwright");
(async()=>{const b=await chromium.launch(); const p=await b.newPage();
 await p.goto("file://" + process.cwd() + "/talks/mental-model/index.html");
 const at0 = await p.evaluate(()=>({prev:tPrev.disabled, first:tFirst.disabled, next:tNext.disabled}));
 await p.evaluate(()=>{ for(let k=0;k<20;k++) tNext.click(); });
 const atEnd = await p.evaluate(()=>({prev:tPrev.disabled, first:tFirst.disabled, next:tNext.disabled}));
 console.log("slide 0 :", JSON.stringify(at0));
 console.log("last    :", JSON.stringify(atEnd));
 await b.close();})();'
```

Expected: at slide 0 `prev` and `first` are `true` and `next` is `false`; at the last slide the reverse. Run it for one deck in each repository and put all three outputs in the report.

- [ ] **Step 4: Run all three suites**

Serve each repository in turn — check `lsof -ti:8000` first, a sibling site left serving there fails the whole suite against a site you are not testing.

Expected: three passes.

- [ ] **Step 5: Commit, one per repository**

```bash
git commit -m "The transport says where the deck ends, and the language control says what it is

go() has always clamped, so prev at slide zero and next at the last slide
were already no-ops. Nothing said so: the buttons looked live and did
nothing. render() now sets disabled on both, and on first alongside prev,
which is equally inert at slide zero.

The styling arrives with the next design release — .tbtn lives inside the
shared transport fence, so a disabled treatment is a package change.

role=group and aria-label go on the language control, which measured
pixel-identical: they change only what a screen reader announces, from two
unlabelled buttons to one named control."
```

---

# Phase B — make them one

### Task 3: The transport learns a disabled state, and gains a rule two decks were missing

**Files:**
- Modify: `/Users/rob/git/robertblust/design/blocks/deck-transport.css`
- Modify: `/Users/rob/git/robertblust/design/versions.json`
- Test: `/Users/rob/git/robertblust/design/test/blocks.test.mjs`

**Interfaces:**
- Consumes: `blockFor`, `FENCES` as released in v0.5.0.
- Produces: `deck transport` at **v2**. Tasks 8–10 adopt it; blust.ch's decks must drop their own `.lcd:has(.n.msg)` when they do.

Work on the package's `main`, as plans 1–5 did.

- [ ] **Step 1: Add the disabled styling**

There is none today — `.tbtn` has `:hover`, `:focus-visible` and `[aria-pressed="true"]` and no disabled rule at all. Add, immediately after the `:hover` rule:

```css
  .tbtn:disabled{opacity:.35; cursor:default}
  .tbtn:disabled:hover{color:inherit; background:none}
```

The second line is the one that is easy to omit and the reason the first is not enough: `.tbtn:hover` sets a colour and a background, so without it a disabled button still lights up under the pointer and reads as clickable.

- [ ] **Step 2: Add the rule two decks are missing**

Inside the block's `@media (max-width: 400px)` query, where `.lcd{display:none}` already is, add immediately after it:

```css
    .lcd:has(.n.msg){display:flex}
```

with a comment saying what it is for: below 400px the counter is hidden to make room, but the same element carries transient messages — `lcdMessage()` adds `.msg` to `#lcdn` — and a message with nowhere to appear is worse than a hidden counter. blust.ch's two decks have carried this rule outside the fence; companygraph's and guestgraph's have never had it.

- [ ] **Step 3: Bump the version, in both places**

`blocks/deck-transport.css` line 1 says `deck transport · v1 · {{variant}}`. Change `v1` to `v2`, and `versions.json`'s `"transport"` to `"v2"`. Both, or the per-fence version assertion fails — which is what it is for.

- [ ] **Step 4: Write the tests**

Append to `test/blocks.test.mjs`:

```js
test("a disabled transport button does not light up under the pointer", () => {
  // :hover sets colour and background, so opacity alone leaves a disabled button
  // looking clickable. Both halves or neither.
  const css = blockFor("deck transport", null);
  assert.match(css, /\.tbtn:disabled\{[^}]*opacity/);
  assert.match(css, /\.tbtn:disabled:hover\{/);
});

test("the narrow-screen transport can still show a message", () => {
  // .lcd is hidden below 400px to make room; lcdMessage() puts transient text in the
  // same element, so it has to come back when there is something to say.
  const css = blockFor("deck transport", null);
  const narrow = css.match(/@media \(max-width: ?400px\)\{[\s\S]*?\n  \}/)[0];
  assert.match(narrow, /\.lcd\{display:none\}/);
  assert.match(narrow, /\.lcd:has\(\.n\.msg\)\{display:flex\}/);
});
```

- [ ] **Step 5: Run, and prove the second test is not vacuous**

```bash
cd /Users/rob/git/robertblust/design
npm test 2>&1 | tail -5
```

Expected: pass. Then delete the `.lcd:has(.n.msg)` line from the block and re-run — the second test must fail. Restore, confirm `git status` is clean, re-run green, and put both outputs in the report.

- [ ] **Step 6: Commit**

```bash
git add blocks/deck-transport.css versions.json test/blocks.test.mjs
git commit -m "The transport gets a disabled state, and a rule two decks never had

go() clamps at both ends, so the first and last slides leave three controls
inert. There was no disabled styling on .tbtn at all — not even a hover
suppression, which matters more than the dimming: without it a disabled
button still lights up under the pointer.

.lcd:has(.n.msg) has been on blust.ch's two decks and on neither of the
others. Below 400px the counter is hidden to make room, but lcdMessage()
puts transient text in that same element — so companygraph and guestgraph
could never show a message on a narrow screen. It belongs to every deck."
```

---

### Task 4: `blocks/deck-runtime.js` — the shared runtime, and the payload it consumes

**Files:**
- Create: `/Users/rob/git/robertblust/design/blocks/deck-runtime.js`
- Modify: `/Users/rob/git/robertblust/design/lib/fences.mjs`, `versions.json`
- Test: `/Users/rob/git/robertblust/design/test/blocks.test.mjs`

**Interfaces:**
- Consumes: `blockFor(name, variant, params = {})`; the `parts` mechanism is **not** needed here.
- Produces: fence `"deck runtime"` — `key: "runtime"`, `source: "blocks/deck-runtime.js"`, `variants: null`, `closes: null`, no `params`. `versions.json` gains `"runtime": "v1"`. The block reads a global `TALK` the page declares above the fence.

- [ ] **Step 1: Take the runtime from an aligned deck**

After Phase A the four runtimes differ only in four strings. Take blust.ch's `talks/mental-model/index.html` second inline `<script>` block, and make three changes and no others:

1. The `language` fence inside it stays exactly as it is, markers included. It is a fence within the region and the sync tool handles it independently.
2. `UI`'s four per-talk values are replaced by references to the payload:

```js
    de:{ label:'Sprecher-Notiz', close:'Notizen schliessen',
         title:TALK.de.title, desc:TALK.de.desc,
```

and the same for `en`. The other 28 keys keep their literal strings — they describe the transport, not the talk, and are identical on all four decks.

3. The block gains the standard markers, version typed into line 1, two-space indented like every other block. `blocks/lang.js` is the precedent for a JS block's marker shape.

- [ ] **Step 2: State the seam in the block's own comment**

The block reads a `TALK` global it does not define. That contract is invisible to `design:check`, which only compares bytes between markers — the same class of unstated seam an earlier release had to correct in `blocks/lang.js`. Say it plainly at the top of the block: the page must declare, **above** this fence,

```js
  var TALK = { de:{ title:'…', desc:'…' }, en:{ title:'…', desc:'…' } };
```

and that everything else about the deck's chrome — every other UI string, every control — belongs to this block and is not the page's to change.

- [ ] **Step 3: Write the tests**

```js
test("the deck runtime reads its per-talk strings from TALK, not from literals", () => {
  const js = blockFor("deck runtime", null);
  assert.match(js, /title:TALK\.de\.title/);
  assert.match(js, /desc:TALK\.en\.desc/);
});

test("the deck runtime hardcodes no talk's own title", () => {
  // The four titles that were in the four decks. If any reappears, a deck's content
  // has been baked into the shared block.
  const js = blockFor("deck runtime", null);
  for (const s of ["Mental Model", "Essential Complexity", "CompanyGraph", "GuestGraph"])
    assert.doesNotMatch(js, new RegExp(s), `${s} must not be in the shared runtime`);
});

test("the deck runtime keeps the transport's own labels", () => {
  // The 28 UI keys that are identical on all four decks describe the transport, not
  // the talk, and stay in the block. A regression here would push them to the payload.
  const js = blockFor("deck runtime", null);
  for (const s of ["Sprecher-Notiz", "Speaker note", "Back to the start", "No voice"])
    assert.match(js, new RegExp(s));
});

test("the deck runtime block declares no variants and no parameters", () => {
  assert.equal(FENCES["deck runtime"].variants, null);
  assert.equal(FENCES["deck runtime"].params, undefined);
  assert.equal(FENCES["deck runtime"].closes, null);
});
```

- [ ] **Step 4: Run and watch them fail, then register the fence**

```bash
npm test 2>&1 | tail -20
```

Expected: FAIL — `no such fence: deck runtime`. Then add to `FENCES`, after `"deck fit"`:

```js
  // The deck's whole runtime, minus the four strings that belong to the talk. Those come
  // from a `TALK` global the page declares above this fence — the same generic-behaviour-
  // over-per-instance-payload boundary the stage uses. 28 of UI's 32 keys are in here
  // because they describe the transport; the 4 that are not describe the talk.
  "deck runtime": {
    key: "runtime", source: "blocks/deck-runtime.js", version: versions.runtime,
    variants: null, closes: null,
  },
```

and `"runtime": "v1"` to `versions.json`. Re-run: expected all pass.

- [ ] **Step 5: Update the fence-name enumeration**

`test/fences.test.mjs` names exactly the fences this release ships. One more means the list and the title's number change, nothing else.

- [ ] **Step 6: Commit**

```bash
git add blocks/deck-runtime.js lib/fences.mjs versions.json test/blocks.test.mjs test/fences.test.mjs
git commit -m "The deck runtime, minus the four strings that belong to the talk

~349 of ~420 lines were already identical on all four decks; Phase A made
the rest agree. What is left that genuinely differs is four strings: title
and desc, in two languages. UI's other 28 keys describe the transport — the
button labels, the notes panel, the no-voice message — and are identical
everywhere, so they stay in the block.

So the page declares a TALK payload above the fence and the runtime reads
it. That seam is invisible to design:check, which compares only the bytes
between markers, so the block states it in its own comment."
```

---

### Task 5: The fence-order assertion

**Files:**
- Modify: each site's `verify/design.mjs` (add `fenceOrder`)
- Modify: each site's `verify/check.mjs` (`fenceOrder` per deck in `PAGES`)

**Interfaces:**
- Consumes: `DESIGN_CHECKS`, and the `fences` check an earlier plan added.
- Produces: `fenceOrder` in `DESIGN_CHECKS`, reading `spec.fenceOrder` — an array of fence names in the order they must appear.

The last plan shipped a visible regression because two fences both carried a `.name` rule at identical specificity, and which won was decided by their order in the file. `design:check` compares bytes per fence, order-independently. `fences` asserts presence. **Nothing recorded that order matters, and nothing checked it.** A deck now carries five fences; this closes it.

- [ ] **Step 1: Write the check**

Add to `DESIGN_CHECKS` in `verify/design.mjs`, after `fences`:

```js
  // Two fences whose rules share a selector are order-dependent: equal specificity means
  // the later one wins, and a media query adds none. That is not hypothetical — the deck
  // lockup and the deck transport both carry a `.name` rule, and a release once shipped
  // the lockup visible on mobile on two decks because one site emitted them in the
  // opposite order. design:check compares each fence's bytes independently and cannot see
  // it; `fences` asserts presence and cannot see it either.
  //
  // Fetched raw, like `fences`: a fence marker is a comment and comments do not survive
  // into the rendered stylesheet.
  async fenceOrder(page, spec) {
    const res = await fetch(spec.absolute);
    const html = await res.text();
    const seen = [...html.matchAll(/─── ([a-z ]+?) · v\d+/g)].map((m) => m[1]);
    const want = spec.fenceOrder;
    const got = seen.filter((n) => want.includes(n));
    return got.join(" → ") === want.join(" → ")
      ? null
      : `fences appear as ${got.join(" → ")}, expected ${want.join(" → ")}`;
  },
```

It filters to the fences the spec names, so a page carrying others is unaffected and a spec may constrain a subset.

- [ ] **Step 2: Arm it on the four decks**

Add to each deck's `PAGES` entry, in the order those fences actually appear on that deck after Phase A:

```js
    fenceOrder: ["design tokens", "deck lockup", "deck transport", "language", "deck runtime", "deck fit"],
```

**Derive this from the decks, not from this plan.** Read the markers off each deck and write what is there:

```bash
grep -o '─── [a-z ]* · v[0-9]*' talks/mental-model/index.html | sed 's/ · v[0-9]*//'
```

If two decks legitimately differ in order, that is a finding — report it rather than forcing one.

- [ ] **Step 3: Prove it fails**

Swap two adjacent fence blocks on one deck — whole blocks, markers included — and run the suite. Expected: FAIL, naming that deck and both orders. Restore, confirm `git diff --stat` is empty, re-run green. Put both outputs in the report.

- [ ] **Step 4: Port to all three sites and run every suite**

`verify/design.mjs` must stay byte-identical. Copy, prove the three md5s match, report the value. Run all three suites; expected three passes.

- [ ] **Step 5: Commit, one per repository**

```bash
git commit -m "Assert the order the fences are in, because the cascade depends on it

A release shipped the deck lockup visible on mobile, on two decks, because
the lockup and the transport fences both carry a .name rule at identical
specificity and one site emitted them in the opposite order. Every gate was
green: design:check compares each fence's bytes independently, and the
fences check asserts presence. Neither can see a relationship between two
fences.

fenceOrder takes the order from PAGES — the site's own declaration of what
it ships — and asserts the fences appear in it. Demonstrated by swapping two
adjacent blocks and watching it name both orders."
```

---

### Task 6: Release 0.6.0

**Files:** `/Users/rob/git/robertblust/design/package.json`

- [ ] **Step 1: Bump and test**

`package.json` to `0.6.0` — a minor, because adopting it requires each site to run `npm run design` and commit what changed.

```bash
cd /Users/rob/git/robertblust/design && npm test 2>&1 | tail -5
```

Expected: all pass.

- [ ] **Step 2: Verify the release's contents before naming them**

```bash
node -e 'import("./lib/fences.mjs").then(({FENCE_NAMES})=>console.log([...FENCE_NAMES].join(", ")))'
cat versions.json
```

Confirm `deck runtime` is present and `transport` reads `v2`. A release commit naming contents it does not have is worse than no release.

- [ ] **Step 3: Commit and push**

```bash
git add package.json
git commit -m "Release 0.6.0: the deck runtime, and the transport's disabled state"
git push
```

- [ ] **Step 4: Report and stop.** Do not tag; do not create a release.

---

### Task 7: Tag the release

**Files:** none. The human operator's task.

- [ ] **Step 1: Confirm CI is green on the package's `main`**
- [ ] **Step 2: Tag `v0.6.0` and push the tag**
- [ ] **Step 3: Create the GitHub release**

Tasks 8–10 pin `github:robertblust/design#v0.6.0`. A commit SHA is not acceptable.

---

# Phase C — adopt

### Task 8: blust.ch's two decks adopt

**Files:**
- Modify: `package.json`, `package-lock.json`, both decks, `verify/check.mjs`

**Interfaces:**
- Consumes: `@robertblust/design@0.6.0`; fences `deck runtime` and `deck transport` v2; `fenceOrder` from Task 5.
- Produces: nothing Tasks 9 and 10 consume.

- [ ] **Step 1: Pin the release**

```bash
cd /Users/rob/git/robertblust/robertblust.github.io
npm install github:robertblust/design#v0.6.0
```

A real install, not `--package-lock-only` — that moves the lockfile and leaves `node_modules` on the old release, so the sync writes the previous version's bytes while the lockfile claims the new one.

- [ ] **Step 2: Lift the payload out, then fence the runtime**

On each deck, above where the `deck runtime` fence will open, declare the payload with that deck's own four strings, taken verbatim from its current `UI`:

```js
  /* This talk's own strings. Everything else about the deck's chrome comes from
     @robertblust/design — see the fence below. */
  var TALK = {
    de:{ title:'…', desc:'…' },
    en:{ title:'…', desc:'…' }
  };
```

Then wrap the runtime in `deck runtime · v1 · shared` markers. **The `language` fence stays inside**, exactly as it is — it is a fence within the region and the tool handles both.

- [ ] **Step 3: Drop the now-duplicated `.lcd:has(.n.msg)`**

These two decks carry that rule in their own CSS, outside the fence. `deck transport` v2 brings it inside. Delete the local copy, and the comment beside it saying a later plan would decide it — this plan did.

- [ ] **Step 4: Sync and read the diff**

```bash
npm run design
git diff --stat
git diff talks/mental-model/index.html
```

Expected beyond the marker lines and the `TALK` block: **the transport fence's two new rules, and nothing else**. The runtime came from this deck, so its body must come back unchanged. If any runtime line moves, stop and report the diff — it means the block and this deck disagree, and the block is wrong.

- [ ] **Step 5: Arm the new fences and run everything**

Add `"deck runtime"` to each deck's `fences` array and to its `fenceOrder`. Then:

```bash
python3 -m http.server 8000 >/dev/null 2>&1 &
npm run verify
npm run design:check; echo "exit=$?"
npm run og && npm run og:check; echo "exit=$?"
```

Expected: all pass.

- [ ] **Step 6: Confirm the boundary state now looks disabled**

The styling has arrived. Render it:

```bash
node -e '
const { chromium } = require("playwright");
(async()=>{const b=await chromium.launch(); const p=await b.newPage();
 await p.goto("file://" + process.cwd() + "/talks/mental-model/index.html");
 const s=await p.evaluate(()=>({d:tPrev.disabled, o:getComputedStyle(tPrev).opacity}));
 console.log("slide 0, prev:", JSON.stringify(s));
 await b.close();})();'
```

Expected: `disabled` true and opacity `0.35`. Report it.

- [ ] **Step 7: Open a deck from `file://` yourself and say what you saw.** It is the human-visible confirmation of the constraint the whole system is built around.

- [ ] **Step 8: Commit and open a pull request.** Stage by name including every `og.png`/`og.sha` that moved. Write the body into a file and pass `--body-file`; never `--fill`. Show the render change rather than asserting it.

---

### Task 9: companygraph.io's deck adopts

**Files:** `package.json`, `package-lock.json`, `talks/intro/index.html`, `verify/check.mjs`

- [ ] **Steps 1–8:** identical in shape to Task 8, with one difference and one absence.

**The difference:** this deck's `TALK` payload carries companygraph's own four strings.

**The absence:** it has no local `.lcd:has(.n.msg)` to delete — Task 8's Step 3 does not apply here. Instead, expect the transport fence to *gain* that rule, which is the fix this deck has been missing.

Expected diff beyond markers and `TALK`: the transport fence's two new rules and nothing else.

---

### Task 10: guestgraph.io's deck adopts, and the whole thing is asserted

**Files:** `package.json`, `package-lock.json`, `talks/intro/index.html`, `verify/check.mjs`

- [ ] **Steps 1–8:** as Task 9 — this deck also has no local `.lcd:has(.n.msg)`.

- [ ] **Step 9: Assert the point, across all three repositories**

```bash
python3 - <<'PY'
import re, hashlib, os
ROOTS = {"rb": "/Users/rob/git/robertblust/robertblust.github.io",
         "cg": "/Users/rob/git/companygraph/companygraph.github.io",
         "gg": "/Users/rob/git/guestgraph/guestgraph.github.io"}
for fence in ["deck runtime", "deck transport", "deck lockup", "deck fit"]:
    seen = {}
    for k, root in ROOTS.items():
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if d not in ("node_modules", ".git", "tmp", ".superpowers")]
            if "index.html" not in fn: continue
            p = os.path.join(dp, "index.html"); t = open(p, encoding="utf-8").read()
            if 'class="slide' not in t: continue
            m = re.search(rf"─── {fence} ·.*?─── end {fence} ───+\s*\*/", t, re.S)
            if not m: print(f"   MISSING {fence} in {k}:{os.path.relpath(p, root)}"); continue
            body = re.sub(r"· (one|two|shared) ", "· V ", m.group(0))
            # A fence that declares params differs per site by design. `deck runtime` carries
            # the nested `language` fence, so its `LANG_KEY` line — and the seam comment that
            # names it — resolve to each site's own key. Normalise the declared parameter the
            # same way the variant word is normalised, or the count reports one form per site
            # and looks like drift.
            body = re.sub(r"\b(?:rb|cg|gg)-lang\b", "SITE-lang", body)
            seen.setdefault(hashlib.md5(body.encode()).hexdigest(), []).append(k)
    print(f"{fence}: {len(seen)} form(s) over {sum(len(v) for v in seen.values())} decks")
    for h, ks in seen.items(): print(f"   {h[:8]}  {len(ks)} decks  {'+'.join(sorted(set(ks)))}")
PY
```

Expected: `deck runtime`, `deck transport` and `deck fit` **one form over four decks each**; `deck lockup` **two forms**, as before.

Report the output verbatim. If a number differs, say so plainly rather than explaining it away.

---

## Rulings taken while writing this plan

**1. The four alignments all go to blust.ch's form**, decided before this plan: the plain language control, no `stopPropagation`, no `N`/`L`, and `clipsSeen` as two lines. *Cost if wrong:* companygraph loses a divider and two shortcuts a presenter may have learned.

**2. `role="group"` and `aria-label` are added rather than dropped**, though the decision that removed the container handler bundled them. They are independent of it and cost nothing visually — measured pixel-identical. *Cost if wrong:* two attributes nobody wanted.

**3. `.lcd:has(.n.msg)` goes to all four**, because both runtimes create `.n.msg`. It is a fix for two decks, not a peculiarity of one. *Cost if wrong:* a rule on two decks that never fires — which is its status quo on the other two today.

**4. `first` is disabled alongside `prev`.** At slide 0 it is equally inert, and dimming one while the other stays lit beside it reads as a bug rather than a state. *Cost if wrong:* a control a user might have pressed to confirm they are at the start.

**5. Real `disabled`, not `aria-disabled`.** It removes the control from tab order, which is right for a control that does nothing. *Cost if wrong:* a keyboard user cannot focus a button that would do nothing anyway.

**6. The runtime is one fence, not six.** Its shared lines fall in six contiguous runs only because the per-talk strings sit between them; lifting those out to a `TALK` payload makes the whole region contiguous. *Cost if wrong:* one large fence where six smaller ones would localise a conflict.

**7. Phase A is a separate phase, and its diff is deliberately not empty.** Aligning four decks changes what a visitor sees; extracting them must not. Keeping them in one phase would make the extraction's gate unstateable — the same trap an earlier plan fell into. *Cost if wrong:* two review surfaces where one would do.

---

## Self-review

**Spec coverage.** This completes tier 2b: the chrome landed in the previous plan, the runtime lands here. The spec's *"generic behaviour over a per-instance payload"* boundary is the `TALK` carve-out, and its *"finding it precisely is most of the work here"* is what the 28-versus-4 measurement did. Two coverage items the spec lists for tier 3 arrive early because this plan touches the files anyway: `fenceOrder`, which the previous plan's final review asked for, and the retargeted `translates` spec.

Not covered, and not claimed: tier 3's imported check bodies and `head.mjs`, tier 4's card harness, and the branch ruleset on `robertblust/design` that criterion 13 puts on the day the last plan lands. Arming `translates` on blust.ch and guestgraph — which have neither the check nor a spec — is tier 3's business and is deliberately not here.

**Placeholder scan.** No "TBD", no "handle edge cases". Tasks 9 and 10 refer to Task 8's shape rather than repeating eight identical steps against a different repository; that is deliberate, and each names its own difference and absence explicitly. The `TALK` payload's four strings are written as `'…'` because they are per-deck content the executor copies from the deck it is editing — the step says so.

**Type consistency.** `fenceOrder` reads `spec.fenceOrder` throughout; `fences` and `storageKeys` and `opensFromFile` are untouched. The fence is `"deck runtime"` with `versions.json` key `runtime`, matching the existing name-versus-key convention. `TALK` has the same shape in Task 4's block, Task 8's payload and the tests. `btn.first`, `btn.prev` and `btn.next` are the names already in every deck.

**One risk worth naming.** Task 8 Step 4 expects the runtime body to come back unchanged, because the block was taken from that very deck. If it does not, the block and the deck disagree and the block is wrong — that step says stop rather than accept, because a runtime that "mostly" matches is a runtime nobody can trust.
