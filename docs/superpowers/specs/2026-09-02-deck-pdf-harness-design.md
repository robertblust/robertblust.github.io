# The deck PDF exporter moves into the package

`export-pdf.mjs` renders each slide deck to a 16:9 PDF fallback, one slide per page, in both
languages. There is one copy per site — blust.ch at the repository root, companygraph.io and
guestgraph.io under `talks/intro/` — and the three are the same program. It moves into
`@robertblust/design` beside the card harness, and each site keeps a list of its decks.

The card harness spec put this out of scope and said it gets its own pass. This is that pass.

## What the measurement changed

That earlier spec justified deferring on the grounds that blust.ch's copy "differs by 73
lines". The number is real and it is misleading: blust.ch loops over a list of decks and the
other two handle the single deck their file sits beside, so the same code is indented one
level deeper and the line-based diff counts all of it.

Compared by behaviour rather than by line, the three are identical:

| | blust.ch | companygraph.io | guestgraph.io |
|---|---|---|---|
| viewport | `1280 × 720` | `1280 × 720` | `1280 × 720` |
| `deviceScaleFactor` | 2 | 2 | 2 |
| languages | `["de", "en"]` | `["de", "en"]` | `["de", "en"]` |
| navigation | `networkidle` | `networkidle` | `networkidle` |
| after the language click | 400ms | 400ms | 400ms |
| per slide | 500ms | 500ms | 500ms |
| hide rule | `.transport,.bar,.notes` | same | same |
| screenshot clip | `0,0,W,H` | same | same |

**This is the important difference from the card harness, and it cuts the other way.**
`cards/export.mjs` had to be the *union* of three exporters because each site had drifted into
holding a capability the other two had lost — per-card `deviceScaleFactor` only on guestgraph,
reduced-motion settling only on companygraph — and every one of those losses rendered a card
that looked plausible. Here the intersection and the union are the same file. Nothing has to
be reconciled, and nothing can be silently dropped by consolidating onto the wrong copy.

What actually differs is three things: how many decks are walked, where the output is written,
and one CSS comment.

## Why the package, and not left alone

The three copies have not drifted yet. The card exporters had not drifted either, until they
had, and the loss was invisible in all three repositories at once because nothing compares a
site against its siblings. `export-pdf.mjs` has weaker protection than the cards did, not
stronger — see *The proof* below — so three unreviewed copies is the worse position, and the
argument for consolidating is stronger here than it was there, not weaker.

It is still the smallest saving in the cluster. The duplication sweep attributes 49 lines to
these files today (41 across two repositories, 8 across three); the real figure is larger,
because blust.ch's extra indentation hides its copy from a line-run matcher. Roughly 150 lines
across three files become one harness of about the same size plus three deck lists.

## The interface

`@robertblust/design` has no dependencies and will not gain any. `cards/export.mjs` states the
rule it follows: *"Playwright is never imported. The package has no dependencies at all… the
site owns the browser and passes a `chromium` in."* The deck harness follows it with two
injections rather than one, because assembling a PDF needs `pdf-lib` as well.

New export `./decks/export`:

```js
exportDecks({ root, decks }, { chromium, PDFDocument })
```

- `root` — the site's repository root, passed in. The package never derives a root from its own
  `import.meta.url`; that resolves inside `node_modules` once the code ships as a dependency,
  which is the same trap `og-recipe.mjs` documents.
- `decks` — `[{ dir, slug }]`. `dir` is the deck's folder relative to `root`; `slug` names the
  output, because it is not always the folder name: guestgraph's deck lives in `talks/intro/`
  and its PDFs are `guestgraph-de.pdf` and `guestgraph-en.pdf`.

Each site's `export-pdf.mjs` becomes the deck list, the two imports and the call. blust.ch's
list has two entries; the other two have one. The multi-deck loop already runs in production on
blust.ch, so companygraph and guestgraph become the one-entry case of code that is already
exercised, rather than new code.

The deck list stays in `export-pdf.mjs` rather than moving to a `deck-recipe.mjs` beside
`og-recipe.mjs`. The cards split the knobs out for a specific reason — a knob left in the
exporter could be edited without moving the recipe hash, which is the one failure `og:check`
exists to prevent. There is no hash here, so a second file would be ceremony with no guard
behind it.

