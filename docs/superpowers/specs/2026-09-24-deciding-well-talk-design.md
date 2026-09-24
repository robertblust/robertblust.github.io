# The deciding-well talk — design

> A third talk at `/talks/deciding-well/`, eleven slides and about ten minutes, in the same form as the two already here: bilingual, narrated, with a PDF in each language. It sums up the career break under the site's own line, *Building fast is solved. Deciding well is not.* The half about building fast is proven with numbers git recorded; the half about deciding well is shown by how far the same work can be counted, and CompanyGraph is offered as the answer to the gap.

Status: proposed. The outline was decided with the owner on 2026-09-24, one question at a time: a mixed room and argument first, numbers as a dated snapshot of that day, the story starting on 9 Jun 2026, and the provider dependency named as the risk the cost figure carries.

---

## 1. What was measured

Every figure was counted on 2026-09-24 and is stated in the talk as of that date. A dated figure describes a closed day, so it does not move, which is the form `WRITING.md` allows for a number. The values below are `stats.py`'s run on the evening of 2026-09-24, before the cutoff had passed; the script is run once more after midnight, and a figure that comes out different is corrected here and in `stats.json` before a slide carries it.

| Fact | Value | How it was counted |
| --- | --- | --- |
| First commit of the effort | 2026-06-09, rob-cv `e213a585`, "Initial commit: markdown-sourced CV with HTML/PDF build" | `git log --reverse` in the local rob-cv clone, which has no remote |
| First public commit | 2026-07-09, guestgraph/engine `fbeff99` | earliest commit over every public repository |
| First commit of blust.ch | 2026-08-17, `7d23000` | `git log --reverse` here |
| Public repositories | 23, across robertblust, companygraph and guestgraph, none archived | `gh repo list`; robertblust/xiny is private, archived and outside the family, and is left out |
| Commits on default branches, public repositories | 5,013, of which 3,275 are not merge commits | blobless bare clones, `git log HEAD`, 2026-06-09 to 2026-09-24 |
| Merged pull requests | 1,619, of which 22 are Dependabot's | `gh pr list --state merged`, by `mergedAt` |
| Releases published | 269 | `gh api repos/O/R/releases`, by `published_at` |
| Non-merge commits carrying `Co-Authored-By: Claude` | 2,994 of 3,275, 91% | the trailer matched over every message, not sampled |
| Busiest day | 2026-09-21: 695 commits, 214 merged pull requests | daily buckets by author date |
| Hosts answering 200 | 9: blust.ch, companygraph.io, guestgraph.io, and `mcp.` and `chat.` on each | `curl -sI`, status only |
| Specs, plans | 95, 105, none ever deleted | files under `docs/superpowers/specs`, `docs/superpowers/plans`, `docs/specs` and engine's spec-kit folders |
| Decisions the specs record | 1,360: 1,258 standing, 72 revised, 30 dropped or parked | agents read all 95 specs at the cutoff and listed each decision with a status and a quote; `decisions.py` keeps a decision only where its quote is in the spec, and counts a decision a later spec replaces as revised; `decisions.json` holds every one |
| Specs carrying a decision section | 35 | headings "What was decided", "The decision", "Decisions taken", "Decisions" |
| Reverts | 1, companygraph.github.io, 2026-08-23 | `git log --grep '^Revert'` over every repository |
| Pull requests closed without merging | 68, of which 12 are one release wave closed on 2026-09-20 and replaced the same day | `gh pr list --state closed`, unmerged |
| Tokens used by Claude Code, 2026-08-18 to 2026-09-24 | about 16.3 billion: 16.0 billion read from cache, 258 million written to cache, 50 million written by the model | `usage` of every assistant message in `~/.claude/projects/**/*.jsonl`, deduplicated by message id |
| The same tokens at API list price | about $9,825 | per model, at the list rates of the Claude API skill's table dated 2026-06-24; cache writes at the lifetime each message records |
| What was paid | the subscription, about $200 a month | the owner's plan |

Three rows decide the shape of the talk.

The building figures are exact because git records every build. The token figures cover a window only: Claude Code deletes a session's log after thirty days, so nothing before 18 Aug survives, and chats on claude.ai were never in these logs. The slide names the window.

**The decisions are counted by reading, because the model cannot count them.** The model has no decision type; a decision lives in the prose of a spec, a pull request or a merge, so no query returns the number. A heuristic over the decision sections gave anything between 170 and 250, which is an estimate. The owner chose on 2026-09-24 to have agents read every spec instead: each decision is listed with its status and a quote from the spec, a script keeps only those whose quote is found, and a sample of twenty was read against the sources — nineteen held as decisions, one was a state of affairs. The result is a count of a committed list, not an estimate, and the slide says how it was made. Most of the thirty not taken were deferred rather than abandoned, so the slide says dropped or parked.

Only the counts of rob-cv are used. Its content is private job-search material and appears nowhere in the talk, in its notes or in the stats file.

## 2. What was decided

**The audience is a mixed room, and the argument leads.** Leaders who decide and engineers who build sit in the same talk; the slides carry the argument and the numbers that prove it, and the technical detail lives in the speaker notes.

**The story starts on 9 Jun 2026**, the first commit of the application tooling, which the model itself calls the seed of the model. The public figures start where the public repositories do, so every number on a slide can be checked by anyone.

**The cost is a slide of its own, and it carries the risk.** About $200 a month paid, about $10,000 at list price: building is not the expensive part any more. The same sentence says what the four months rest on — a few providers' prices and terms. The talk names that dependency, shows the part already answered, the graph in git over an open protocol that any model can read, and points to the rest as research for 2027. It does not claim a solution it does not have.

