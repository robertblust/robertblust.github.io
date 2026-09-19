# The surfaces page — design

> A prose page after the team page, `/surfaces/`: every surface the model holds, drawn as a
> lineage from the model at its pinned commit, through whoever makes each surface, to the surface
> itself, each surface opening the card the model page draws. One release of the design package
> first, for the nav order and for bold in a card; then one pull request here.

Status: proposed. Decided on 2026-09-17 against three clickable prototypes generated from
`model.json` at the commit `source.json` pins. Where this says "the prototype", it means variant
B as Rob chose it.

---

## 1. What is true today, measured

Read on 2026-09-17 in `model.json` at `db44174`, the commit `source.json` names.

| Fact | Value |
| --- | --- |
| Surface files under `model/surfaces/` | 4 |
| Of those, `production: written`, `production: built` | 1, 3 |
| Distinct `built-by` repositories | 2 |
| Surfaces carrying `## Projection rules` or `## Constraints` | 1, the written one |
| Span-level marks `card.js` drew at design v0.61.0 | inline code only |
| Items of a surface's What it shows written as `**Name** — sentence` | all of them |

The last two rows decide part of the release: every card on this page would have shown each unit
name wrapped in four asterisks.

## 2. What was decided

**The lineage, not the register and not the split.** Three figures were prototyped over one
fixed title block. A register in the shape of the team board showed each surface's size as a
row of marks, but read as a comparison of four things rather than as where they come from. Two
columns, written against built, made the argument by their length only once the rules were open,
and put every rule of the written surface into the page at rest. The lineage draws the claim the
MCP server's own instructions make, that every surface a reader can reach derives from one
model: every line starts at one commit. Rob picked it.

**A surface sits under the maker its own file names.** Written surfaces sit under the owner, by
hand; a built surface sits under the repository its `built-by` names. No line is typed, so a
surface that changes how it is made moves without anyone editing the page. A `production` the
page does not know, or a built surface with no repository, fails the build rather than dropping
a node.

**Written and built are told apart by form, never by color.** A filled pen for the hand and an
outlined build mark, in `--c-firm` and `--c-mid`, the way `/team/` tells a human from an agent;
and on the wires, a dashed line for the hand and a solid one for a build. `tokens.css` allows one
hue at four brightnesses.

**The nodes are generated, the wires and the cards are not.** `build/surfaces.mjs` writes the
model node, the makers and the surfaces between `<!-- surfaces:start -->` and
`<!-- surfaces:end -->`, as nested lists, so a crawler reads the tree without running anything
and `pages:check` fails when the page falls behind the model. The wires are drawn by the page
from where the nodes landed, because only the browser knows that, and they say nothing the
nesting does not. A card is rendered by `rbCard.render` when a surface is chosen, as a seat's is
on `/team/`.

**Choosing a surface lights its path.** Its two wires take `--c-path`, the token that names the
way back to the root, the chosen node is pressed and its card opens full width under the
drawing. Choosing it again clears the choice. The hash is the surface's slug, and arriving with
one chooses it.

**Surfaces follows Team in the nav.** Where the work is published comes straight after who does
it. `ORDER` becomes Team, Surfaces, API, Ideas, Principles, Model, Timeline, Example, Talks,
Billing, Privacy.

## 3. The page

Title "Surfaces — Robert Blust", with canonical, description, the `og:` block, `twitter:card`
and the JSON-LD graph of `/team/`, its WebPage and BreadcrumbList named Surfaces. Its own share
card at `/surfaces/og.png`.

The page's own words are the title, "One model," light over "every surface." heavy; the tagline;
the shared note from `build/note.mjs`; the section label "The surfaces"; a legend for the two
wires; a hint shown until a surface is chosen; a caption; and a "How to read it" section of three
rules: a surface is a page and not a place, written or built says where the rules are kept, and
no line is typed.

The German is made from this English after Rob has reviewed it, by the translator role. Until
then the page carries no `data-de` of its own and its `verify` entry no `translates` spec.

## 4. The phone

Below 760 px the drawing becomes the tree it already is: the wires are hidden, and the nesting is
drawn with rules on the left edge, dashed under the hand. A surface's address truncates with an
ellipsis rather than widening its column. Measured at 360, 800, 1000 and 1280 px: nothing scrolls
sideways.

## 5. The design release

v0.62.0, a minor. `verify/pages.mjs` gains Surfaces second in `ORDER` and the header contract's
comment names the same list, so the header fence is v12. `card.js` reads bold as well as inline
code, code first, so asterisks inside backticks stay characters.

## 6. This repository

Re-pin to v0.62.0 and sync, which moves `card.js` and the header fence on every page carrying it.
Then the page, the renderer and its tests, the nav item on every page, the page in
`build/jsonld.mjs`, the card in `og-recipe.mjs` and every card whose page's header moved, the
page in `README.md`, the sitemap, and a `verify` entry with the prose-page battery plus
`lineage`: every surface in the block is drawn under its maker, nothing is shown before a
choice, choosing one draws its card without asterisks and lights two wires, and a hash lands.

## 7. Not in this design

The marks and the lineage do not move into the design package. The MCP Registry listing's
pointer at the MCP server is not drawn, because the model states it only in prose. The glossary
row for `surface` still describes a surface as a place no script writes, which stopped being true
when built surfaces were listed; that is a conventions change, not this page's.