## Where the file lives

`export-pdf.mjs` normalises to the repository root on all three sites, next to
`export-og.mjs`, which is already at the root on all three. companygraph.io and guestgraph.io
`git mv talks/intro/export-pdf.mjs export-pdf.mjs` and update one `package.json` script;
blust.ch is already there.

Two reasons. A file that holds a *list* of decks does not belong inside one of them. And the
duplication sweep groups by path — two paths for the same file is how these three came to be
reported as separate rows, which is a small part of why the drift argument above went unmade
for as long as it did.

## The injected stylesheet

blust.ch's hide rule carries a CSS comment the other two lack:

```
/* a still image should not be waiting out a transition it does not want */
```

The harness takes blust.ch's text, comment included. It explains a real decision, a CSS comment
renders nothing, and the alternative is three sites agreeing on a string by deleting the only
sentence that says why it exists.

## Considered and rejected

**A `design pdf` bin command**, with the deck list as data in `design.config.json` and no site
script at all. It is the tidiest shape on paper and it breaks the rule the package rests on: a
bin cannot be handed a browser, so the package would have to resolve `playwright` and `pdf-lib`
itself. `@robertblust/design` has no dependencies, and `og:check` runs in CI before `npm ci`
precisely because of that. Reaching for `createRequire` against the site's `node_modules` is
the kind of cleverness this family has decided against.

**The package renders PNGs and the site assembles the PDF.** A cleaner boundary in the
abstract. But the pdf-lib assembly loop is the most identical part of all three files, so this
splits off the interesting half and leaves the boring half duplicated three times — about a
third of the saving, for a boundary nobody needs.

## The proof

**There is no `pdf:check`, and this pass does not add one.** Eight PDFs are committed across
the three sites, `npm run pdf` writes them by hand, and no workflow mentions pdf — by design,
since the script writes files the repository commits. The card harness could assert *no card's
bytes change* and have `og.sha` prove it on every push; that is not available here.

So the proof is done once, by measurement, inside the pass: on each site, render all its PDFs
before the change, hash every page, render again after, and compare. Both sets of hashes go in
the pull request. Identical constants across the three copies is a reason to *expect* identical
output, not evidence of it — the whole point of this repository's checks is that a thing which
looks right and is not is the failure that ships.

**Comparing the PDF files themselves is the wrong test**, and stating the right one here saves
the pass from improvising it. A re-render writes a new `/CreationDate` and a new document `/ID`,
so two byte-identical renders produce two different files; `git status` will report all eight as
modified whatever happens, and that report means nothing either way.

Rasterise instead. `pymupdf` is installed on this machine and neither poppler nor qpdf is, so
the proof uses it — as a local measuring tool, never added to any repository's dependencies:

```python
import pymupdf, hashlib
doc = pymupdf.open(path)
print(path, doc.page_count,
      [hashlib.sha256(p.get_pixmap(dpi=72).samples).hexdigest()[:16] for p in doc])
```

Page count and per-page pixel hash, before and after, for all eight files.

The honest cost: that guarantee holds for this change and does not persist. A later edit to the
shared harness has nothing under it but review. That is the trade being made, stated so it is
not discovered later.

## Success criteria

1. **No PDF changes on any site.** Eight files: page count and per-page pixel hash identical
   before and after, by the method in *The proof*, recorded in each pull request. Not `git
   status` and not a byte comparison — a re-render always writes a new `/CreationDate` and
   `/ID`, so both of those report a difference that is not one.
2. `@robertblust/design` still has **zero dependencies**, and `chromium` and `PDFDocument` are
   injected by each site.
3. `export-pdf.mjs` sits at the repository root on all three sites, and `npm run pdf` reads
   identically in all three `package.json` files.
4. The duplication sweep reports **no `export-pdf.mjs` rows**, from 49 attributed lines.
5. The package's harness is exercised by both shapes before release: a one-deck site and a
   two-deck site, run locally.
6. No CI workflow changes anywhere, because none of them runs `npm run pdf`.
