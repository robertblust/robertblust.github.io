# blust.ch — a durable place to point at

**Date:** 2026-08-22
**Status:** design, awaiting review

## The brief

blust.ch is a profile page for Robert Blust, written for **peers**. It has no call to
action: no "available for hire", no contact form, no conversion. Its job is permanence —
a short, stable URL that says who he is, what he thinks, and what he has said, and that
still works in five years.

Two talks move under it. Both are currently served from their own repositories and both
of those repositories are deleted once the move is verified.

Everything below follows from the brief. Where a decision could have gone two ways, the
reason is recorded, because the reason is the part that rots first.

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | One repository, `robertblust.github.io` | GitHub serves a user site at a domain root only from `<username>.github.io`. Any other name serves at `blust.ch/<name>/`. Not a preference. |
| 2 | Landing page **and** a `/talks/` index | The landing page grows with more about-me sections over time; the talks section within it stays a fixed-size teaser while `/talks/` absorbs growth. Also gives a stable URL meaning "Robert's talks". |
| 3 | No shared deck engine | Three decks, two GitHub accounts, and the self-contained single-file rule makes a shared runtime awkward. Duplication is accepted deliberately. The GuestGraph intro deck is the reference copy. |
| 4 | Old repositories deleted, not redirected | Owner's call. GitHub Pages cannot issue a real 301 anyway, and neither URL was widely shared. |
| 5 | Git history imported before deletion | Deleting the repositories destroys the only remote copies of that history. Import first, delete second. |
| 6 | English only for the site chrome | Matches guestgraph.io. The decks stay bilingual exactly as they are. |
| 7 | The GuestGraph talk is not listed | `/talks/` lists the two talks hosted here. guestgraph.io links back; neither site restates the other. |
| 8 | Decks adapted during the move, not after | Moving them and then rewriting them means touching both decks twice. |
| 9 | No recorded narration in this project | The transport bar falls back to the browser voice, so nothing is broken without clips. TTS costs money and is a separate decision. |
| 10 | Thesis-first summary, "Software Engineer & Architect" register | The talks share one argument; leading with it says why they exist. The executive register belongs on the CV, which has a different reader. |
| 11 | An `rb` monogram, and no portrait | Nothing exists to inherit — neither deck has an icon. A photograph would make a reference page read as a personal brand page. |

## Repository and deployment

```
robertblust.github.io/
  CNAME                     blust.ch
  index.html                the profile page
  robots.txt
  sitemap.xml               flat — one repository, no index needed
  og.png                    1200×630, the landing page itself
  favicon.svg               rb monogram, cobalt on paper
  talks/
    index.html              the talks index
    og.png
    mental-model/
      index.html            the deck
      og.png
      mental-model.pdf
      export-pdf.mjs
      export-og.mjs
    essential-complexity/
      index.html
      og.png
      essential-complexity.pdf
      comic-1.png … comic-6.png
      export-pdf.mjs
      export-og.mjs
  package.json              playwright + pdf-lib, dev-only
  README.md
  CLAUDE.md
```

No build step for the site. Playwright is a dev dependency used only by the PDF and
card exporters, never at serve time. Every page must work from `file://` and a plain
local server, not only from the live domain.

### DNS at Hostpoint

Replace the `A` record, add `AAAA` and `www`. **Leave `MX` and `TXT` untouched** — the
domain's mail is live and removing those records silently stops incoming mail.

```
A      blust.ch    185.199.108.153        replaces 217.26.48.101
A      blust.ch    185.199.109.153
A      blust.ch    185.199.110.153
A      blust.ch    185.199.111.153
AAAA   blust.ch    2606:50c0:8000::153
AAAA   blust.ch    2606:50c0:8001::153
AAAA   blust.ch    2606:50c0:8002::153
AAAA   blust.ch    2606:50c0:8003::153
CNAME  www         robertblust.github.io.

MX     mx1/mx2.mail.hostpoint.ch          DO NOT TOUCH
TXT    v=spf1 redirect=spf.mail…          DO NOT TOUCH
```

The IPv6 addresses were read from a live GitHub Pages apex rather than from memory.

After the records propagate, enable **Enforce HTTPS** in the repository's Pages
settings. blust.ch currently serves an empty page over HTTP and has no valid
certificate; this fixes both.

## URLs

```
blust.ch/                                profile
blust.ch/talks/                          talks index
blust.ch/talks/mental-model/             deck
blust.ch/talks/essential-complexity/     deck
```

These 404 afterwards and that is accepted:

```
robertblust.github.io/mental-model/
robertblust.github.io/essential-complexity/
```

## Migration sequence

Order is load-bearing. Each step is verifiable before the next begins.

1. Create the repository and land the site skeleton with `CNAME`.
2. Import both talk repositories' full history, preserving commits, with the deck moved
   to its new path in the same operation.
3. Adapt both decks (below) and verify by rendering.
4. Cut DNS over at Hostpoint; wait for the certificate; enable Enforce HTTPS.
5. Verify every URL live, including the decks' assets and PDFs.
6. **Only then** delete `robertblust/mental-model` and `robertblust/essential-complexity`.

Both talks' `README.md` files cross-link to each other by GitHub URL. Those links break
on deletion, so they are rewritten to the new blust.ch paths during step 2.

## The two lists, doing two different jobs

The landing page's talks section and `/talks/` must not become two copies of one list.
They are split by what they contain:

| | Landing page section | `/talks/` |
|---|---|---|
| Shows | title, length, languages, link | title, length, languages, link, **description** |
| Answers | "has he given talks?" | "what is this talk about?" |

