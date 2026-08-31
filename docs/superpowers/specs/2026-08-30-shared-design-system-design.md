# The shared design system — one source, three sites

*2026-08-30. Applies to `blust.ch`, `companygraph.io` and `guestgraph.io`. Proposes a
fourth repository, `robertblust/design`, published to npm as `@robertblust/design`.*

## The problem, measured

Not "we have some duplication". Every number below was taken from the three working
trees on 2026-08-30, by hashing the actual bytes.

**The fenced blocks.** Three contracts are copied inline into HTML, and a fourth is
copied as a file:

| Fence | Copies | State |
| --- | --- | --- |
| `design tokens · v3` | 20 pages | byte-identical, in exactly two variants |
| `header contract · v1` | 16 pages | byte-identical, all sixteen |
| `deck footer · v1` | 4 decks | **no end fence; and it is two things in one fence** — see below |
| `stage contract · v1` | 3 files | `stage.css` byte-identical in the two repos that have it |
| the language + storage block | **20 pages** | **no fence, no version marker, no check** |
| the `<head>` — meta + JSON-LD | **20 pages** | **no fence; six shapes where three belong** |
| the deck runtime, markup and layout CSS | **4 decks** | **no fence; ~625 shared lines each** |
| the prose typography kit | **16 pages** | **no fence; 54 lines common to all three sites** |

**The `deck footer` fence is misnamed, and that is why it decayed.** Its own
`FOOTER_VERSION` comment states a contract — *"the lockup goes to the landing page, the person to
blust.ch, the third link to the talks index, and none of them opens in a new tab"* — and then the
fence goes on to contain the **entire transport bar**: `.transport`, `.lcd`, `.tbtn`,
`.tmain`/`.tside`, play, pause, fullscreen, notes, the LCD track counter. Thirty-odd selectors of
playback component the comment never mentions.

Split at `.transport{`, the two halves behave completely differently:

| half | lines per deck | distinct forms |
| --- | --- | --- |
| the lockup — what the contract actually describes | 9 / 9 / 31 / 31 | **two**, each internally byte-identical |
| the transport bar — a component | 162 / 150 / 154 / 160 | **four**, all different |

**The contract half has not drifted at all.** companygraph.io and guestgraph.io share one 9-line
form; blust.ch's two decks share a 31-line one. That is not decay, it is an undocumented
structural difference — blust.ch *is* the person's site, so "the person goes to blust.ch" means
something different there. The drift is entirely in the transport bar, which is what happens to a
grab-bag with no stated contract: nothing holds it still.

So the fix is not to reconcile four copies. It is to draw the line the header contract already
draws — the fence holds what must be identical everywhere, each site's own bits sit outside it
deliberately, and the checks assert the *outcome* rather than the declaration. Concretely:

- **The transport belongs with the deck runtime, not the footer.** Its CSS, its markup and its
  JavaScript are one component that a fence happened to cut in half. It moves as part of the deck.
- **The lockup is what the footer contract is** — and the checks that guard it (`wayOut`,
  `landing`, `sameTab`, `noNewTab`) already exist and already pass. It needs a real end fence and
  a parameter for its two legitimate forms, the way the language block needs `langKey`.

Where the line falls exactly is not knowable until the deck has been pulled apart, so it is
decided there rather than guessed here.

The two token variants are not a drift. A prose page closes its `:root`; a deck's `:root`
continues with tokens of its own, so the deck carries the same block minus its final `}`.
The shared part is a byte-exact prefix. `check.mjs` already knows this — "the slice stops
at the last shared declaration" — which means the codegen this spec proposes has the same
boundary the existing check already trusts.

**The fifth contract, which has no fence at all.** Every one of the twenty pages carries a
37-line block that does the same four things: remember a language in `localStorage`, read
`?lang=` out of the address bar and clean it away with `replaceState`, decorate outbound
links to sibling domains with the current language at click time, and swap `data-de`
content in. Hashed with the origin key normalised, it is **byte-identical across all
sixteen prose pages** and **byte-identical across all four decks** — two dialects of one
contract, the same code with different identifier names (`KEY`/`stored`/`remember` on a
page, `LANG_KEY`/`langStored`/`langRemember` on a deck, which needs unprefixed names free
for its transport code). Both register `mousedown` and `click`; they are functionally the
same.

Three things follow, and none of them is currently visible to anything:

- **It is the only cross-site contract with no fence and no version.** The tokens, the
  header, the deck footer and the stage all carry `· vN` and a "keep in step" line. This one
  carries nothing, and it is the block that spans the most pages.
- **`FAMILY` — the regex naming the three domains — is hardcoded in 23 places**: all twenty
  pages plus all three copies of `carriesLang` in the verify suites. A fourth domain is a
  23-file edit, and a partial edit produces a site that silently drops the language on the
  way out.
- **It has already started to drift cosmetically.** `guestgraph.io/talks/` declares
  `var KEY = 'gg-lang'` in single quotes where the other fifteen prose pages use double.
  Harmless in itself, and the exact signature of a block that is copied by hand.

**The sweep.** The five contracts above were found by looking. To find what looking misses,
every file in the three repositories was shingled — every run of eight or more significant
lines, with domains, brand names and storage keys folded — and clustered by which repos it
appears in. That turns up five more shared things, and the largest of them is larger than
anything above.

**Sixth: the `<head>` — meta tags and JSON-LD.** 55 to 82 lines on each of the twenty pages.
Fold every string value away and compare only the *shape*, and it should fall into three
templates: interior page, landing page, deck. It falls into **six**. `companygraph.io` and
`guestgraph.io` agree exactly on all three (61 / 67 / 67 lines). `blust.ch` differs on every
one (76 / 55 / 82) — and its landing page, the most SEO-sensitive document it owns, emits
**fewer** lines of structured data than either sibling's. There is a `seo` check and a spec
for it (`2026-08-25-seo-design.md`, written "to be copied to" the other two), and neither
compares one site's shape to another's.

