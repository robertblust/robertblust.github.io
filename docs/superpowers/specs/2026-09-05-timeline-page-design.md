# The timeline page — design

> A fifth prose page, `/timeline/`: every experience in the model as a ledger, in the order
> it began, each row opening into the same card the model page draws. One release of the
> design package first, for the nav order and for the card it shares; then one pull request
> here.

Status: proposed. Decided on 2026-09-05 against a clickable prototype built on the 31
experience files at the commit `source.json` pins. The prototype's words and behavior are
what this file records; where it says "the prototype", it means the state Rob approved, and
nothing in it survives except as this text.

---

## 1. What is true today, measured

Counted on 2026-09-05 in `robertblust/mental-model` at `a535e43`, the commit `source.json`
names, and in this repository and `robertblust/design` at their `main`.

| Fact | Value |
|---|---|
| Experience files under `model/profiles/robert-blust/experiences/` | 31 |
| Of kind Role · Project · Community · Education · Independent | 6 · 11 · 11 · 2 · 1 |
| Earliest `start`, latest `start` | 1999-10, 2026-06 |
| Entries without `end` | 1, the career break |
| Entries whose `end` equals `start` | 6, the single-day talks |
| Prose pages on this site carrying the header | 6: `/`, `/ideas/`, `/principles/`, `/model/`, `/talks/`, `/privacy/` |
| Header contract, design package | v7; order Ideas, Principles, Model, Example, Talks, Billing, Privacy |
| `ORDER` in the shared `navOrder` check | the same seven words, `verify/pages.mjs` |
| The card renderer | `renderInto` inside `assets/stage.js`, one function, reachable by nothing but the stage |
| Pages this site builds from the model | 2: `build/principles.mjs` renders HTML, `build/model.mjs` writes a JSON block |
| Design release this site pins | v0.27.0; the page typography spec is queued as v0.28.0 |

Two of those rows decide the shape of the work. The nav order is a contract byte-identical
on sixteen pages across three sites, so a fifth item is a design release before it is a
site change. And the card is a function inside the stage, so a second page that wants the
same card either copies it or the package moves it: the prototype copied it, drifted from it
in seven places within a day, and had to be rebuilt against the original. That is the
finding this design turns on.

## 2. What was decided

**The ledger, not the lanes and not the years.** Three figures were prototyped over the same
page. A horizontal axis with one lane per kind showed concurrency but ran wider than the
page and hid most names; a row per year showed density but repeated a long role in nine
rows. The ledger reads as the record it is, and it is the one where the card, the model
page's own, opens under the row rather than beside a drawing. Rob picked it.

**Timeline sits after Model.** Read right to left, the switcher is at the edge and each step
left is more the site's own subject; the timeline is the person's record and belongs beside
the model it is read from. The header contract's order becomes Ideas, Principles, Model,
Timeline, Example, Talks, Billing, Privacy. The German label is Werdegang.

**The card is shared, not copied.** `renderInto` leaves `stage.js` for a file of its own,
`card.js`, in the package's `stage` group beside `stage.css` and `stage.js`. The stage calls
it; the timeline calls it. A page that renders an entity's card renders it the way every
other page does, or the package fails to sync. The cost is one `<script>` line on the two
model pages that draw a stage, here and on companygraph.io, and the release notes say so.

**The data block is the model page's, written twice.** `build/model.mjs` already parses the
pinned commit into one JSON block; it writes that block into `timeline/index.html` as well,
under the same markers, and `npm run model:check` holds both. The two pages cannot show
different states of the model, because they cannot be built from different ones.

**Nothing on the page is written for it.** The ledger's rows, stamps and cards come out of the
block; the page's own words are the title, the tagline, the note, the caption, the hint, the
three reading rules and the provenance line, in English with German in `data-de`, and that
is the whole of what is written by hand.

## 3. The page

`/timeline/`, title "Timeline — Robert Blust", German "Werdegang — Robert Blust". Canonical,
description, `og:` block, `twitter:card` and a JSON-LD graph as on `/model/`: the Person, the
Dataset, the WebSite, a WebPage whose `about` is the Dataset, and a BreadcrumbList Home →
Timeline. Its own share card at `/timeline/og.png`, rendered by `npm run og` from the page.

The skeleton is the model page's: header, title block, figure section, one prose section, the
provenance line, footer. The words, English first and the `data-de` value after it:

**Title.** "Twenty-five years," light, over "in order." heavy, with "in order" in `--c-firm`.
German: "Fünfundzwanzig Jahre," over "der Reihe nach."

**Tagline.** "Every experience in the model, in the order it began — roles, projects, talks and
qualifications, and what ran during what. Read from the same files as the model, at the same
commit." German: "Jede Erfahrung im Modell, in der Reihenfolge, in der sie begann – Rollen,
Projekte, Vorträge und Abschlüsse, und was während wessen lief. Gelesen aus denselben Dateien
wie das Modell, am selben Commit."

