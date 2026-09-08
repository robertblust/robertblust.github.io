# One model, one artifact — design

> The model is fetched once, parsed once and written to `model.json`. Every derived surface
> on this site — the data block, the principles page, and the JSON-LD nodes that describe the
> person, the dataset and the site — is a pure function of that file. One pull request here;
> no release anywhere else.

Status: proposed. Decided on 2026-09-08 against measurements of this repository at `main`
and of `robertblust/mental-model` at `66cd79d`, the commit `source.json` pins. Every number
below was counted, not estimated.

---

## 1. What is true today, measured

| Fact | Value |
|---|---|
| Scripts that build a page from the model | 3: `build/model.mjs` 112, `build/principles.mjs` 177, `build/sameas.mjs` 79 — 368 lines |
| Independent readers of the pinned commit | 2, on different GitHub endpoints: `git/trees` + `raw` in `model.mjs`, `contents` in `principles.mjs` |
| Markdown parsers | 2: `parseInstance` from `companygraph-meta-model` v0.14.0 and `parse()` at `build/principles.mjs:34`, 18 lines |
| Scripts that read a rendered page as their input | 1: `sameas.mjs` regex-extracts the data block out of `model/index.html` |
| Entities, edges, types in the parse | 123, 517, 9 — from 123 files under `model/` |
| The data block | 299,759 bytes, inlined byte-identically in `model/index.html` and `timeline/index.html` |
| Derived regions today, and the files holding them | 10 regions in 7 files |
| JSON-LD nodes across the 9 pages that carry a graph | 44, of 5 types |
| Nodes that do not vary from page to page | 27: `Person`, `Dataset` and `WebSite`, 9 each |
| Nodes that legitimately do vary | 17: `WebPage` 9 distinct, `BreadcrumbList` 8 distinct |
| Of those 44 nodes, what a script writes today | one property of one type: `sameAs`, on 7 of the 9 `Person` nodes |
| CI steps that check a page against the model | 3: `principles:check` and `sameas:check` before `npm ci`, `model:check` after it |

Four of those rows decide the work.

**The same commit is read twice, by two readers, against two different GitHub endpoints.**
Each carries its own `MENTAL_MODEL` checkout branch, its own `HEAD` comparison against
`source.json` and its own token handling. CI therefore reaches GitHub twice for one commit,
and a change to how the model is read is a change in two places that no check holds together.

**The vision and the values are parsed twice, and only one of the parsers answers to the
conventions.** `parseInstance` already yields the vision and all five values as entities
carrying `name`, `tagline` and `sections[].text`; it enforces the numbered rules, and
`companygraph/meta-model` fails its own CI if it cites a rule `core/CONVENTIONS.md` does not
define. The 18-line `parse()` in `principles.mjs` reads the same files, enforces none of
R2, R4, R7 or R11, and is versioned by nothing. It was confirmed on 2026-09-08 that the
entities reproduce the rendered page exactly: the vision's one `What it means` section
splits into the same three `<p class="lede">`, each of the five values into the same two
paragraphs, in the same order.

**A rendered page is used as a database.** `sameas.mjs` reads `model/index.html`, pulls the
`<script>` out with a regular expression and parses it. That is what makes the order of the
commands load-bearing, and the order lives only as prose in `AGENTS.md`: "both run after
`npm run model`". Nothing enforces it.

**Twenty-seven JSON-LD nodes are copies, and one property of them is written.** `Person`,
`Dataset` and `WebSite` are identical from page to page by their nature — they describe the
person, the model and the site, none of which changes because a reader is on a different
page. They are typed by hand nine times each. `WebPage` and `BreadcrumbList` differ on every
page and are not copies at all.

That distinction is not academic, because the copies have already drifted. Both talk decks
define the person at `https://blust.ch/#person` and neither is on the list `sameas.mjs`
writes: the seven driven pages carry three addresses, the two decks carry two, and the one
the decks lack is the Substack address the model gained on 2026-09-07. The site publishes two
descriptions of one `@id`, and the check passes, because it holds only the pages already on
the list.

The `Dataset` node has not drifted, and it is wrong in a second way. It carries no
`distribution` — the property that names a fetchable file — so an agent reading it is sent to
a repository page to scrape. Its `url` points at that repository rather than at the page that
draws the model. The repository is public, confirmed on 2026-09-08 against the API as
`visibility: public`; the comment in `principles.mjs` calling it private is stale and goes
with the file.

One disagreement found while measuring is recorded here and deliberately not fixed. All nine
pages publish `"jobTitle": "Software Engineer & Architect"`, while the model's profile calls
the person a technology executive and business architect. The `<title>` agrees with the
JSON-LD, so this is not the JSON-LD drifting from the page — it is the site and the model
disagreeing about what the person is. It reaches into titles and share cards, it is editorial
rather than mechanical, and a build change is the wrong place to settle it.

## 2. What was decided

