# The team page — design

> A sixth prose page, `/team/`: the two profiles the model holds and the eight seats between
> them, drawn as a board of seats against the five phases of the delivery process, each seat
> opening onto the same card the model page and the timeline already draw. One release of the
> design package first, for the nav order and for a reader a third page would otherwise copy;
> then one pull request here.

Status: proposed. Decided on 2026-09-16 against a clickable prototype generated from
`model.json` at the commit `source.json` pins. The prototype's words and behavior are what
this file records; where it says "the prototype", it means the state Rob approved, and nothing
in it survives except as this text.

---

## 1. What is true today, measured

Counted on 2026-09-16 in `model.json` at `c43921f`, the commit `source.json` names, and in this
repository and `robertblust/design` at their `main`.

| Fact | Value |
|---|---|
| Role files under `model/roles/` | 8 |
| Phase files under `model/processes/delivery/phases/` | 5 |
| Processes | 1, Delivery, with two tracks: Code and Prose |
| Profiles | 2: Robert Blust, `nature: human`; AI Agent, `nature: agent` |
| Seats the human profile holds, the agent profile holds | 1, 7 |
| Phases whose `gate-approvers` is the Owner alone | 5 of 5 |
| Distinct skills the eight roles name in `requires` | 14 of the model's 70 |
| Entities and edges in `model.json` | 143, 609 |
| Prose pages in this repository carrying the header | 7: `/`, `/ideas/`, `/principles/`, `/model/`, `/timeline/`, `/talks/`, `/privacy/` |
| `ORDER` in the shared `navOrder` check at design `main` | API, Ideas, Principles, Model, Timeline, Example, Talks, Billing, Privacy |
| Design release this site pins | v0.55.0; the package is tagged to v0.57.0 |
| Synced bytes changed between v0.55.0 and v0.57.0 | none — that diff is checks, vendored conventions and documentation |
| Renderers in `build/pages.mjs` | 2: `writePrinciples`, `writeJsonLd` |
| Pages in `build/jsonld.mjs`, cards in `og-recipe.mjs`, URLs in `sitemap.xml` | 9, 9, 9 |
| Copies of the reader that finds `link[data-stage]` and fetches it | 2: `assets/stage.js` and `timeline/index.html` |
| The nav order named in `blocks/header.css`, the header contract | Ideas, Principles, Model, Timeline, Example, Talks, Billing, Privacy — no API |
| The test named "the header contract's order comment agrees with navOrder" | passes, on a page where the two disagree |

Three of those rows decide the shape of the work.

The nav order is a contract the package checks on every page of three sites, so a new item is
a design release before it is a site change.

The reader that turns `<link data-stage>` into a parsed model already exists twice, in
near-identical words; a third page that fetches the model makes it three. That is the same
finding the timeline spec turned on a week earlier with the card, which had drifted in seven
places within a day of being copied.

**And the nav order is already two orders.** `verify/pages.mjs` puts API at the head of
`ORDER`; the header contract in `blocks/header.css` does not name API at all. The test called
"the header contract's order comment agrees with navOrder" passes on that disagreement,
because it matches two literal strings rather than comparing the two lists — the comment's
list is a substring of nothing it checks, and API's absence is invisible to it. This was found
while measuring for this design, it is not caused by it, and it decides how big the release
is: putting Team in the contract means editing a fenced block, which every page of every site
then re-syncs.

## 2. What was decided

**The board, not the tree and not the roster.** Three figures were prototyped over one fixed
page, so that only the figure varied. A masthead with a grid of seat cards read well but could
not show that the seven agent seats are one session rather than seven parties. A drawn tree in
inline SVG put the hierarchy in the geometry, which is the page's claim, but carried no phases
and needed a second figure under it. The board carries both: a row is what a seat does across
the work, a column is who touches a phase, and the column of gate marks is the argument the
page exists to make. Rob picked it.

**Human and agent are told apart by form, never by color.** `tokens.css` allows one hue at
four brightnesses and refuses a second in writing, with the reason: a second hue would make
color mean two things at once. So the two marks are a filled figure and an outlined machine
with an antenna, in `--c-firm` and `--c-mid`, and the distinction survives a monochrome print
and a reader who cannot tell the two blues apart. This is the rule the timeline already
follows, where five experience kinds are a square, a hollow square, a diamond, a circle and a
triangle, each with its own `aria-label`.