**Note**, the flag-bordered `.note` the model page carries under its tagline. "Nothing here was
written for this page: every entry is the file in the model, at the commit named under the
list — in the one language the model is written in. The rest of this page is bilingual."
German: "Nichts davon wurde für diese Seite geschrieben: Jeder Eintrag ist die Datei im
Modell, beim Commit, der unter der Liste steht – in der einen Sprache, in der das Modell
geschrieben ist. Der Rest dieser Seite ist zweisprachig."

**Path line**, mono, in the `.stagehead` row: `experiences · 31 entries · 1999–2026`, the count
in `--c-firm`, every number read from the block. Beside it the one control, "Open all" /
"Alle öffnen", styled as the stage's `.expand`; it reads "Close all" / "Alle schliessen" while
every row is open.

**The ledger**, §4.

**Hint**, `.stagehint`: "Click an entry to open its card in place · the address remembers the
last one opened." German: "Anklicken öffnet die Karte eines Eintrags an Ort und Stelle · die
Adresse merkt sich den zuletzt geöffneten."

**Caption**, `.figcap`: "The years on the left are the span of an entry; the line under its name
is its kind, where it was done and its exact period. A **large square** is a role or an
independent period, a **small one** anything else. An entry **indented** under a role began
while that role ran." German: "Die Jahre links sind die Spanne eines Eintrags; die Zeile unter
dem Namen nennt seine Art, wo er stattfand und seine genaue Zeit. Ein **grosses Quadrat** ist
eine Rolle oder eine unabhängige Zeit, ein **kleines** alles andere. Ein Eintrag, der unter
einer Rolle **eingerückt** ist, begann, während diese Rolle lief."

**How to read it** / "Wie man es liest", three paragraphs in the `.rules` grid, each opening
with its bold rule:

1. "**Five kinds, and the kind says what an entry is.** Role, Project, Community, Education and
   Independent are the model's experience kinds, as the model defines them: a role is a
   position, a project is a delivery inside a role or beside one, community is work done in
   public: a talk, a seat, a working group, a published case." German: "**Fünf Arten, und die
   Art sagt, was ein Eintrag ist.** Rolle, Projekt, Community, Ausbildung und Unabhängig sind die
   Erfahrungsarten des Modells, so wie das Modell sie definiert: Eine Rolle ist eine Position,
   ein Projekt eine Lieferung in einer Rolle oder neben ihr, Community ist Arbeit in der
   Öffentlichkeit: ein Vortrag, ein Sitz, eine Arbeitsgruppe, ein veröffentlichter Fall."
2. "**The order is the beginning, the indent is the during.** A talk is a day, a board seat is
   years, and both are community work because the audience makes them so, not the duration.
   What an entry under a role says is only that it began while the role ran; who commissioned
   it is in its card." German: "**Die Reihenfolge ist der Beginn, die Einrückung das Während.**
   Ein Vortrag ist ein Tag, ein Vorstandssitz sind Jahre, und beides ist Community-Arbeit, weil
   das Publikum sie dazu macht, nicht die Dauer. Was ein Eintrag unter einer Rolle sagt, ist
   nur, dass er begann, während sie lief; wer ihn beauftragt hat, steht in seiner Karte."
3. "**A card is the file, not an excerpt of it.** Kind, start, end, organization and skills read
   as the file writes them; the achievements are its list; the link at the foot goes to it, at
   the commit this page shows. A date wrong here is wrong there, and is corrected there."
   German: "**Eine Karte ist die Datei, nicht ein Auszug daraus.** Art, Anfang, Ende,
   Organisation und Fähigkeiten stehen so da, wie die Datei sie schreibt; die Erfolge sind ihre
   Liste; der Link am Fuss führt zu ihr, beim Commit, den diese Seite zeigt. Ein Datum, das hier
   falsch ist, ist dort falsch, und wird dort korrigiert."

**Provenance**, `.derived`, mono end to end, in the model page's shape: "Generated from
robertblust/mental-model@a535e43 — 31 files under `model/profiles/robert-blust/experiences/`,
the same repository the model page is drawn from, and an instance of CompanyGraph." The
commit, the count and the link's href are filled from the block into `#srclink`,
`#srccommit` and `#srccount`; `#srclink` carries `data-src="model/profiles/robert-blust/experiences"`
so the check reads the folder from the same place the page does. German: "Erzeugt aus … — 31
Dateien unter …, dasselbe Repository, aus dem die Modell-Seite gezeichnet wird, und eine
Instanz von CompanyGraph."