**The gap folds into the decisions slide** as its closing line rather than standing alone, which keeps the talk at eleven slides and keeps the turn where the numbers are.

**The slug is `deciding-well`**, for the half of the line the talk is about; the title is the whole line.

## 3. The slides

Headlines are the English source; the German is made afterwards by the pipeline of `WRITING.md`. A headline set in two weights follows the site's rule for Bricolage Grotesque: light for the solved half, heavy where it lands.

| # | Headline | What the slide shows | What the note says |
| --- | --- | --- | --- |
| 00 | Building fast is solved. *Deciding well is not.* | The title, the name, "a talk on a career break, 2026" | The talk's one point, and that everything in it can be checked |
| 01 | The constraint moved | The value *Decide well over build fast*, quoted from the model | AI moved the scarce thing from building quickly to deciding correctly; the decision is the work, written down before the code with the alternatives that lost |
| 02 | One question, four months | June to September 2026; what to do next, tested by building in the open | The break ended with a decision, not only an offer, in the model's own words; the employer is not named |
| 03 | Building fast, measured | 23 repositories, 3 organizations, 5,013 commits, 1,619 merged pull requests, 269 releases, 9 live hosts, one person; 91% of the commits written with Claude | How each is counted, and that the figures are as of 24 Sep 2026 |
| 04 | The curve | Commits per ISO week from W24 to W39, each repository's birth marked on the axis; the climb from 17 Aug and the peak on 21 Sep | That the climb begins when the model does, not when the tools changed |
| 05 | Building is not the expensive part any more | About $200 a month; about $10,000 of compute at list price; 16 billion tokens, most of them context read again | The window and what it leaves out; then the risk: this rests on Anthropic, Google, OpenAI and their terms; the knowledge is portable, the speed is not yet; ways out are the research of 2027 |
| 06 | Where the time went instead | 95 specs and 105 plans; the five gates of the delivery process — Shape, Spec, Plan, Implement, Integrate — and the Owner who merges | An agent opens and reports; the Owner decides; no phase begins before its predecessor's gate is approved |
| 07 | Taken, revised, dropped | 1,360 decisions in 95 specs, 1,258 standing, 72 revised, 30 dropped or parked; one revert; a release wave across twelve repositories replaced within the day | How the count was made; closing line: an agent had to read them out of prose, and the next step is to make decisions part of the model |
| 08 | The answer: one graph | CompanyGraph: vision, strategy, roles, processes, rules and their evidence as one graph, for people and agents | Agents build fast; the graph tells them what was decided and why; it is Markdown in git, served over MCP, so no provider owns it |
| 09 | It runs | Three instances, each on a mental model of its own — blust.ch on Robert Blust's, companygraph.io on CompanyGraph's, guestgraph.io on GuestGraph's — each model in git and served as a site, an MCP server and a chat | An invitation: ask the chat a question the model can answer |
| 10 | Deciding well is the work | The line again, the three addresses, what comes next | From October an IT architect role; from 2027 AI governance, and the provider question with it |

Slide 04's chart is inline SVG, drawn from the snapshot of §4 and committed as markup, so the deck fetches nothing and the PDF bakes it in. It follows the site's tokens: bars in `--c-mid`, the peak in `--c-firm`, no second hue, the axis labels in mono because they are data.

## 4. What changes in this repository

A new deck, `talks/deciding-well/index.html`, in the shape of the other two: `tokens.css`, `deck.css` and `deck.js` linked, its own `TALK` and `UI` in both languages, speaker notes in `data-notes` and `data-notes-de`, every rule of AGENTS.md's deck sections holding — slides found by the literal `<section class="slide`, `data-say-title="no"` where a note restates its headline, stage directions as `em.cue`, guillemets in German.

Beside it, `talks/deciding-well/README.md` in the form of its siblings, and `talks/deciding-well/stats.json`, the snapshot every figure on a slide is read from, with each figure's method. The script that writes it, `talks/deciding-well/stats.mjs`, is committed too so that the counting can be repeated; it reads GitHub, the local rob-cv clone for its dates and counts only, and the Claude Code logs, and is run by hand once, never in CI.

The talk is registered in every list that names one: `talks/index.html`, `tts/generate.py`'s `DECKS`, `export-pdf.mjs`, `og-recipe.mjs`, `build/jsonld.mjs`, `verify/check.mjs`'s `PAGES` and the talks index's `sameTab` list, and `sitemap.xml` by `npm run sitemap`. The README and AGENTS.md say "two talks" today; they say "the talks" afterwards, since a count of talks is a number that moves.

Generated and committed: the clips in `audio/en` and `audio/de`, the two PDFs, the share cards of the deck and of the talks index.

## 5. How it is made and checked

The English is drafted by the writer on the branch and reviewed by the owner on the rendered deck. The German follows from the reviewed English only: translator, editor, back-reader, then the owner's picks. Narration is generated after both languages are final, because every changed note is a clip billed again; `./tts/generate.py --dry-run` names the slides before the paid run.

Done means `npm run verify`, `npm run og:check`, `npm run pages:check`, `npm run sitemap:check`, `npm run design:check` and the narration dry run all pass, the deck is read at 1280×720 and in the reading view below 1024 px in both languages, and the figures on every slide match `stats.json`. The pull request is opened and stops there; merging is the owner's word.

## 6. What this is not

Not a claim about what the tokens cost Anthropic. Not a count of decisions the model itself holds: it holds none yet, and the count on slide 07 is a reading of the specs. Not a teaser on the landing page — a talk is named on the talks index alone. Not a solution to the provider dependency; that is named and left to 2027.