**The parse is written to `model.json` at the repository root, and it is committed.** The
pairing is the point: `source.json` says which model, `model.json` is the model. Committing
it is not a new convention but the one `WORKING.md` already states — CI never writes what
the repository commits, so rendered cards, exported PDFs and generated pages are built
locally and committed, and CI checks that the committed copy matches what would be built.
The artifact joins that list.

It is written with a two-space indent, 375,437 bytes. The reason is review: a re-pin then
shows which experience gained a field and which tagline was reworded, which is most of what
committing an artifact buys. The pages still inline it minified, so the block's bytes do not
move.

**Fetching and rendering become two layers, and only the first one talks to the network.**
`npm run model` resolves the pin, reads the files, parses them and writes `model.json`; it
is the only thing that needs both GitHub and `npm ci`, because the parser is a dependency
and is not on disk until then. `npm run pages` renders `model.json` into every derived
region and needs neither. The split is not tidiness: it is what keeps the cheap half of CI
cheap, and it lets one command regenerate every surface, so re-pinning and forgetting one of
three scripts stops being possible.

**`pages` refuses to run when `model.json` names a commit other than the one `source.json`
pins.** This replaces the ordering rule that today exists only as a sentence in `AGENTS.md`.
An artifact that declares its own commit cannot be rendered stale, so the order of the two
commands is enforced by the data rather than remembered by the person.

The guard also gives the checks two honest tiers. `pages:check` asks whether the pages match
`model.json` and whether `model.json` is at the pinned commit, and it needs no network.
`model:check` asks whether `model.json` is the true parse of that commit, and it needs both
the network and the parser.

**The pinned parser becomes the only reading of the model.** `parse()` and `readModel()` are
deleted from `principles.mjs`, 44 lines, and with them the second GitHub endpoint. The vision
and the values reach the page through the same rules as every other entity.

**A JSON-LD node that does not vary from page to page is written from one definition; a node
that varies stays by hand.** That is the rule, and it decides where the next node someone
adds belongs without anyone having to remember a list. It puts `Person`, `Dataset` and
`WebSite` under the renderer and leaves `WebPage` and `BreadcrumbList` alone, which takes 27
of the 44 nodes off hand-maintenance and closes the duplication rather than reducing it.

The rule is also what fixes the deck drift, and it fixes it by construction: there is no page
list to be missing from, because every page carrying the graph is written the same way. So
`sameas.mjs` is not extended, it is deleted — writing whole nodes needs no `sameAs` array
regex, and the property comes along with the node that holds it.

The three nodes are the leading three entries of `@graph` on all nine pages, contiguous and
in the same order, confirmed on 2026-09-08. So the renderer writes one region per page rather
than three, and the page-specific nodes after them are never touched.

**The `Dataset` node gains the download it lacked.** `model.json` is a public URL whether or
not anything points at it, so the node that describes the model is where it belongs. `url`
moves to `https://blust.ch/model/`, because on a `Dataset` it names the landing page and
today it sends every reader off-site rather than to the page that draws the thing.
`encodingFormat` moves inside a `DataDownload` beside `contentUrl`, where it describes a file
rather than a node. The repository becomes `isBasedOn`: the Markdown is what the model is,
`model.json` is what this site serves, and the two are different claims.

What the model does not hold stays the renderer's prose. The `Dataset` description, the site
name and `jobTitle` are site text, not model content; the model has no field for any of them,
and inventing one is a model change rather than a build change.

## 3. The files

```
build/read.mjs        the one reader: pin → Map(path → text), local checkout or GitHub   new
build/model.mjs       read.mjs + parseInstance → model.json
build/pages.mjs       loads model.json, holds the pin guard, calls the three renderers   new
build/block.mjs       renderer: the data block, for model/ and timeline/
build/principles.mjs  renderer: the vision and the values as HTML
build/jsonld.mjs      renderer: Person, Dataset and WebSite, nine pages     replaces sameas.mjs
```

Each renderer exports one function taking the parsed model and a check flag, and returning
the regions that did not match. `pages.mjs` collects them and names them, so a red check
still says which page drifted rather than that some page did.

`read.mjs` is where the two fetchers become one. It keeps the route `model.mjs` takes today,
because that route already reads the whole container and one parse now feeds every consumer:
a local checkout when `MENTAL_MODEL` points at one whose `HEAD` is the pinned commit,
otherwise the `git/trees` listing and the raw files, with `GITHUB_TOKEN` sent when present
and never printed. The `contents` endpoint `principles.mjs` used is not carried over.

`jsonld.mjs` takes the person's addresses from the profile's `Also at` rows, as `sameas.mjs`
does today, and the rest of each node from its own constants. It parses the JSON-LD block
after writing and fails if it no longer parses — the guard `sameas.mjs` already carries, kept
for the same reason: it rewrites a region inside a document that has to stay valid JSON.

## 4. The commands

```
npm run model         network, parser    writes model.json
npm run model:check   network, parser    is model.json the true parse of the pin?
npm run pages         pure               writes all twelve regions: see below
npm run pages:check   pure               do the pages match model.json, at the pinned commit?
```

