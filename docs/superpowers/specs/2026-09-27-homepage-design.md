# The home page — design

> The home page keeps its headline and its lede and gains what the rest of the site has built since it was written: the vision with three ways to check it, the values with the line each will not cross, and the newest post. Every added word is derived — from the model or from the blog index — so the page states nothing a second time by hand, and its German is held to the English it translates.

Status: design approved in conversation on 2026-09-27, awaiting review of this written spec. The decisions taken that day: the page is still written for peers and still carries no call to action; the vision opens the checking tiles rather than standing alone; the tiles come before the values; the values show their closing "I never" sentence under the heading "Five values, each with the thing I never do", the count written by the renderer; the German of the vision and the values lives in the site, keyed to the English; the newest post is read from the blog index; the chat gains a hook that any element can open it by.

---

## 1. What is being added

| Where | What |
| --- | --- |
| design | `data-chat-open` in `chat.js`; an anchor id per value and a German input in the principles renderer; a home renderer for the vision and the values; released as one minor |
| blust.ch | the home page's four new sections; `build/principles.de.json`; the blog region; the principles note reworded; new checks; the re-pin; share card and sitemap |

Nothing in the model moves. The talks index, the blog index and every other page are untouched, apart from /principles/, which takes the German and the anchors.

## 2. The page

Top to bottom, at every width:

1. **The title block, unchanged.** "Building fast is solved. / Deciding well is not.", the byline and the first lede, word for word in both languages. The "See the talks" button goes: Talks stays in the nav and moves to the line under the newest post.
2. **The vision.** The kicker "The vision" / "Die Vision", then the vision's name as the `h2` with its second half in the accent, "One model, *true everywhere*.", then its tagline as the lede. Under it three tiles in a row, one column below 760px. *Ask* is a button carrying `data-chat-open`: "An agent that answers only from the model, and names the evidence under each answer." *See the model* links to `model/`: "The whole graph: experiences, skills and the evidence each claim rests on." *Read the timeline* links to `timeline/`: "Over twenty-five years, in the order they began, and what ran during what." The tile copy is the site's own and bilingual through `data-de`.
3. **The values.** The kicker "What I hold to", the heading "Five values, each with the thing *I never do*.", then one row per value in the model's order: the value's name on the left, linking to its anchor on /principles/, and its closing sentence — the one that begins "I never" — on the right in the dim ink. One column below 760px.
4. **The newest post.** The kicker "Latest writing", then the blog index's first entry in the index block's own markup, and under it "All posts · All talks".
5. **What I am building now.** The kicker, then the second lede as it stands with "that" made "that work", then the Ideas button.

The sections are spaced by one rule, `.sec`, and the kickers take the byline's type. The styles stay in the page's own `<style>`, as the page's other rules do; nothing here is yet shared with a sibling site, so nothing goes to the design package's CSS.

`main` loses `align-items:center`: it centered one screen of content vertically, and the page is now longer than a screen.

## 3. What is derived, and from where

**The vision and the values come from the model.** A renderer in the design package, beside `writePrinciples`, writes a fenced region of `index.html` from `model.json`: the vision's name and tagline, the heading and the value rows. `npm run pages` runs it and `npm run pages:check` holds it, like every other region. The vision's name is split at its comma for the accent, and the renderer refuses the build if there is no comma rather than guessing. A value's "I never" sentence is its last paragraph; the renderer refuses the build if that paragraph does not begin "I never", so a reworded value cannot quietly put the wrong sentence on the page.

**The count is written, not typed.** The renderer spells the number of values as a word, "Five" and "Fünf", from the model. A sixth value changes the heading by itself, which is what the rule on numbers that move asks.

**The German is the site's, keyed to the English.** `build/principles.de.json` holds, for the vision and each value by id, the German of every string the home page and /principles/ show, and beside each the SHA-256 of the English it was made from. The renderer writes the German into `data-de` beside the English. When the model's English moves, the hash no longer matches and `pages:check` fails by name, until the German is made again through the translator, the editor and the back-reader of `conventions/WRITING.md`. An English string with no German entry fails the same way. /principles/ takes the same file, so a visitor who follows a value from the home page lands on German too, and its note changes from "in the one language it is written in" to saying that the model is written in English and the German beside it is a translation held to that English by a check.

**The newest post comes from the blog index.** The build reads the first `.row` of `blog/index.html` and writes it into a fenced region of the home page, `data-de` included, with the link rebased from `deciding-well-solved/` to `blog/deciding-well-solved/`. `pages:check` fails when the two disagree. Publishing a post stays one edit, and the rule that a talk is named in one place holds for posts too.

## 4. The design package

**`chat.js`.** Any element carrying `data-chat-open` opens the panel on click, the same `open()` the floating button calls. The listener is delegated from `document`, so an element added later works, and the attribute is the only contract. The chat's header comment names it.

**The principles renderer.** Each value gets an id derived from its model id, so a home page row can link to it. It takes the German map as an option, writes `data-de` where an entry exists and fails where one is missing or stale; called without the option it renders as it does today, so companygraph.io and guestgraph.io see no change until they choose one.

**The home renderer.** The renderer of §3, exported as `render/home` beside the others, with its own tests on a small fixture: the comma split, the "I never" rule, the count word in both languages, the stale and missing German.

**Release.** One minor, since every consumer only re-syncs. The notes name the attribute, the renderer and the option.

## 5. Checks

In `verify/check.mjs`, on the home page:

- the vision and the value rows match `model.json`, and each value link resolves to an id on /principles/;
- the newest post matches the first entry of the blog index;
- clicking the Ask tile opens the chat panel;
- the `translates` spec presses DE and finds the German kickers, the German vision, a German value and the German post title, then presses EN and gets the page back;
- at 390px the page has no horizontal scroll and the tiles and value rows stack.

`build/renderers.test.mjs` gains the stale-German and missing-German cases for the site's own file.

## 6. Order of work

1. design: the three changes, their tests, the release.
2. blust.ch: the re-pin; `principles.de.json` with its German made by the pipeline, the owner reading only what the editor flags; the home page's regions and sections; /principles/'s note; the checks; `npm run pages`, `npm run og`, `npm run sitemap`; one pull request.

## 7. Left out on purpose

- No call to action and no contact line. The page is for peers, as the brief of Aug 22 set it.
- No talk named on the home page. "All talks" links the index.
- No question written into the Ask tile. The chat offers the model's own questions when it opens, and a question typed here would be a copy of them.
- No German in the model. It stays written in English; putting a second language into the schema would reach every instance, and this page needs none of that.
