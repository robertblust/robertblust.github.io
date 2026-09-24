# The talk prices a team — design

> A companion page to the deciding-well talk at `/talks/deciding-well/cost/`. It prices the same result twice: as a conventional Swiss delivery team, and as it actually happened with one person and agentic AI. The owner's hours count in both. It then asks whether the two would really produce the same result. The talk's slide 05 says that building is no longer the expensive part; this page shows what the expensive part would have been.

Status: approved by the owner on 2026-09-25. The shape was decided with the owner on 2026-09-25, starting from a draft report reviewed as a private artifact. The owner gave the subscription history the same day: Max 5x until mid-June, Max 20x after, USD 50 of ElevenLabs credit for the narration and USD 20 of Anthropic API credit for the chats; Google Cloud hosting is calculated from the services' own metrics. Three decisions were taken on the same day: the owner's rate is shown as a market rate for the role, not as his own; money figures appear on blust.ch as a deliberate choice; the section on whether the two approaches produce the same result stays.

---

## 1. What the page claims, and how each figure is made

The page mixes two kinds of figure, and it marks each one as one or the other. A **counted** figure comes from git, GitHub or the repositories, and anyone can repeat the count. An **estimated** figure is a judgement, stated with its basis so that it can be disputed. The talk promises that everything in it can be checked; the page keeps that promise by never presenting an estimate as a count.

| Figure | Kind | Source |
| --- | --- | --- |
| Repositories, commits, merged pull requests, releases, hosts, specs, decisions, reverts, Claude's share | counted | `stats.json` and `decisions.json`, as the deck reads them |
| Lines of code, of tests and of Markdown, per repository | counted | new in `stats.py`: non-blank lines of the files `git ls-files` lists at the cutoff commit, by extension, excluding lockfiles, `vendor/` and `dist/`; a path containing `test` or `e2e` counts as test |
| Active days, before and from 17 Aug | counted | days in `stats.json`'s `daily` with at least one commit: 26 and 38 of 39 |
| Hours per active day | estimated | 5 in the early phase and 8 in the peak phase, the owner's figures of 2026-09-25 |
| The team, its roles and person-months | estimated | bottom-up over eleven workstreams; 76 person-months in the expected case, 0.7× and 1.3× for lean and conservative, 7, 9 and 12 months long |
| The conservative case's cross-check | estimated | about 1,200 lines of tested code per person-month over the measured code and tests |
| Salaries and contractor rates | estimated, sourced | Zurich market middle: a senior engineer at CHF 140k against a reported average of about CHF 137k; contractor rates of CHF 120–190 an hour, inside the reported CHF 850–1,500 a day; the sources are linked on the page |
| Employer cost | estimated | salary × 1.30 for social charges and workplace, over 1,800 productive hours a year |
| The owner's rate | estimated | a lead architect at market rate: CHF 180k on the employer-cost basis, CHF 190 an hour as a contractor; the page never says this is what Robert Blust earns or charges |
| The subscription | the owner's figure, priced | Claude Max 5x at USD 100 a month until mid-June, then Max 20x at USD 200: USD 750 net from 9 Jun to 24 Sep. Anthropic bills Switzerland in USD net at the day's rate, plus 8.1% Swiss VAT: USD 810.75, about CHF 650. A card's foreign-currency fee is not counted |
| The narration voice | the owner's figure | USD 50 of ElevenLabs credit, about CHF 40 |
| Google Cloud hosting | counted | CHF 0: the six Cloud Run services scale to zero and throttle CPU outside requests; Cloud Monitoring shows about 33,000 requests and 5,500 billable instance-seconds from 15 to 25 Sep, against a free tier of 2 million requests and 180,000 vCPU-seconds a month; Artifact Registry holds 3 GB of images, a few cents |
| API usage for the chats | the owner's figure | USD 20 of Anthropic API credit for Sonnet 5, plus 8.1% VAT, about CHF 17 |
| Domains | estimated | CHF 90: companygraph.io and guestgraph.io for a year |
| USD to CHF | sourced | 0.80: the 2026 average to 23 Sep was 0.794 and early September about 0.81 |
| The team's tools | estimated | licences at CHF 60 per person-month; hosting at CHF 0 on both sides, in the same free tier |
| Closing the gaps | estimated | external code and security review CHF 15,000, usability and accessibility study CHF 12,000, a month onboarding a second maintainer CHF 20,000 |

Every number the page prints is read from a file, never typed into the markup, the rule the deck already follows. The counts go into `stats.json`; the estimates go into a new `cost.json` beside it, dated, each with its basis in a field of its own. The page's script computes the totals from the two files, so a changed assumption is one edit to `cost.json` and every figure on the page follows.

With the expected case, employer cost and 8 hours a day, the result is a conventional team at about CHF 1.24M over 9 months against about CHF 58k over about 3.5 months, about 21 times cheaper; with the gaps closed, about CHF 105k, still about 12 times cheaper. These values are the draft's and are not written anywhere as text; the page computes them.

## 2. What was decided

**A companion page, not a slide.** The deck is ten minutes with narration in two languages; the page is reference material read afterwards. The deck gains one line on slide 05 and one entry in slide 11's reading list, in the proof column, which then flows by column, both linking here. Changing slide 05's note re-records one clip in each language; the PDFs are exported again.