**Nav.** The item reads "Timeline" / "Werdegang", `aria-current="page"` here, and it is added to
the header of every prose page on this site. The root page's `translates` spec gains
"WERDEGANG" beside the four words it already asserts.

## 4. The ledger

One ordered list, `ol.ledger`, one `li` per experience entity in the block, sorted by `start`
and then by `end`, both read from the entity's `stamp`. A vertical 2 px rule in `--rule` runs
down the list at the marks' column. After the last row, one mono line in `--dim` names the
month of the visit, from the visitor's clock, and the word TODAY, so the open end of the
ongoing entry has something to end at on the day it is read.

Each `li` holds a `details` whose `id` is the file's stem, `2015-3ap`, and whose `summary` is
the row, a three-column grid: the gutter, the mark, the words.

- **The gutter** is mono, `--dim`, tabular figures: the start year and the end year joined
  by a closed en-dash, `2015–2022`; one year alone when both are the same; `2026–now` while
  `end` is absent. It is 6.6 rem wide, 4.2 rem under 640 px.
- **The mark** is a square on the rule: 13 px in `--c-firm` for a Role or Independent
  entry, 10 px in `--c-mid` for the rest. While the row is open the square carries a 2 px
  outline in `--ink`, the stage's ring on the focused node.
- **The words** are the entity's name, then a line in `--dim` reading kind, organization
  where the entity has one, and the period, separated by middle dots as the stage's stamp
  is. The period is formatted by `card.js`'s `fmtPeriod`, in the page's language, and
  re-rendered when the language switches. A Role or Independent name is set in Bricolage
  Grotesque; every other name in the body face at 600. Hover paints the name `--c-mid`;
  open paints it `--c-firm`.
- **The indent.** An entry that is not a Role is indented 1.5 rem when a Role's span covers
  its start, the Role at whose `start ≤ this.start < end` — one level, never more, because
  the fact it states is "began while that role ran" and nothing deeper. The gutter stays
  flush: a ledger keeps its date column.

Opening a row reveals the card, §5, below the words and indented with them, its width capped
at 72 ch plus the indent; the rule runs on past it. Many rows may be open at once. Opening a
row writes `#<id>` to the address without scrolling; closing the last open row clears it;
arriving with `#<id>` opens that row and scrolls it into view; a `hashchange` does the same.
"Open all" opens every `details`, "Close all" closes every one, and the control's label and
`aria-pressed` follow the count of open rows.

Dates are parsed once, from the block's `stamp`: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, an absent
`end` meaning ongoing. The sort key of a start is the first day it names; of an end, the day
after the last day it names, so `2001-03` ends where `2001-04` begins and two adjacent roles
touch without overlapping. Nothing here reads a kind to decide how a date is read; the
experience-kind schema says so and the ledger holds to it.

Reduced motion is respected by having no motion: a `details` opens without transition.

## 5. The card, and where it lives

`card.js` is a new whole-file asset in the design package's `stage` group, copied to `/card.js`
beside `stage.js`, and loaded by a page with a plain `<script src="../card.js">` before the
script that calls it. It defines one global, `rbCard`, with two functions, and nothing else on
the page changes when it loads.

`rbCard.render(entity, body, foot, opts)` is `renderInto`'s entity branch, moved without
change of behavior: the eyebrow `type · id`, the name, the tagline, every frontmatter field in
file order as a `dl`, a list field as `ul.items`, a URL as an `.ext` link with its scheme
dropped, every section as its `h4`, its tables with captions in mono, its text with `- ` blocks
as `ul.prose` and backticks as `code.mono`, and the foot link `<file> @ <commit>` with the
"View this file on GitHub" label in the page's language. What it cannot know it takes from
`opts`: `opts.data` is the block, for the commit and the repository; `opts.lang` is `en` or
`de`; `opts.link(id)` returns the element for a reference that resolves to an entity, so the
stage hands back its `goLink`, which focuses the node, and the timeline hands back an `a.go`
whose href is `/model/#<id>`, which the model page reads on load and focuses. The root and
folder branches of `renderInto` stay in `stage.js`; they are the drawing's business.

`rbCard.fmtPeriod(stamp, lang)` is the stage's own date formatting, moved for the same reason:
the ledger's stamps and the stage's have to read the same, and the page typography spec is
about to change that function's range dash. One copy, one change.

`stage.js` drops both functions and calls `rbCard` instead. `stage.css` gains the `.ledger`
rules, because the card's own rules are there and a ledger row's open card is the same
`.card`, `.cbody` and `.cfoot`; a page that carries a ledger carries the stage's stylesheet as
the model page does. The `stage contract` fence is unchanged: the timeline page needs exactly
`.figure-section`, `.figcap`, `.stagehint` and `.derived`, and it has them.