Adding a talk means editing `talks/index.html` (a full entry) and `index.html` (one
line). That is a real duplication obligation, so `CLAUDE.md` names it explicitly —
the same way guestgraph.io records that "12 minutes" is duplicated on purpose.

## The profile page

One screen, quiet, no ask. In order:

1. **Lockup** — name and `Software Engineer & Architect`.
2. **The thesis**, verbatim:

   > My work keeps returning to one idea: the constraint has moved from building fast
   > to deciding well, which makes describing a domain precisely matter more than
   > coding it quickly. Over twenty-five years of platforms behind that — sixteen at
   > UBS, then co-founding 3AP and LIKE MAGIC.

   Every fact here comes from `rob-cv/content/profile.yaml`. Nothing is invented, and
   nothing is claimed about a current role, because the CV does not state one.
3. **Talks** — the teaser section, two entries, linking to `/talks/`.
4. **Links** — `github.com/robertblust`, `linkedin.com/in/robertblust`. Both open in a
   new tab with `rel="noopener"`.

### Identity mark and portrait

Neither existing deck has a favicon or a mark of any kind, and GuestGraph's belongs to
GuestGraph. So one is needed, and leaving it unspecified would mean deciding it by
accident during the build.

`favicon.svg` is a **monogram**: the letters `rb` in IBM Plex Mono, cobalt on paper,
matching the site's own type rather than introducing a logo. It carries to both decks,
which currently have no icon at all.

**No portrait.** `rob-cv/assets/portrait.jpg` exists and would work, but a page whose
brief is "no ask" reads differently with a face on it — a photograph makes it a personal
brand page rather than a reference. This is the cheapest decision here to reverse: one
image and one grid row.

Visual language matches the other three pages: `--paper:#0f1013`, `--ink:#f1ede4`,
`--cobalt:#7aa0ff`, IBM Plex Sans and Mono, vmin-based full-bleed padding. A durable
pointer should not look like a fourth unrelated thing.

## The talks index

Same structure as guestgraph.io/talks/ — brand link home, heading, lede, one row per
talk with number, title, length, languages and description. Descriptions are drawn from
each talk's existing README, which is where they are written today:

- **The Mental Model** — a structured, machine-readable knowledge base that acts as the
  brain of a company: one source of truth for vision, strategy, processes, roles, KPIs,
  rules and decisions, serving both human company management and agentic AI.
- **Essential Complexity** — describing a problem in its essential complexity, no more
  and no less. The standard has not changed in fifteen years; the cost has.

## Deck adaptation

Both decks are the same shape as the GuestGraph intro deck — roughly 430 lines, ten
slides, German markup with English in `data-en`, `applyLang()`, speaker notes in
`data-notes`, their own `export-pdf.mjs`. What ports:

- **The transport bar.** Back to start, previous, play/pause, next, fullscreen, then
  DE/EN and speaker notes, with the slide counter in the display window. Keyboard
  shortcuts are removed; arrow, space, page and Home/End keys stay undocumented for
  presenter remotes. Swipe on touch. Narration follows next/previous; back to start
  stops it.
- **The `lang` fix.** Static `lang="de"` describing the German source, with
  `applyLang()` setting `en` on load. Both decks currently claim `lang="en"` over German
  markup, the same defect the GuestGraph deck had.
- **Head metadata.** Canonical, description, the full OG set, `twitter:card`, and a real
  `<title>` instead of `<name> – Robert Blust`. Title and description swap with the
  language.
- **Share cards.** `export-og.mjs`, rendering each deck's title slide at 1200×630 from a
  16:9 band. Declared `og:image:width`/`height` must match the file.

What does not port: recorded narration (decision 9). The player's browser-voice
fallback covers its absence.

## Findability

One flat `sitemap.xml` listing four URLs — no sitemap index, because one repository
serves everything. `robots.txt` names it. Canonical and OG tags on all four pages, each
with its own 1200×630 card. PDFs are excluded from the sitemap: they are the same talks
in a second format and would compete with the decks for the same queries.

After deployment, a second Search Console **Domain** property for `blust.ch`, verified
by DNS TXT — added alongside the existing SPF and GuestGraph verification records, never
replacing them.

## Conventions to record in `CLAUDE.md`

- The repository name is forced by GitHub and cannot be changed without losing the domain root.
- `MX` and `TXT` at Hostpoint are load-bearing; only `A`, `AAAA` and `www` belong to this site.
- Adding a talk means editing `talks/index.html` **and** `index.html`.
- Decks are self-contained single files that must work from `file://`.
- Bilingual by attribute: German is the element's content, English is `data-en`.
- `lang` describes the source, not the delivered default.
- The GuestGraph intro deck is the reference copy for deck features; duplication is deliberate.
- Verify by rendering, never by reading the diff.
- Commits happen when the user asks.

## Verification

Nothing is called done without a render or a live check.

1. All four pages screenshotted at 1280×720 and 390×844.
2. DOM assertions per page: canonical matches the URL, description present, full OG set,
   `twitter:card`, card pixel size equals the declared size.
3. Deck behaviour: transport buttons, swipe, presenter keys, notes sheet, language
   toggle, `lang` before and after JS.
4. `sitemap.xml` parses; every URL in it returns 200 on the live domain.
5. `robots.txt` reachable and naming the sitemap.
6. Both PDFs regenerate and open.
7. Mail still resolves after the DNS cut-over: `dig MX blust.ch` unchanged.

## Out of scope

- Recorded narration for either talk.
- Listing the GuestGraph talk.
- Any shared deck engine or build step.
- Redirects from the old URLs.
- Content beyond the thesis paragraph — further about-me sections come later, and the
  page is built so they can be added without restructuring.