**The owner's hours count on both sides.** In the conventional case the owner is product owner and chief architect for a share of the team's months, 60% by default; in the agentic case his hours are the active days times the hours per day. That both sides are close is the page's point, and it is the talk's: the time building saved went into deciding.

**The owner's rate is a market rate for the role.** Publishing his own salary or rate on the site, weeks before a new role starts, is a claim the page does not need. The row is labelled "owner and lead, at a lead architect's market rate".

**Money on blust.ch is a deliberate exception, and it is scoped.** The page states costs and an estimate of what a team would have cost. It states no revenue, no margin and no income. The decisions not to claim ARR or a P&L stand.

**The assumptions are adjustable on the page.** Two switches, employer cost or contractor rates and lean, expected or conservative, and two sliders, hours per day in the peak phase and the owner's share in the team case. For estimates this is the honest form: the reader sees the result move with the assumption. The defaults are the figures above, and the page stores nothing: every visit starts from them, so the privacy page's list of what is stored stays as it is.

**"Would both approaches produce the same result?" stays, and is the owner's judgement.** Ten dimensions, each with its evidence from the repositories, whether a human team could do the same, and a rating: agentic ahead, even, or team ahead. The ratings are the owner's, reviewed by him row by row before the page ships. The page states that the evidence is counts from git, not an audit, and that nobody outside the project has reviewed the code.

**What the page leaves out is on the page.** Recruiting lead time, coordination loss, running costs on either side, the provider dependency slide 05 names, and rob-cv's content, of which only the dates and counts are used, as in the talk.

## 3. The page

In the order it reads:

| Part | What it shows |
| --- | --- |
| Title block | The family's title contract; a tagline naming the two bills and that the owner's hours count in both; the snapshot date |
| Assumptions | The two switches and two sliders |
| The verdict | Three figures side by side: the team's total and shape, the agentic total and shape, the difference in cost and in months |
| What was built | Ten counted facts in a grid, each read from `stats.json` or `decisions.json` |
| The two bills | One stacked bar per approach on one scale, owner, team, tools; the table under it |
| Time | Calendar months, and the owner's hours, per approach |
| The team | The roster with FTE, person-months, rate and cost, the owner's row marked as on both sides; the person-months per workstream as bars, each with its measured size |
| What it actually took | The agentic lines and their basis; the line on list price instead of the subscription |
| Would both approaches produce the same result? | The verdict sentence, the ten-row table, the cost of closing the gaps, the caveat |
| Method and what it leaves out | Employer cost, contractor rates, the owner's hours, AI and tools; the list of what is not counted; the sources |

Charts are inline SVG drawn by the page's script from the two files, in the site's tokens. The three series are owner, team and tools; their hues are chosen from the design package's tokens and checked for colour-blind separation in both themes, and each series is also named in a legend and in the table, so colour is never the only carrier. The ratings in the quality table carry a shape as well as a colour. Everything uses the site's fonts and `page.css`; the draft's Google Fonts link does not come with it, because AGENTS.md forbids external assets.

The page is English and German, German in `data-de` as on every page, made by the pipeline of `WRITING.md`. Numbers are formatted by the page language: `1,240` in English, `1’240` in German.

## 4. What changes in this repository

- `talks/deciding-well/cost/index.html`, the page, with its script inline or as `cost.js` beside it.
- `talks/deciding-well/cost.json`, the estimates, with a date and a basis per value.
- `talks/deciding-well/stats.py` counts lines and active days into `stats.json`; `test_stats.py` covers both, and a new test holds `cost.json`'s workstreams and roster to the same total of person-months.
- `talks/deciding-well/README.md` describes the page and `cost.json` beside `stats.json`.
- The deck: one line on slide 05 in both languages and its note, one entry on slide 11; the two slide 05 clips; both PDFs.
- The page is registered where a page is: `build/jsonld.mjs`, `og-recipe.mjs` and its share card, `verify/check.mjs`'s `PAGES` with the checks the other plain pages carry, and `sitemap.xml` by `npm run sitemap`.

Outside this repository, after this merges: a References row on the talk's entry in robertblust/mental-model pointing at the page, and the surface file if the talk's surface lists its pages. That is its own pull request.

## 5. How it is made and checked

The English is drafted by the writer on the branch from the draft report, and the owner reviews it on the rendered page, with the quality table read row by row. The German follows from the reviewed English only: translator, editor, back-reader, then the owner's picks. The narration clips for slide 05 are generated after both languages are final, dry run first.

Done means `npm run verify`, `npm run og:check`, `npm run pages:check`, `npm run sitemap:check`, `npm run design:check`, the talk's Python tests and the narration dry run pass. The page is read at desktop width and below 860 px in both languages and both themes, and every printed figure matches the two files. The pull request is opened and stops there; merging is the owner's word.

## 6. The paid tools, complete

The owner confirmed on 2026-09-25 that Claude, the Anthropic API and ElevenLabs were the only paid AI tools, and that the early phase ran at about 5 hours per active day. Every tool line on the page is therefore an owner's figure or a calculation, except the two domains.

## 7. What this is not

Not a claim about what the owner earns or charges. Not an audit of code quality. Not a business case for CompanyGraph or GuestGraph, and not revenue of any kind. Not a general claim that agentic AI is some number of times cheaper: it prices one build, by one experienced owner, whose decisions were already his to take.