**Why not leave the renderer in the stage and load `stage.js` on the timeline.** `stage.js`
reads the block, expects `#fig`, `#card`, `#stagemodal` and the rest, and draws on load; a page
without a drawing would carry a script that fails before it reaches the card. Guarding every
step on the presence of a canvas would make the stage a library by accident. A file that is
only the card is a library on purpose.

**Why not a fence.** A fence is a block inside a page the package does not own; the card
renderer is a hundred lines of script with no page around it, and the stage's own script is
already a whole synced file. It takes the same form.

## 6. The design release

One release, v0.29.0 if the typography spec lands as v0.28.0 first and v0.28.0 otherwise;
the notes say it is breaking for a page that draws a stage, since that page adds one script
line, and this is the reason `WORKING.md` gives for calling a release major. The family is
below 1.0 and has not yet cut a major; the notes carry the word, the number follows the
family's habit, and this is a decision for Rob to confirm before the release is tagged.

In `robertblust/design`:

- `blocks/header.css`: the order gains Timeline after Model; the block's version and
  `versions.json`'s `header` move to v8 together, which `test/fences.test.mjs` holds.
- `verify/pages.mjs`: `ORDER` gains `"Timeline"` after `"Model"`.
- `assets/card.js`: new; `lib/groups.mjs` adds it to `stage`, `test/groups.test.mjs` and
  `test/assets.test.mjs` follow.
- `assets/stage.js`: `renderInto`'s entity branch and `fmtPeriod` leave for `card.js`; the
  stage calls `rbCard`. `assets/stage.css` gains the `.ledger` rules.
- `README.md`: the warning about `stage.js` covers `card.js`; a line under the `stage` group
  says a page carries `card.js` before `stage.js`.
- Release notes: what a site does to take it, in this order. Sync; add `<script
  src="../card.js">` before `stage.js` on every page that draws a stage; run the suite.

companygraph.io takes the release the same way, one pull request: the sync, the script line
on its model and example pages, nothing else. guestgraph.io takes only the header order.

## 7. This repository, one pull request after the release

- `package.json` pins the release; `npm run design` rewrites the fences and copies `card.js`.
- `timeline/index.html`: the page, §3 and §4; `timeline/og.png` and `og.sha`.
- `model/index.html`: the `card.js` script line before `stage.js`, and the Timeline nav item.
  `index.html`, `ideas/`, `principles/`, `talks/`, `privacy/`: the nav item.
- `build/model.mjs`: writes the block into both pages; `--check` checks both; the log line
  names both. The CI step "The model page still matches the model" needs no change, since it
  runs the script.
- `verify/check.mjs`: a `/timeline/` entry with the checks `/model/` declares except `graph`
  and `divider`, plus `ledger: "model-data"`; the root page's `translates` gains WERDEGANG.
- `verify/check.mjs`, a `ledger` check local to this site until a second site has one: the
  block's experience count equals the row count; rows are sorted by the parsed start; the
  first `details` opens on click and its card's `dt` list equals the entity's field keys in
  order; its foot link ends with `/blob/<commit>/<path>`; `#srccommit` reads the block's short
  commit and `#srclink` ends with `/tree/<commit>/<data-src>`; arriving at `#2015-3ap` opens
  that row; Open all opens every row and reads Close all.
- `og-recipe.mjs`: `{ dir: "timeline", ...FRAME, hide: HIDE, titleSlide: false }`.
- `sitemap.xml`: `https://blust.ch/timeline/`, monthly, 0.8. `README.md`: the page in the URL
  map. `AGENTS.md`: one paragraph, that `npm run model` writes two pages from one block and
  the check holds both, since a page edited by hand goes red for a reason that is not on the
  page.
- `source.json`: moves to `robertblust/mental-model@7ed3f65`, the merge of the community
  kind's corrected definition, which regenerates the model and principles pages too. Pins
  are editorial; this one moves because the words it changes are the ones the timeline's first
  reading rule paraphrases, and Rob asked for the correction. His word before the commit.

## 8. Not in this design

A filter by kind: the indent already lets the roles read as chapters, and a control would be
chrome on a page whose point is that it has none. The lanes and the years figures: prototyped,
not chosen, not kept. Any change to the model: the page reads it. A second language for the
model's own words: the note says why. An `hreflang`: there is still one URL per page.

## 9. Testing

The suite is the test. `npm run verify` after the page lands, with the `ledger` check above
and every shared check the model page runs; `npm run model:check`, `npm run og:check`,
`npm run design:check` and `npm run pin:check` in CI as today. In the design package, the
existing tests hold the header version, the group's file list and the fence versions; a
`card.js` that regresses shows on the model page's `graph` check here and on companygraph.io,
which clicks into an entity and reads its card.

Verified by rendering, never by reading the diff.