**The board is generated, the cards are fetched.** The board is rendered into the page at
build time by a new renderer, so the seat names, the phase headings and every mark are in the
HTML a crawler or an assistant reads without running anything, and `npm run pages:check` fails
the moment they fall behind `model.json`. The cards are not: they are rendered by
`rbCard.render` from `model.json` on the first time a seat opens, exactly as the timeline
renders an experience. Eight cards at rest would be eight copies of the model's own words in a
page that already serves the model as a file, and the page's own checks read the body at rest.

**The marks the board draws are read off the phases, not typed.** A cell's marks come from the
phase's own `owner`, `executed-by`, `supported-by` and `gate-approvers`, so a phase that gains
a seat gains a mark without anyone editing this page. The prototype was built twice, once with
the marks placed by hand and once with them derived; the two agreed, which is the only reason
this paragraph can say the hand-placed ones were right.

**Team is the first item in the nav.** The order is read right to left, the switcher at the
edge and each step left more the site's own subject, and the team is the most the site's own
subject there is. `ORDER` becomes Team, API, Ideas, Principles, Model, Timeline, Example,
Talks, Billing, Privacy, and this site's nav becomes Team, Ideas, Principles, Model, Timeline,
Talks. Six items were measured on the landing page before this was decided, at 901, 930, 960,
1000 and 1100 px with a sixth link injected: no page scrolls sideways, no wordmark breaks and
every link stays one line tall. Below 900 px the question does not arise, since the burger
takes the links then.

**A seat opens in place, at the board's full width.** The card is not indented under its row
and not capped at a narrow column: it spans the board, because the References table under a
role needs the width and wrapped its URLs at anything less. The card's paragraphs and lists
keep a 72ch measure inside it, since prose at the full column is past comfortable reading.

**This page carries no tooltip.** The family's tooltip is available to any element that sets
three attributes, and the prototype used it on seat names, profiles and phase headings before
Rob took it out. The card is the seat's detail, and a hover that shows a shorter version of
what a click shows in full is a second answer to one question.

**A `requires` link opens the model page expanded.** The card's skill references get the href
the timeline's `goLink` already builds, `../model/?stage=expanded#<id>`. A visitor who clicked
a skill wants to read it with its references around it, and the stage's dialog is where one
node is read.

**The two marks stay in this repository.** They are this page's vocabulary until a second page
in the family wants them, which is the order everything else in this family was built in: the
thing is hand-built and run where it is needed, and the package takes the shape only once it
has shipped somewhere. A block in the package with one consumer is a block whose shape was
guessed.

## 3. The page

`/team/`, title "Team — Robert Blust". Canonical, description, the `og:` block, `twitter:card`
and a JSON-LD graph as on `/model/` and `/timeline/`: the Person, the Dataset, the WebSite, a
WebPage whose `about` is the Dataset, and a BreadcrumbList Home → Team. Its own share card at
`/team/og.png`, rendered by `npm run og` from the page.

The skeleton is the model page's: header, title block, the figure section, one prose section,
the provenance line, footer. The page's own words, which are the whole of what is written by
hand here:

**Title.** "A company of one," light, over "staffed." heavy, with "staffed" in `--c-firm` —
the title contract's two blocks, and one word in the accent, which is all the contract allows.

**Tagline.** "Two profiles hold eight seats. One of them is a person, and that one decides."

**Note.** The sentence the principles page already carries, which says the words below are the
model's own and are therefore in the one language the model is written in, while the rest of
the site is bilingual. It is one sentence in two places as of this change, so it moves out of
`build/principles.mjs` into a module both renderers import rather than being copied. A note
that explains why a page does not translate is exactly the note that must not say two
different things on two pages.

**Section label.** "The team", in the mono label the pages use over a figure.

**Caption, under the board.** Read a row for what a seat does across the work, and a column for
who touches a phase. The triangle column is the argument: every gate in the company is
approved by the only human in it, and no agent row carries one. A seat opens onto the card the
model page and the timeline already draw.

**How to read it**, the prose section, three rules in the shape the model page's "What is in
it" uses: a seat is a role the model defines and a profile holds, not a person; a gate is what
a phase cannot be left without, and the Owner approves all five; a mark is read off the
phase's own file, so the board cannot disagree with the process it draws.

The German is made from this English after Rob has reviewed it, by the translator role, one
element at a time. The model page's own headline is the construction to follow: it renders
"A company of one, drawn." as "Eine Firma aus einer Person, gezeichnet."

## 4. The board

A head rail, then the board, then the legend.

The head rail carries the two profiles — the mark at 2.3 rem, the name in Bricolage, the
nature and the count of seats held in the mono label — and an Open all control at the right,
which flips to Close all, as the timeline's does.