**Seventh, and the biggest single item in the estate: the deck runtime.** Each deck carries
an inline script of 403–418 lines — transport, narration, notes sheet, keyboard, fullscreen,
progress, the language UI dictionary — of which **about 310 lines are shared across all four
decks in all three repositories**. It also carries an inline stylesheet of 413–459 lines, of
which the `deck footer` fence accounts for roughly 160 and **another ~160 shared lines sit in
no fence at all** (`.deck`, `.col`, `.blist`, `.cell`, `.bar`). And ~135 lines of transport
markup, also shared, also unfenced. In total **615 to 807 significant lines per deck are
shared with a sibling** — 60% to 72% of the file. The spec's `deck footer` fence covers about
a fifth of that.

**Eighth: the prose typography kit.** After the `end header contract` fence and before
`</style>`, each prose page has 57–150 lines of its own CSS — and **54 of those lines are
common to the privacy page in all three repositories**: `.card`, `.cols`, `.lede`, `.note`,
`.rules`, `h1`, `.tagline`. A shared kit, unfenced, sitting immediately after the fence that
would have covered it.

**Ninth: `talks/intro/export-pdf.mjs`** — **100% of its significant lines identical** between
`companygraph.io` and `guestgraph.io`. `blust.ch` keeps a third, divergent copy at the
repository root.

**Tenth: `verify/og-recipe.test.mjs`** — 64% to 92% shared. The copied-files table below
under-reports it, because three different MD5s hid the fact that most of the file agrees.

**And a coverage gap in the checks.** `storageKeys` compares every key a page writes against
what `/privacy/` declares. **No deck sets `storageKeys: true` in `PAGES`** — in any of the
three repositories. So the four pages that write `rb-lang`, `cg-lang` and `gg-lang` from
their own dialect are the four never checked for writing a key the privacy page does not
name.

**The copied files.**

| File | Copies | Per copy | State |
| --- | --- | --- | --- |
| `verify/design.mjs` | 3 | 16,888 B | byte-identical |
| `verify/instance.test.mjs` | 2 | 15,539 B | byte-identical |
| `fonts/*.woff2` (4 files) | 3 | 91,312 B | byte-identical |
| `d3.v7.min.js` | 2 | 279,706 B | byte-identical |
| `stage.css` | 2 | 15,300 B | byte-identical |
| `stage.js` | 2 | 45,568 B | **10 lines differ out of 753 — a live bug fix that never travelled** |
| `og-check.mjs` | 3 | 1,319 B | two identical, one behind |
| `export-og.mjs` | 3 | ~3,000 B | same shape, three wordings |
| `verify/og-recipe.test.mjs` | 3 | ~11,500 B | 64–92% shared |
| `talks/intro/export-pdf.mjs` | 3 | ~2,550 B | cg and gg identical; blust.ch divergent |
| `.github/workflows/ci.yml` | 3 | — | same skeleton, different extra steps |
| `.github/dependabot.yml` | 3 | — | same file, three comments |

**The verify suites.** `check.mjs` is 1,114 / 676 / 1,022 lines. Hashing each check body
separately: **thirteen of the shared checks are byte-identical in all three repositories** —
`lang`, `sourceLang`, `contains`, `links`, `headerBaseline`, `carriesLang`, `mobileNav`,
`storageKeys`, `navOrder`, `noNewTab`, `sameOrigin`, `landing` and `wayOut` — and `divider`
is identical in the two repositories that draw one. Fourteen check bodies, then, that want
one source between them. Three more (`title`, `sameTab`, `seo`) are identical in two of the
three, which is drift caught mid-flight.

**And the drift is not hypothetical.** It is a fix that landed once and never travelled:

- `internalLinks` on `companygraph.io` inspects `[href]`, `[src]` **and** `url()` in every
  readable stylesheet. On `blust.ch` it inspects `a[href]` only. A root-absolute `<img src>`
  or a CSS `url(/…)` breaks `file://` on `blust.ch` today, silently, and the suite is green.
- `card` on `companygraph.io` rewrites the card URL onto `BASE` because the repo is served
  under a path prefix. On `blust.ch` it rewrites onto `location.origin`. The comment
  explaining why the origin is wrong exists only in the repo that hit the bug.
- `seo` on `guestgraph.io` is behind the version the other two share.

And the worst one, because it is the only drift a **visitor** can see. `stage.js` differs
between `blust.ch` and `companygraph.io` by exactly ten lines, and those ten lines are a
bug fix that never travelled:

- `blust.ch` has `markH()` — half a mark's *height*, which is not half its width, because a
  folder's box is drawn 4px taller than a page's square. `companygraph.io` still terminates
  every spine at a flat `R_NODE`. Both files draw the taller folder (line 439 in each), and
  only one of them accounts for it. So **on `companygraph.io/model/` and `/example/`, today,
  a connector runs two pixels inside every folder's box and six pixels inside the focused
  one.** It is live, and nothing says so.
- The `graph` check that catches it — 27 lines asserting "no end of a spine may sit strictly
  within any node's rectangle" — **also exists only on `blust.ch`.** Both halves of the fix,
  the repair and the tripwire, stayed in the repository where the bug was found.
- And the `stage contract` fence, in all three copies, states that "`stage.js` and
  `stage.css` […] are byte-identical copies too". `stage.css` is. `stage.js` is not. The
  page asserts the invariant in prose and nothing enforces it.

**The structural finding behind all of it.** `verify/design.mjs` says so itself, in its own
opening comment:

> Across repositories the check is deliberate rather than automatic. […] `npm run verify`
> will tell you which page in *this* repo is behind; nothing here can tell you that a
> sibling repository is. That part is a habit, and this comment is the reminder.

And `dependabot.yml` says it again, about itself:

> The shape is copied from `guestgraph/engine`, deliberately — the same duplication the
> design tokens and the deck footer have, and the same absence of a tripwire.

Both files are correct, and both are documenting a gap rather than closing it. Counting every
block the sweep found, **111 shared blocks and 35 copies of ten files** are currently kept in
step by one person remembering to — and **68 of those 111 sit in no fence, carry no version
and are checked by nothing.** The four contracts that *do* carry a version marker are the
minority. That is the thing this spec replaces.

## What cannot change

Three constraints are load-bearing, and every option below is judged against them first.

**1. A deck opens from `file://`.** A talk is one self-contained HTML file that has to
render from a USB stick in a room with no network. It cannot `<link>` a stylesheet, cannot
`import` a module, cannot fetch anything. This is why the tokens are inlined in the first
place, and it is not negotiable.

**2. The sites ship no external assets.** No CDN, no Google Fonts, no third party sees a
visitor. `d3` is vendored, the fonts are self-hosted, the brand mark is inlined rather than
linked. A shared package must not put a single new byte on the wire for a visitor.

**3. GitHub Pages serves the repository.** Whatever a visitor downloads has to be a file
committed at its public path — `/fonts/InstrumentSans-var.woff2`, `/stage.css`. There is no
build step between the repo and the CDN, and this spec does not introduce one.

Taken together: **the shared package can never be a runtime dependency of a published
page.** Any design that says "just import the stylesheet" is disqualified before it starts.

**One exception, and it matters for the ordering below: the stage is not subject to
constraint 1.** The decks draw static hand-authored SVG — none of the four contains
`markW`, `R_FOCUS` or `shape()`. `stage.js` and `stage.css` are loaded only by served prose
pages — `companygraph.io/model/`, `companygraph.io/example/` and `blust.ch/model/` — by
plain `<link>` and `<script src>`. And the page hands the stage its data through a single
`<script type="application/json" data-stage>` element, so the 753 lines are entirely generic
— the same code over a different payload. The stage is the *loosest*-constrained thing in
this inventory, not the tightest.

## The rule that decides everything else

> **If a visitor downloads it and every copy is the same, it is generated into the
> repository and committed.
> If only CI runs it, it is imported from the package.
> If a visitor downloads it but every copy legitimately differs, only its *shape* is
> shared — as an assertion, not as bytes.**

That single line resolves every item in the inventory, and it is not a new idea in these
repositories — it is the `--check` idiom already running in `principles:check`,
`example:check` and `og:check`, pointed at a new source.