The twelve regions are the data block in `model/index.html` and `timeline/index.html`, the
vision and values in `principles/index.html`, and the leading three JSON-LD nodes on each of
the nine pages that carry a graph. Ten regions are written today, across seven files.

Re-pinning is `source.json`, then `npm run model`, then `npm run pages`. `principles`,
`principles:check`, `sameas` and `sameas:check` are removed; `pages` covers them, and a
half-run rebuild is the failure the removal prevents.

## 5. CI

The three model steps become two, and the half that runs before `npm ci` gets broader rather
than smaller. `pages:check` moves up into it and covers the data block, the principles page,
every invariant JSON-LD node and the pin agreement, on node built-ins alone. `model:check`
stays below `npm ci`, where it has to be, and remains the only step that reaches GitHub.

`principles:check` needed the network from its position above `npm ci`, which is the one
thing this removes from that block rather than adds to it.

## 6. What this does not change

The data block's bytes, so `stage.js`, `card.js` and the timeline's own reader are untouched.
The pin, the parser version, `pin-check.mjs`, the og cards, the PDFs and the narration.
`verify/check.mjs` keeps asserting `graph: "model-data"` and `ledger: "model-data"` against
the same markup; it asserts nothing about JSON-LD today and gains nothing here.

The graph is already validated, by the design package rather than by anything here.
`verify/check.mjs` imports `pageChecks` from `@robertblust/design/verify/pages`, which
resolves every referenced `@id` against the nodes its own document defines and fetches every
on-site URL in the graph, requiring HTTP 200. This design adds no validator and needs none.

That existing check gains reach from the change rather than losing it. The `Dataset` node's
`url` points off-site today and is therefore skipped; moved to `https://blust.ch/model/` it
comes under the check, and the new `contentUrl` puts `https://blust.ch/model.json` under it
too. Both must be served, which committing the artifact is what guarantees.

What no check holds is that a node is the same wherever its `@id` appears. Every suite runs
inside one site, and the drift recorded in section 1 crossed pages rather than breaking one.
Writing the invariant nodes from one definition closes that here, because `pages:check` then
holds all nine copies — but as a consequence of generation, not as a check, and it protects
this site only.

Three things are deliberately left for later. The `jobTitle` disagreement in section 1, which
is editorial. The timeline, which inlines all 123 entities including 69 skills to list 36
experiences; trimming it is a page-weight question that touches `rbCard.describe`. And a
check for the family, which is the one worth not losing.

That check is the half of this design that generalizes, and it is not the generator. The
siblings have no model to generate from, and their invariant nodes are hand-written and
internally consistent, so a shared generator would configure away a problem they do not have.
What does generalize is the invariant underneath it, and keyed on `@id` it needs no
configuration, because the sites already encode the distinction themselves: a page-specific
node carries a page-specific id, `https://blust.ch/model/#webpage`, while a site-wide node
carries one id everywhere, `#person`. So the rule is that a node is identical wherever its
`@id` appears. Measured on 2026-09-08 across all 86 nodes of the three sites, it gives one
failure and no false positives.

It belongs in `robertblust/design`, beside the checks that already run here: `verify/pages.mjs`
resolves `@id` references within a document, and this is the same check across documents. One
thing whoever builds it has to solve is that `pageChecks` runs per page and this accumulates
across a suite. It is a minor release and three re-sync pull requests, so it is its own work,
and it is proposed only after the rule has run here against a real generator.

Its evidence is already measured. Four different node shapes claim to be
`https://blust.ch/#person`: this site's seven pages carry three addresses with `jobTitle` and
`subjectOf`, its two decks carry two addresses, and companygraph.io and guestgraph.io each
carry two addresses with neither property. Three of the four predate the Substack address the
model gained on 2026-09-07. No suite can see it, because each one runs inside a single site.

One consequence to accept rather than avoid. The repository is served by GitHub Pages, so
`https://blust.ch/model.json` becomes a public URL. It discloses nothing new — the same bytes
are already inlined in two pages — and a machine-readable model at a stable address is what
the vision describes. It is not added to `sitemap.xml`, which lists pages; the `Dataset` node
is what announces it.

## 7. How it is verified

The claim is that nothing a reader sees changes, so the evidence is a diff. At the pinned
commit, `npm run model && npm run pages` must leave every derived region byte-identical
except the leading three JSON-LD nodes, whose changes are enumerated and intended: both decks
gain `https://substack.com/@robertblust`, and the `Dataset` node takes the three corrections
section 2 names, on nine pages. No rendered pixel moves, and `npm run verify` runs green
against all pages.

Each check is then proved by breaking what it holds, one at a time: an edited data block, an
edited paragraph on the principles page, a hand-typed address in a `sameAs`, a `WebSite` node
edited on one page only and a `source.json` moved without `npm run model`. Each must fail
`pages:check` and name the file. `model:check` is proved by editing `model.json` and
confirming it goes red against the unchanged pin.