The board is a grid of eight disclosures, not a `<table>`. This is the one place the design
gives something up: a `<tr>` cannot be wrapped in `<details>`, and opening a seat in place is
what Rob chose over a single card panel beside a real table. The columns are
`30% repeat(5, 1fr)`, declared once as a custom property and used by both the head row and
every summary, so the columns line up across rows.

**The grid does not claim to be a table in ARIA either.** Giving a `<summary>` `role="row"`
replaces the semantics that announce it as an expandable control, which is the one thing a
reader arriving on it by keyboard needs; a matrix read as five unlabeled cells is worse than
no matrix. Each summary instead carries an `aria-label` that says the row in words — the seat,
its nature, the phases it executes or supports and whether it approves their gates — and the
marks are `aria-hidden`, since the label already says what they say. This was not measured
against a screen reader, and should be before the branch merges.

Each `<details>` takes the role's slug as its `id`, so `/team/#reviewer` is an address, and a
page arriving with a hash opens that seat.

A summary is the seat's mark, its name and five cells. A cell holds nothing, or one to two
marks: a filled disc for executes, a hollow disc for supports, a triangle for approves the
gate. The Owner's row is tinted with `--press`, the way the model page tints a focused thing,
and an open seat turns its name to `--c-firm` and rotates the disclosure triangle, which is
the same treatment the card's skill groups already use.

The legend names the three cell marks and the two natures, in the dim prose the captions use.

## 5. The card, and the link out of it

`rbCard.render(entity, cbody, cfoot, { data, lang, link })`, unchanged, called the first time a
seat opens and again when the language has changed since — the `ensure` the timeline already
writes. For a role the card draws the type as its eyebrow, the name, the tagline, `requires`
as a list of links, then What it takes, What it produces, What it never does and References,
with the file and the commit in the foot. `source` is not drawn and there is no `skills`
field on a role, so the card needs nothing it does not already do.

`link` is the timeline's `goLink`: `../model/?stage=expanded#<id>`. The stage reads the
parameter on arrival, opens its dialog on the focused node and takes the parameter back out
of the address; the hash stays, since a focus is a place with an address. Nothing about this
is new work — it is the same function, passed from a second page.

**The reader that finds the data becomes one copy.** `card.js` gains `rbCard.data(who, cb)`:
it finds `link[data-stage]`, throws the loud message naming that markup when the page carries
none, fetches, and hands the parsed block to its callback from a timeout so a throw inside the
drawing stays an uncaught exception the suites report. `stage.js` and the timeline call it,
and this page is its third caller rather than its third copy. `card.js` already loads before
`stage.js` on every page that draws a stage, which is what makes this possible without
changing any page's script order.

## 6. The phone

Five columns of *named* phases do not fit: measured on the built page, they overflow below
760 px, and widening the seat column only moves the edge to the next longer word.

The first answer was to give up the matrix — below 900 px a row became its name and a strip
listing only the phases it touched. It was built, and then read on a phone, and it was wrong.
**The board's argument is a column.** Only the Owner's row carries a triangle, and a reader
gets that from the shape of the column rather than from any one row; a form with no columns has
nothing left to argue. The stacked form also repeated "04 Implement" down six rows and ran to
four screens.

So the board stays a board at every width, and what gives way is the phase *names*. Below
900 px the head row shows the numbers alone, `01` to `05`, the columns narrow to 2.1 rem and
again to 1.8 rem below 640 px, and the marks shrink with them. The block under the board is
what says which number is which phase — it was added to answer a different question and it
carries this one too.

Two things do change below 640 px: the two profiles in the head rail stack, because side by
side they wrapped "HUMAN · HOLDS 1 OF 8" onto a second line and put the agent hard against the
edge.

Measured at 320, 360, 390, 430, 640, 899, 901 and 1280 px: no width scrolls sideways, and
"Implementer", the longest seat name, is not clipped at any of them. Read on an emulated
iPhone 13 at 390 px, where a row still opens and the card inside it — including its References
table, whose URLs wrap within their column — reads without pushing the page out.

## 7. The design release

v0.58.0, a minor, and it is larger than it first looked. Three things change.

`verify/pages.mjs` gains Team at the head of `ORDER`, which becomes Team, API, Ideas,
Principles, Model, Timeline, Example, Talks, Billing, Privacy. A site whose nav does not name
Team is unaffected: the check filters the order by what the page actually shows.

**The header contract is corrected in the same release, and that makes it v9.** Its comment
names an order without API and now without Team, and a contract that disagrees with the check
enforcing it is worse than no contract. Both missing names go in. The comment is inside the
fence, so `versions.json` moves `header` from v8 to v9 and every page of every site rewrites
that block on its next `npm run design` — sixteen pages across three sites, byte changes in a
comment and nowhere else. The test that was supposed to prevent this is repaired at the same
time: it stops matching two literal strings and instead parses both lists and compares them,
so the next name added to one and not the other fails.