**Generated and committed** (the visitor's half): the token block, the header contract,
the deck footer, the stage contract, `stage.css`, `stage.js`, `d3.v7.min.js`, the four
`woff2` files. These stay exactly where they are, byte for byte. What changes is that a
tool writes them and a check proves the written copy matches the package. A page's rendered
output is unchanged; `git diff` at adoption must be empty, and that empty diff is the proof
the extraction was faithful.

**Imported, never committed** (CI's half): `verify/design.mjs`, the fourteen site-agnostic
checks, the browser runner, `verify/instance.test.mjs`, the deck PDF exporter, and the
share-card harness and its test. None of this reaches a page, so none of it needs to live in
the site repository.

**Shared as a shape, not as bytes** (the third clause): the `<head>`. Every page's meta tags
and JSON-LD carry that page's own title, description, canonical and breadcrumb, so no two
copies can ever be byte-identical and generating them would mean moving every page's content
into the package. What *is* identical — what the current six-shapes-where-three-belong drift
actually is — is the set of nodes, the `@id` scheme and the required properties. So the
package exports the shape and `seo` asserts against it. Nothing is generated, and a site
whose landing page quietly loses twelve lines of structured data fails a check instead of
nobody noticing.

## Approaches considered

**A. npm registry package, `@robertblust/design`, as a `devDependency`.**
Each site pins an exact version. `npm run design` writes the generated half; `npm run
design:check` fails CI when the committed half is stale; `verify/check.mjs` imports the
CI half.

The deciding argument is not code reuse — it is the tripwire. All three repositories
already run Dependabot on the npm ecosystem, weekly, grouped. Publishing a new version of
the package makes Dependabot open a pull request in all three sites, and `design:check`
makes that pull request **red** until someone regenerates. The habit that `design.mjs`
apologises for becomes a machine check, with no new automation, no new secret, and no
change to `dependabot.yml`. Nothing else on this list gets that for free.

Cost: an npm scope, and a publish workflow. npm's trusted publishing (OIDC from GitHub
Actions) means no long-lived token anywhere — which matters here, because the publishing
repository is owned by a personal account rather than an organisation.

**B. Git dependency — `"@robertblust/design": "github:robertblust/design#v3.1.0"`.**
*(recommended — see the reversal below)* No registry, no publish step, no npm account at all.
`npm ci` records the resolved commit SHA in the lockfile, so installs stay reproducible, and
it works across the three separate GitHub owners because the repository is public — no token,
no login.

**This was initially rejected on a claim that turned out to be false**, and the correction is
recorded here rather than quietly edited away, because the false claim is a plausible thing to
believe again. The rejection said Dependabot's support for git-hosted npm dependencies is
"materially weaker" than for registry packages. That was asserted from memory and never
checked. It is wrong. `dependabot-core`'s npm updater
(`npm_and_yarn/lib/dependabot/npm_and_yarn/update_checker.rb`) carries exactly the logic the
tripwire needs:

```ruby
return dependency_source_details unless git_dependency?

# Update the git tag if updating a pinned version
if git_commit_checker.pinned_ref_looks_like_version? &&
   !git_commit_checker.local_tag_for_latest_version(update_cooldown).nil?
  new_tag = git_commit_checker.local_tag_for_latest_version(update_cooldown)
  return dependency_source_details&.merge(ref: new_tag&.tag)
```

A git dependency pinned to a version-looking ref (`#v0.1.0`) is resolved against the newest
version-looking tag in the repository and the ref is rewritten — which is precisely what makes
a design release open a pull request in three sites. There is a dedicated
`latest_version_for_git_dependency` path in the same file, git-dependency coverage across the
whole npm pipeline (`file_parser_spec`, `version_resolver_spec`, `file_updater_spec`,
`npm_lockfile_updater_spec`), and no open issue reporting it broken.

With the tripwire equally certain either way, the comparison is only what each costs, and B
costs less by a wide margin: no npm account, no 2FA, no bootstrap version, no OIDC
configuration, no `publish.yml`, and no deprecated placeholder release sitting on a public
registry forever. A release becomes a git tag and nothing else.

What B gives up is provenance attestations and discoverability by strangers. Neither has value
for three personal sites sharing their own design tokens. And it forecloses nothing: moving to
the registry later means creating the account then, publishing, and changing one line in three
`package.json` files.

**C. Git submodule.** Rejected on constraint 3. GitHub Pages serves the repository tree,
so `stage.css` has to be at `/stage.css` and the fonts at `/fonts/`. A submodule puts them
under a subdirectory, which means a copy step anyway — so it is option A's copy step with
submodule ergonomics bolted on, and none of A's tripwire.

**D. Vendored copies plus a `sync.mjs` that fetches raw files from a pinned tag.**
Genuinely close to A, and closest to the existing idiom. Rejected for two reasons: it
cannot share *code* as an import (the verify suite would be copied-and-checked rather than
imported, so `check.mjs` stays 1,000 lines in three places), and it has no dependency graph,
so nothing tells a site that a new tag exists.

## The package

Repository `robertblust/design`, published as `@robertblust/design`. The name is cheap to
change before the first publish and impossible after; confirm the scope is free as step
zero.

```
robertblust/design/
├── package.json              exports: ".", "./verify", "./verify/design", "./assets/*"
├── blocks/
│   ├── tokens.css            the :root block — the canonical bytes, fence to fence
│   ├── header.css            the header contract
│   ├── deck-footer.css       the deck footer contract
│   ├── lang.js               the language + storage block, one dialect, one parameter
│   ├── prose.css             the typography kit — .card .cols .lede .note .rules h1
│   ├── deck.css              deck layout and the footer, one fence
│   ├── deck.html             the transport markup
│   ├── deck.js               the deck runtime
│   └── stage.css             the stage — a file, not a fence
├── assets/
│   ├── fonts/                InstrumentSans-var, Bricolage-var, PlexMono-400, PlexMono-600
│   ├── stage.js
│   └── d3.v7.min.js
├── verify/
│   ├── design.mjs            TOKENS, SKY, SYSTEM_FACES, DESIGN_CHECKS — moved verbatim
│   ├── checks.mjs            the fourteen site-agnostic CHECKS
│   ├── runner.mjs            browser boot, the page loop, reporting
│   ├── og.mjs                the card harness; the per-site recipe is injected
│   ├── og-recipe.test.mjs    64–92% shared today; the shared part moves
│   ├── head.mjs              the JSON-LD shape `seo` asserts against — not bytes
│   ├── export-pdf.mjs        identical in cg and gg; blust.ch reconciles to it
│   └── instance.test.mjs     moved verbatim from the two repos that share it
├── bin/design.mjs            `design sync` and `design sync --check`
├── family.mjs                the three domains, in one place — imported by the checks
└── versions.json             per-block content versions: {tokens:"v3", header:"v1", …}
```

Each site adds a two-line `design.config.json` naming what only it can know:

```json
{ "langKey": "rb-lang", "site": "https://blust.ch" }
```

`langKey` is declared, never derived. It is not computable from the domain — `blust.ch`
stores under `rb-lang` — and, more to the point, **changing it silently resets every
visitor's saved language.** It is a constant with a migration cost, so it belongs where
changing it is a visible act.

### Two version numbers, on purpose

The package has an npm semver, and each block has its own content version. They are not
the same number and conflating them would be expensive.

`og-recipe.mjs` hashes the whole page file plus the fonts to decide whether a share card is
stale, and it "over-reports and never under-reports" by design. If the fence carried the
npm version, then a package release that only fixed a check would rewrite twenty HTML files
across three repositories and mark every share card stale — twenty PNGs to re-render for a
change no visitor could see.

So the fence carries the **block's** version, from `versions.json`, and that number moves
only when the block's bytes move. A package release that touches only `verify/` writes
nothing into any HTML file and invalidates no card. The npm version is for the toolchain;
the block version is for the page.

### The fence contract

The sync tool finds fences, not files. It walks every `*.html` outside `node_modules`,
locates each opening fence and its matching end, and replaces the body between them. A page
that grows a fence is picked up with no registration, and a page with no fence is not
touched.

Three changes to the fences as they stand:

1. **The deck footer gets an end fence.** It has none today, which is why its four copies
   cannot be compared and have drifted. This is the first fix, and it is worth doing whether
   or not the rest of this spec is adopted.
2. **The token fence declares its variant.** `design tokens · v3 · deck` emits the block
   without its closing `}`; `· page` emits it closed. Explicit, because inferring the
   variant from whether the existing text ends in a brace is the kind of cleverness that
   fails silently once.
3. **The fence prose changes.** "keep in step across every repository that shares them"
   describes a habit that will no longer exist. It becomes "generated from
   `@robertblust/design` — edit it there and run `npm run design`", which tells the next
   reader what to actually do.

### One fence takes a parameter

The tokens, the header and the deck footer are constant bytes. The language block is not
quite: it needs the site's `langKey`. That is the **only** substitution the rewriter
performs, and holding it to one is worth some effort up front.

Today there are two dialects, which would otherwise mean two templates. Phase 3 unifies them
first — the deck's `LANG_KEY`/`langStored`/`langRemember` naming becomes the shared one,
because it is the constrained case (a deck needs the short names free for its transport
code) and renaming *toward* a constraint cannot break the unconstrained side. After that it
is one template and one substitution, and the emitted block is byte-identical on all twenty
pages but for the key.

`FAMILY` is **not** a parameter. It is the same three domains everywhere, so it is a
constant in `family.mjs` — substituted into the block, imported by `carriesLang`. Adding a
fourth site becomes one edit in one file instead of twenty-three.

### Coverage — the hole in fence discovery

Rewriting whatever fences exist cannot notice a page that has *no* fence and should have
one. That hole is already covered: `tokenVersion` in `design.mjs` asserts that every page
in the suite's `PAGES` list carries the marker, and `PAGES` is the site's own declaration of
what it ships. Keep that check; retarget it from "the marker says v3" to "the fence content
equals the package's". Discovery drives writing, `PAGES` drives coverage.

## What moves, in four tiers

The tiers are ordered by **the tool each one needs**, not by how much of the inventory it
covers. That puts the stage first, which is not where an inventory-sized ordering would put
it: the stage is only three pages in two repositories, but it needs the simplest tool in the
whole plan and it is the only tier that fixes something a visitor can currently see.

Each tier is independently shippable. Stopping after tier 1 still repairs a live bug.

**Tier 1 — whole files.** `stage.js`, `stage.css`, `d3.v7.min.js`, and the four `woff2`
files. The tool is a copy and a SHA-256 comparison — no parser, no fences, nothing to get
subtly wrong. Delivered with it: the `graph` and `divider` checks that guard the stage, so
that the repair and its tripwire travel together this time instead of separately.

This tier lands the `markH` fix on `companygraph.io` and the spine assertion on both, which
means it is the one tier expected to produce a **non-empty** diff — a rendering change,
reviewed as one, on the two pages that draw a stage. Everything after this point must
produce an empty diff.

**Tier 2 — fenced blocks on prose pages.** `tokens.css` (20 pages, two variants),
`header.css` (16), the `stage contract` fence (3), **the language and storage block (20)**,
**the prose typography kit (16)**, and the fence prose that currently makes claims nothing
enforces. This is the tier that needs the fence rewriter, which is why it is second and not
first.

The language block spans as many pages as the tokens do and is the only item that arrives
with no fence to reuse, so it lands last within the tier and in two steps: unify the two
dialects, then fence and generate. Its diff is the one place in this tier where an
*identifier rename* is expected on sixteen pages; the emitted bytes after that must be
stable. Everything else in tier 2 must diff empty on the first `npm run design`, and that
empty diff is the proof.

**Tier 2b — the deck.** Its own tier, because it is the largest extraction in the plan and
the one with the least standing behind it. Per deck: ~310 shared lines of runtime script,
~160 shared lines of layout CSS in no fence at all, ~135 lines of transport markup, and the
`deck footer` fence that already exists — which, as measured above, is really the transport bar
plus a nine-or-thirty-one-line lockup wearing one name. Four decks, 615–807 shared significant
lines each — 60% to 72% of the file.

This tier is where the footer fence gets cut in two: the transport moves with the runtime and the
markup it belongs to, and the lockup is fenced on its own as the contract `FOOTER_VERSION` always
claimed it was, with a parameter for its two forms.

What stays per-talk: the slides, the narration cues, the talk's own UI strings, the slide
count. The boundary is the one the stage already demonstrates — generic behaviour over a
per-instance payload — and finding it precisely is most of the work here.

It lands last among the generated tiers and behind the strongest gate: a deck must still open
from `file://` with no network, and it is the artefact the suites watch least. **Before
extracting anything, the decks get the checks the prose pages already have** — `storageKeys`,
and a smoke test that renders each deck from a `file://` URL. Checks first, extraction second;
this is the tier where that ordering is not optional.

**Tier 3 — imported code.** `verify/design.mjs` moves verbatim (already byte-identical, so
a delete-and-import rather than a rewrite). The fourteen agreed check bodies move as-is.
`verify/instance.test.mjs` moves verbatim, as does `export-pdf.mjs` — already identical in
two repositories, with `blust.ch`'s third copy reconciled to it. The shared 64–92% of
`og-recipe.test.mjs` moves. And `head.mjs` arrives here: the JSON-LD *shape*, which `seo`
asserts against, so that six shapes become three. Each site's `check.mjs` keeps its `PAGES`,
its `SITE`, and the checks that are genuinely its own — `slides`, `transport`, `zeroBased`,
`footer`, `brandMark`, `translates`, `fits` — and imports the rest.

Two coverage fixes ride along, both worth doing on their own merits. **`storageKeys: true`
is added to all four decks in `PAGES`**, which is where it should always have been — they
write a language key and are the only pages never checked against `/privacy/`. And
`carriesLang` stops hardcoding the three domains and imports `family.mjs`.

The five drifted checks — `title`, `sameTab`, `internalLinks`, `seo`, `card` — are
reconciled deliberately, one pull request per site, taking the stronger version in each
case: `companygraph`'s `internalLinks` (it sees `[src]` and CSS `url()`), `companygraph`'s
`card` (which gains a `cardBase` entry in `PAGES`, so a path-prefixed site and a root site
share one body), and the `seo` and `title` versions the two leading repos already share.
Expect these to fail on adoption. That is the point — they are finding the bugs listed at
the top of this document.

**Tier 4 — the card harness.** `og-check.mjs` and `export-og.mjs` as an imported harness
with each site's `og-recipe.mjs` injected, plus `export-pdf.mjs` and the shared 64–92% of
`og-recipe.test.mjs`. The recipe itself stays local: the three sites genuinely render
different cards, and 95 of its 148 lines differ for real reasons. Smallest saving of the four,
and it lands last — but it lands.

`guestgraph.io` has no stage at all today — no `d3`, no `stage.js`, no graph markup — so it
takes the fonts from tier 1 and nothing else. It takes the rest the day it grows one, which
is the point of the stage having a source by then.

## The checks

Two commands per site, both following the idiom already in use:

- `npm run design` — regenerate everything in the visitor's half.
- `npm run design:check` — regenerate to a buffer, compare, exit non-zero on any difference,
  and print the offending file and fence. Never writes.

In `ci.yml`, `design:check` runs **after** `npm ci` (it needs the package) and **before**
`npm run verify` (a stale block should fail on the cheap step, not on a rendered page).

Two failure messages matter more than the rest, because they are what a person reads at the
moment they are confused:

- Stale block: *"`talks/index.html` carries `design tokens v2`; `@robertblust/design@3.1.0`
  ships `v3`. Run `npm run design`, then `npm run og`, and commit."*
- Local edit: *"`index.html`'s `header contract` fence differs from the package. This block
  is generated — edit it in `robertblust/design` and publish, or take the block out of the
  package if this site genuinely needs to differ."*

The second message names the escape hatch, and the escape hatch is deliberately loud: there
is **no per-site override**. A site that must differ takes the block out of the package
entirely and owns it. A quiet local override would recreate the drift this whole exercise
exists to end.

## Distribution, and the tripwire

`robertblust/design` is a public GitHub repository and nothing else. **There is no registry,
no npm account and no publish step: a release is a git tag and a GitHub Release with notes.**
The three sites consume it as a git dependency.

- **A tag and a GitHub Release with notes.** The one piece of ceremony that is not ceremony:
  Dependabot renders release notes into the pull request body, and that pull request is the
  *only* thing telling a person in another repository what changed. A release with no notes
  makes the tripwire fire without saying why.
- **A `files` allowlist**, so what a site installs is `lib/`, `bin/`, `verify/` and `assets/`
  and not the package's own test suite. npm honours it when packing from a git install, and
  keeping it costs nothing if the registry is ever revisited.
- **`engines: { "node": ">=22" }`**, matching the `node-version: "22"` all three CI files
  already pin.
- **A `NOTICE` file.** The repository redistributes ~380 KB of third-party bytes — D3 under
  ISC, three font families under SIL OFL 1.1 — and both licences require their notices to
  travel with a redistribution. That obligation comes from shipping the bytes, not from the
  registry, so it applies here too.

**Each site pins an exact tag** — `"@robertblust/design": "github:robertblust/design#v3.1.0"`,
never a `#semver:^3.1.0` range. This is the house convention already: `companygraph.io` pins
`"d3": "7.9.0"` exactly while its tooling devDependencies use carets, because d3's bytes are
committed and served. This package is the same kind of thing — its content ends up committed in
the repository — so it gets the same treatment, and the version in `package.json` stays a
visible, reviewable line rather than a range that can move underneath a lockfile refresh.
`npm ci` records the resolved commit SHA in the lockfile, so installs stay reproducible, and
the repository being public means no site needs a token, a login or an npm account to install
it.

**Semver policy**, stated once so the release notes can be trusted: a change to any generated
block is at least a **minor**, because it makes every consuming site's committed copy stale. A
change that needs a site edit beyond `npm run design` — a renamed fence, a new entry in
`design.config.json`, a dropped block — is a **major**, and so is dropping a file from a group,
because the sync tool never deletes an orphan a site already has. Anything invisible to the
sites is a patch.

Dependabot already runs weekly on the npm ecosystem in all three repositories, so no
configuration changes — except one addition worth making: give the design package its own
Dependabot group, so a design change never arrives in the same pull request as a Playwright
bump.

The loop, end to end, with no habit in it:

1. Change `--c-mid` in `robertblust/design`, bump `versions.json` to `tokens: "v4"`, tag
   `v3.2.0` and write the release notes. That is the whole release.
2. Dependabot opens a pull request in `blust.ch`, `companygraph.io` and `guestgraph.io`.
3. All three fail on `design:check`: the committed blocks still say `v3`.
4. `npm run design && npm run og` in each, commit, green.

Today step 2 does not happen at all, and steps 3 and 4 depend on remembering that two other
repositories exist.

Immediate propagation via `repository_dispatch` from the release workflow was considered and
is not proposed: it needs a personal access token with write access to three separate
owners, which is real secret-management cost for the difference between "within a week" and
"within a minute" on a personal site. Add it later if the weekly cadence ever actually hurts.

## Migration

Eight phases. Each ends in a state you could stop at.

**0 — Pre-flight.** Create `robertblust/design`, public, Apache 2.0. Nothing here is
irreversible any more — there is no scope to claim and no first publish to get right. The four deck footers still lack an end fence,
but adding one is **no longer phase 0 work**: the fence turns out to bundle a contract with a
component, and where to cut it is decided when the deck is pulled apart, not before.

**1 — Seed the package with tier 1 only.** `stage.js`, `stage.css`, `d3`, the four fonts,
and the `graph` and `divider` checks — taking `blust.ch`'s `stage.js`, which is the repaired
one. The sync tool at this stage is a copy and a hash compare; there is no fence rewriter
yet and nothing needs one. Publish `0.1.0`.

**2 — `blust.ch` and `companygraph.io` adopt tier 1.** On `blust.ch` the diff is empty. On
`companygraph.io` it is not, and that is the phase's whole point: `stage.js` gains `markH`,
the `graph` check gains the spine assertion, and the two stage pages are reviewed as a
rendering change. `guestgraph.io` takes the fonts. Wire `design:check` into all three
`ci.yml` files, after `npm ci`.

**3 — Tier 2, the fences.** Write the fence rewriter. Its own CI runs it against fixtures
covering both token variants, the header, the deck footer, a page with no fence, a fence
with no end, a fence whose body was edited by hand, and a `langKey` substitution. Then
`blust.ch` adopts, then the other two. **Every diff in this phase must be empty**, with one
declared exception: unifying the two language dialects renames identifiers on the sixteen
prose pages, which is its own pull request, reviewed as a rename, before the language block
is fenced at all. At the end, sixty-three fenced blocks have one source.

**4 — Tier 3, the checks.** `design.mjs` and `instance.test.mjs` first (verbatim moves, so
the suites must behave identically). Then the fourteen agreed check bodies. Then the five
reconciliations, one pull request per site, expecting real failures.

**5 — Tier 2b, the deck.** Checks first: `storageKeys` on all four decks, and a `file://`
smoke render in CI. Then the runtime, the markup and the unfenced layout CSS, one deck at a
time, `blust.ch` first because it has two decks and so proves the per-talk boundary
immediately.

**6 — Tier 4.** The card harness, `export-pdf.mjs`, and the shared part of
`og-recipe.test.mjs`.

**7 — Retire the habit.** Delete the "keep in step across every repository" prose from every
fence and the paragraph in `design.mjs` that documents the gap, because the gap is closed.
Correct the `stage contract` fence, which claims `stage.js` is byte-identical — a claim that
is false today and becomes true in phase 2. Update the three `CLAUDE.md` files to say where
the design now lives, and the comment in `dependabot.yml` that names the missing tripwire.

## What stays duplicated, on purpose

Naming these now stops them being re-litigated later.

- **`og-recipe.mjs`** — the harness is shared, the recipe is not. Three sites, three card
  designs, 95 of 148 lines different for real reasons.
- **`ci.yml`** — the skeleton is the same, but `blust.ch` runs a TTS staleness check and
  `principles:check`, and `companygraph.io` runs `example:check`. A shared reusable workflow
  would be parameterised past the point of being readable, and a workflow file is read at
  exactly the moment someone is debugging a red build. **And it is now structural, not a
  preference:** the three sites live under three different GitHub owners — one user and two
  organisations — so there is no level at which a shared workflow or a shared
  `dependabot.yml` could be hosted. See decision 4.
- **`favicon.svg`, `logo.svg`, `avatar.svg`** — three brands. The header contract is shared;
  the mark inside it is not.
- **`CLAUDE.md`** — 487 / 543 / 570 lines with only 83 in common. It is site-specific prose,
  and it should stay that way.
- **The fonts and `d3` remain physically copied into each repository**, because GitHub Pages
  serves the repository. What ends is the *hand-maintained* copy: they become generated and
  checked. The metric this spec moves is "copies a person has to keep in step" — 111 shared
  blocks and 35 file copies, down to one source each — not "bytes on disk".
- **The language storage key** (`rb-lang`, `cg-lang`, `gg-lang`) stays per-site, in each
  site's `design.config.json`. Not because sharing it is hard, but because each origin has
  its own `localStorage` and renaming a key throws away every visitor's saved preference.
- **`guestgraph/engine`, `companygraph/meta-model`, `mental-model`, `rob-cv`, `field-notes`**
  — out of scope. They can consume the package later if it turns out they want to; nothing
  here is designed around them.

## Risks

**The package becomes a bottleneck.** A one-line colour tweak now costs a publish and three
pull requests. Mitigated by the tier split — only genuinely-shared bytes go in — and by the
no-override rule making "this site needs to differ" a visible decision rather than a quiet
edit. If a block turns out to want per-site variation more than twice, it should leave the
package.

**Share-card churn.** Handled by the two-version design above: only a block content change
rewrites HTML, and only rewritten HTML restamps a card.

**A faithless extraction.** Handled by the empty-diff gate, which applies to every phase
except 2. If `npm run design` produces any diff on first run, the extraction is wrong and the
phase does not land.

**Phase 2 is the one that changes what renders.** It is the only phase that ships a visual
change, and it ships it to `companygraph.io/model/` and `/example/`. Reviewed as a rendering
change, with the new spine assertion in the same pull request so the fix and its proof land
together. If the repaired geometry turns out to be unwanted, the decision belongs in the
package and reaches both sites — which is the state this whole spec is trying to reach.

**`file://` regressions.** The sync tool writes literal bytes into HTML; nothing at runtime
changes, and the existing suite already asserts `internalLinks` and renders every deck. The
stage is the safest tier here, not the riskiest: no deck loads it, and none should. Worth
stating in the package's README so nobody later "helpfully" links a deck to `stage.js`.

**Three red Dependabot pull requests is friction.** True, and it is the feature. It is also
one command to clear. If it ever becomes noise rather than signal, the answer is fewer
releases, not a quieter check.

**Bus factor moves to one repository.** It already is one design in one person's head; this
makes it one design in one repository, which is strictly better.

## Success criteria

Measurable, and checkable on the day each phase lands.

1. `npm run design` in each of the three sites produces an **empty** `git diff` at adoption.
2. `verify/design.mjs` exists **once**, not three times.
3. Changing `--c-mid` in the package and publishing turns CI **red in all three sites**
   within one Dependabot cycle, with nobody having been told to look.
4. **No check body exists in more than one repository.** Each site's `check.mjs` holds its
   `PAGES`, its `SITE`, and only the checks that are genuinely its own.
5. **No spine on `companygraph.io` ends inside a node's box**, and the check that says so
   runs in both repositories that draw a stage.
6. **The three domains are named in one file, not twenty-three.** Adding a fourth site is a
   one-line edit that reaches every page and every suite.
7. **Every deck sets `storageKeys: true`**, so no page can write a storage key that
   `/privacy/` does not name.
8. `internalLinks` on `blust.ch` and `guestgraph.io` inspects `[src]` and CSS `url()` —
   i.e. every drift named at the top of this document is closed, and cannot silently reopen.
9. **The `<head>` falls into three shapes, not six**, and `seo` fails when a fourth appears —
   including when a landing page quietly sheds structured data.
10. **Every deck renders from a `file://` URL in CI**, and every deck sets `storageKeys`.
11. Hand-maintained copies: **111 shared blocks and 35 file copies → one source each.** Zero
    of them require a person to remember that two sibling repositories exist.
12. **Re-running the shingle sweep finds nothing above eight lines that the package does not
    own.** That is the check on this spec's own completeness, and it should be run again at
    the end rather than trusted now.

13. **`robertblust/design` carries a branch ruleset on `main`, and it is switched on the day
    the last plan lands — not before.** Today the repository has none: `gh api
    repos/robertblust/design/rulesets` returns empty, while `robertblust.github.io` has
    `protect-main` active. That asymmetry was deliberate while the package was being built —
    plans 1, 2 and 3 commit tasks straight to `main`, because the package has no reviewers and
    its gate is `npm test`, and a required pull request would have meant one nobody reads per
    task. It stops being deliberate the moment three published sites pin its tags: from then on
    a bad `main` is a bad release, and a release is what the sites take.

    Two things it must require, and one trap.

    - A pull request, so a change to the one file three sites share cannot be pushed straight
      to `main`.
    - The status check, so the suite that guards it has to be green.

    **The context to name is `test`, not `CI`.** A ruleset requires the *job id*, and this
    repository's workflow is named `CI` with a single job `test` — the reverse of the sites,
    whose job is `verify`. Naming the workflow instead produces a check that never reports:
    the branch looks protected and silently is not. `robertblust.github.io`'s own conventions
    record this failure, which is why it is written here rather than discovered again.

    Do not attempt `commit_author_email_pattern`. It is a metadata restriction and is rejected
    on this account's plan — tested, not assumed. Authorship stays enforced by the `includeIf`
    blocks in `~/.gitconfig` and by merging with merge commits rather than squashes.

## Decisions taken

Settled on 2026-08-30. Recorded here so they are not re-opened by accident.

**1. Repository `robertblust/design`, package `@robertblust/design`, licensed Apache 2.0.**
Four conventions decide this, in order:

- *Scoped, never unscoped.* An unscoped name is a land-grab on a shared namespace and a
  squatting risk. A scope is free, namespaced and permanent.
- *The scope names the stable owner.* Three different GitHub owners consume this and only one
  party owns the design across all of them, so the scope is the person. That a package
  consumed by two organisations is named after an individual is normal on npm and, here,
  simply accurate.
- *One package, not three.* Splitting into `-tokens`, `-verify` and `-assets` would triple
  the Dependabot pull requests and reintroduce "which versions go together" — the exact class
  of problem this exists to end. **The single version number is the tripwire.** The whole
  package is a devDependency that never reaches a visitor, so there is nothing to save by
  splitting it.
- *Repository name matches package name*, so `repository`, `homepage` and `bugs` all resolve
  and npm links back to the source.

Apache 2.0 matches `companygraph/meta-model` and `guestgraph/engine`, which the sites already
link to from their footers.

The scoped form `@robertblust/design` is kept even though nothing is published to a registry:
it is the package's `name`, so it is the key the three sites write in `dependencies` and the
specifier they import from. Keeping the scope also means adopting the registry later is a
one-line change in three files rather than a rename. Nothing here is now irreversible — the
npm scope is not being claimed.

**2. Git dependency, not the npm registry.** *(Reversed on 2026-08-31.)* The original
decision was the registry, taken on the belief that Dependabot handled git dependencies badly.
That belief was never checked and is false — see Approaches B for the code that disproves it.
Once both paths carry the tripwire equally, the registry's cost is all that distinguishes them:
an npm account, 2FA, a bootstrap release to create the package (npm cannot configure trusted
publishing for a package that does not yet exist — `npm trust`'s own documentation says "The
package you're configuring must already exist on the npm registry"), and a publish pipeline to
maintain. All of that buys provenance and public discoverability, and neither is worth anything
here.

So: the three sites depend on `github:robertblust/design#vN.N.N`, pinned to an exact tag for
the same reason they pin `"d3": "7.9.0"` exactly — this package's bytes end up committed in the
consuming repository, so its version belongs in a visible, reviewable line rather than a range
that can move under a lockfile refresh. A release is a git tag and a GitHub Release with notes.
There is no publish step.

**3. Tier 4 is in scope.** It lands last, but it lands: `og-check.mjs`, `export-og.mjs`,
`export-pdf.mjs` and the shared 64–92% of `og-recipe.test.mjs`.

**4. `robertblust` is a GitHub user, not an organisation.** Three consequences, all small,
one of which settles an argument elsewhere in this document:

- A user account owns the repository fine. With distribution now a git dependency, nothing
  about publishing depends on it either.
- **No organisation owns all three sites**, so there is no level at which a shared
  `dependabot.yml` or a shared reusable workflow could live. The "stays duplicated on
  purpose" entry for `ci.yml` and `dependabot.yml` is therefore not a judgement call any
  more — it is structural, and re-litigating it would require moving repositories between
  owners.
- A user-owned repository has no organisation secrets and no teams. Nothing in this plan
  needs either; it would only matter if the package's own CI were ever made to run the three
  sites' suites, which would need a personal access token and is not proposed.