`assets/card.js` gains `rbCard.data`, and `assets/stage.js` loses its copy of the reader in
favor of it. A site notices this only as bytes: both files are already synced into every site
that draws a stage, and `npm run design` brings them. No page's markup or script order
changes.

The release notes say what changed for a consumer, what breaks and how to take it, in that
order. Nothing breaks; the whole release is taken with a re-pin and `npm run design`.

The two sibling sites are not re-pinned by this work. They take v0.58.0 when they next move,
and until they do their header fence sits at v8 — which `design:check` reports as out of sync
rather than as broken. Whether to move them now is the Owner's call, not this design's.

## 8. This repository, one pull request after the release

Re-pin to v0.58.0 and sync. **The re-pin is not isolated:** this site sits at v0.55.0 while
the package is tagged to v0.57.0, so it takes three releases at once. The diff between v0.55.0
and v0.57.0 touches no file under `blocks/` or `assets/`, so `npm run design` should move
exactly three things from v0.58.0 itself: `card.js`, `stage.js` and the header fence on all
seven pages that carry it. If it moves anything else, that is a finding to report before the
branch goes further, not a diff to accept.

Then, in one commit each where they are separable:

The page, `team/index.html`, with the header on it and Team marked `aria-current`, and the six
nav items in that order on all seven pages of this site that carry the header.

`build/team.mjs`, a renderer beside `build/principles.mjs`: it reads the entities, derives the
marks from the phases and writes the head rail, the board and the legend between
`<!-- team:start -->` and `<!-- team:end -->`. It is added to `RENDERERS` in `build/pages.mjs`,
which gives it `npm run pages` and `npm run pages:check` with no further wiring. The shared
note moves out of `build/principles.mjs` in the same commit.

`build/jsonld.mjs` gains `team/index.html`, taking `PAGES` to ten. **This is not a later step:**
that renderer refuses any page carrying the Person node that is not on its list, and the page
carries one, so `npm run pages` throws until the list names it. It moves in the commit that
adds the page. The Dataset's description
is corrected while that file is open: it reads "One person described in CompanyGraph", which
stopped being true when the model gained a second profile, eight roles and a process. What it
should say is a question for whoever writes it, not a decision this design takes.

`og-recipe.mjs` gains `{ dir: "team" }`, taking the card list to ten; `npm run og` renders it
and commits it. `sitemap.xml` gains its tenth URL. `README.md` gains `/team/` in the page map.

`verify/check.mjs` gains a `/team/` entry with the same battery the other prose pages carry —
`typography`, `storageKeys`, `mobileNav`, `carriesLang`, `headerBaseline`, `navOrder`,
`footer`, `seo`, `noNewTab`, `internalLinks`, `tokens`, `contrast`, `noFlash`, `tokenVersion`
and the fence list — plus its own assertions: eight seats in the board, the Owner's row
carrying a gate mark in all five columns and no other row carrying one, a seat opening to a
card whose heading is that seat's name, and a `requires` link whose href names
`?stage=expanded`.

## 9. Parked for the Owner

**The phase headings say nothing.** Each phase has a one-line tagline in the model — "Make the
thing, and let nothing go forward unread" for Implement — and with the tooltip gone this page
shows it nowhere. Three ways out: leave it, and let the phases be names only; put the five
lines in the prose section under the board; or let a phase heading open its own card the way a
seat does, which is the symmetrical answer and would put the process on the page properly.
The third is the recommendation. None of them is decided.

## 10. Not in this design

The marks, the board and the renderer do not move into the design package. No second site gets
a team page. The process gets no figure of its own beyond the five columns of this board; the
`Tracks` table the Delivery process holds, Code and Prose, is not drawn. No seat is linked to
the experiences that evidence it. The German is not written here. Nothing claims who or what
runs the agent, because the model deliberately does not say.

## 11. Testing

`npm run model:check` and `npm run pages:check` hold the board against `model.json`;
`npm run test:build` unit-tests the renderer, including the mark derivation, against a small
fixture rather than against the live model. `npm run design:check` holds the synced bytes.
`npm run verify` runs the page's assertions against a local server, `npm run og:check` says
whether the new card still shows the page it was rendered from, and `npm run test:og` covers
the recipe. `sh conventions/conventions-check` holds this repository's Markdown, though not
this file: `conventions.json` excludes `docs/superpowers`.

Verified by rendering, never by reading the diff.
