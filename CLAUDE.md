# blust.ch — working conventions

Robert Blust's profile page and two talks, self-contained, no build step. What the pages
are, the URL map and the commands live in `README.md`; this file is about the ways this
site breaks silently.

## Build & verify

```bash
npm install && npx playwright install chromium
npm run serve      # → localhost:8000, all four pages
npm run verify      # Playwright DOM assertions — the tests
npm run og           # four 1200×630 share cards
npm run pdf            # both decks' PDFs
```

**Verify by rendering, never by reading the diff.** A passing `npm run verify` after any
change to `index.html`, `talks/index.html`, or a deck is not optional — it is the only
check that catches a page that parses fine and renders wrong.

## Repository and DNS — get these wrong and there is no error message

- **The repository name is forced.** GitHub only serves a user site at the domain root
  from a repository named exactly `robertblust.github.io`. Renaming it, or forking under
  another name, loses `blust.ch` — Pages falls back to `<user>.github.io/<repo>/`, which
  is a different site at a different URL, silently.
- **At Hostpoint, only `A`, `AAAA` and the `www` record belong to this site.** Leave the
  rest of the zone alone while chasing a Pages problem — but know what is actually in it.
  The `MX` records point at Hostpoint's shared mail servers and the `TXT` carries their
  SPF, and both are the default template that comes with domain management. There is no
  mail package on this domain, so nothing is behind them: no mailbox receives, and
  nothing is lost by replacing them.

  This note used to say they were the domain's live mail, which was read off the DNS and
  never checked. It cost a wrong answer — the records look exactly like a working mail
  setup — and a convention that is wrong is worse than none, because it makes a safe
  change look dangerous.

  **It becomes true the day mail moves to Google Workspace.** From then on the `MX` and
  the SPF `TXT` are live mail, and touching them stops delivery with no error and no
  bounce anyone would notice — the failure shows up as mail that never arrived, days
  later, from someone who gave up asking. Restore the warning then.
- **Decks are single files that work from `file://`.** No bundler, no shared JS, no CDN, no
  build step — open `talks/mental-model/index.html` in a browser with no server running and
  it presents. A change that only works when served breaks that.

  The rule is about not needing a *server*, not about not needing the *repository*: a deck
  reads the root `fonts/` by relative path, so it is not a folder you can detach and mail.
  It does not need to be — what gets sent to anyone is the PDF.

## Adding or editing a talk

**A talk lives in one file.** `talks/index.html` is the only page that names a talk;
the root `index.html` links to `/talks/` and lists nothing. It used to carry a teaser
copy of the list, which meant every new talk was two edits and the second was the one
that got forgotten. That teaser is gone, and this note exists so nobody helpfully adds
it back.

The root page's nav and its one button both point at `talks/` and neither needs
touching when the talks change.

## No external assets, anywhere

Not a style preference. The brief for this site is durability, and a Google Fonts link
would be the one third-party dependency an otherwise self-contained site has — it also
sends every visitor's IP to Google from a site carrying no privacy policy, which German
courts have held to be a GDPR breach on its own. All four pages fall back to the system
sans stack. If a design pass ever wants a webfont, that is the conversation to have
first, not a `<link>` to add and forgive later.

## Narration (`tts/`)

`generate.py` reads the decks directly, so the speaker notes are the single source for
what is said — there is no separate script to keep in step. Clips cache on a content
hash of voice, model and text, so **editing one note regenerates exactly one clip** and
costs a few hundred characters rather than a full run.

```bash
./tts/generate.py --dry-run                       # what would be billed, and for which slides
./tts/generate.py                                 # both decks
./tts/generate.py --deck mental-model --only 04   # one slide of one deck
```

One generator serves both talks rather than a copy per deck. The two copies of the PDF
exporter this repository was assembled from had already drifted apart — different
defaults, different comments — which is the argument for not repeating the pattern.

- **`clipsSeen` is `true`, and that is now correct.** It was `false` while these decks
  had no audio, because browser speech synthesis was the only narration path and a
  viewer without installed voices needed the no-voice message to explain the silence.
  With clips present the optimism is right: `clip.onerror` falls back to the browser
  voice when a clip is missing, and reporting `false` would refuse to play for a
  voiceless browser even though the recordings would play perfectly.
- **Measurements before mechanisms.** `voice_settings.speed` is accepted by the API and
  ignored by `eleven_v3`; audio tags and paragraph breaks move the speaking rate by a few
  percent. The numbers are in the generator's docstring. Real pauses would mean silence
  between separate clips, owned by the player. Don't re-litigate this by feel.
- **Audio is committed, not LFS.** GitHub Pages does not resolve LFS objects — it would
  serve the pointer text where the audio should be. `.gitattributes` records why.
- **Narrated runs shorter than live.** Each deck is about ten minutes presented; narrated
  it is roughly half that, because a recording takes none of the pauses a speaker does.
  Measure before quoting a figure — these are the only two numbers here that are not.
- **Slide 00 speaks only its title.** Its whole note is a stage direction about greeting
  the room, so cue-stripping leaves nothing but the heading — about two seconds against
  thirty for every other slide. That is honest to what was written; the greeting was
  never authored as spoken words. Writing one would regenerate four clips.

## Secrets

`ELEVENLABS_API_KEY` is the only credential this repository needs, and it lives in
`~/.zshrc`. Only an **interactive** zsh sources that file, so a tool shell starts without
it — and so does a login shell, which is the surprising half. An empty variable is not
evidence the key is missing. Pull it in for the one command that needs it:

```bash
export ELEVENLABS_API_KEY="$(zsh -ic 'printf %s "$ELEVENLABS_API_KEY"' 2>/dev/null)"
./tts/generate.py
```

- **Never print an environment variable's value.** Not to check it, not in a debug line,
  not buried inside a larger `echo`. A transcript outlives the session, and a key that
  reaches one has to be rotated.
- **`${VAR:-UNSET}` prints the value whenever the variable is set.** It reads like a
  set/unset probe and does the exact opposite. This is not hypothetical: writing
  `echo "${VAR:+SET}${VAR:-UNSET}"` put a live API key into a transcript and forced a
  rotation. Probe with `${VAR:+SET}` alone, or
  `[ -n "$VAR" ] && echo set || echo unset` — forms that can only ever emit a fixed string.
- **Never `eval` an extraction from the shell profile.** A bare `export` with no match
  prints the whole environment.

## Nothing opens in a new tab; every deck carries its own way out

**Not one link on this site opens in a new tab**, outbound ones included — `github.com`,
`linkedin.com`, `3ap.ch` and `likemagic.tech` are no exception. A new tab takes away the
visitor's back button, and every deck carries its own way out, so nothing needs one.
`noNewTab` asserts it on every page.

**The one exception, which this site does not use, is a link inside a slide.** A presenter who
clicks one mid-talk in the same tab loses the deck, and no back-button muscle memory saves that
in front of a room. It keys on *where a link sits*, not where it points, so it needs no list of
hrefs to maintain. Neither deck here has an outbound link in a slide; companygraph's has two,
which is why the exception is written the same way in all three suites.

Each deck's transport bar has an *All talks* control on the far side of the divider, beside
the language and notes buttons rather than beside play and next: one button away from those,
a misclick mid-talk would leave the deck instead of skipping a slide.

The bottom-left corner carries two destinations, not one. The lockup goes to the **landing
page** (`../../`) and *Talks* / *Vorträge* goes to the **index** (`../`) — the same place the
transport control goes, which is the deliberate duplicate: the corner offers both levels of
"out", and the corner is the one place nobody clicks by accident.

`wayOut` covers the index link and is satisfied by either it or the transport control;
`landing` covers the lockup and nothing else does, because a relative `../../` is invisible
to the `links` check and a dead one looks like a working deck until somebody clicks it.

Neither half is visible to the `links` check, which only inspects absolute `http` hrefs — a
relative `mental-model/` slips straight past it. That blind spot is what the `sameTab` and
`wayOut` checks exist to cover, and it is why flipping any of this means editing a check and
not just an `href`.

## The brand lockup is a mark plus a wordmark, and the mark is inlined

Both pages open with the `rb` mark left of **Robert Blust**, the same shape guestgraph.io
uses. The mark is `favicon.svg` reproduced as inline SVG rather than `<img src=...>`,
because a linked asset renders as a broken box under `file://` — see *No external assets*
above. It draws its colours from the CSS tokens instead of the favicon's hard-coded hexes,
so a palette change moves both together; the favicon keeps its own hexes because it has to
stand alone. `verify/check.mjs` asserts the inline mark on both pages.

## Notes live inside HTML attributes, and that bites three specific ways

Speaker notes are `data-notes` / `data-notes-en` attribute values, so anything that ends
the attribute swallows the rest of the tag with it:

- **Nested markup uses single quotes** — `<em class='cue'>`, never `class="cue"`.
- **German quotes must be typographic**, `„…“` (U+201E/U+201C). One straight ASCII `"`
  inside a note ends the attribute early and dumps the rest of the note onto the slide.
- **Never put an HTML comment inside a start tag.** The parser reads it as part of the
  tag's attributes; `data-notes` and everything after is lost. Comments go above the tag.

## `generate.py` finds slides by a literal string, so attribute order matters

`slides()` scans for `<section class="slide` — the exact characters, not a parse. Anything
inserted between the tag name and `class` makes a slide stop being a slide, silently:

```html
<section data-say-title="no" class="slide title-slide">   <!-- invisible to the generator -->
<section class="slide title-slide" data-say-title="no">   <!-- correct -->
```

Nothing errors. The deck still renders, the notes panel still works, and the only symptom
is a clip that never gets generated — which looks exactly like a clip that was already up
to date. `./generate.py --dry-run` is what catches it: the slide count drops. Check it
against the number of slides in the deck before assuming a quiet run means a cached one.

**`data-say-title="no"` suppresses the spoken title** for slides whose note already
delivers the headline: the title slides, whose notes open by naming the talk, and any
slide whose first spoken sentence restates its `<h1>`. Without it the voice reads the
line, takes a beat, and reads it again. Which slides those are is a question for the
decks, not for a note like this one — it used to say "all three title slides do", and
that count was wrong in both directions while three slides repeated themselves. To find
them, compare each `<h1>` against its cue-stripped note in both languages. And per the note above, the flag is
matched by a substring test over the whole slide block, so writing it in a comment sets it
on the neighbouring slide. Explaining a flag must never set it.

## `<em class='cue'>` is a stage direction; bare `<em>` is spoken

Both decks originally used bare `<em>` for everything in the notes. Turning on narration
turned every stage direction — *pause here*, *lean in*, *make it personal* — into
something the synthesized voice read aloud along with the actual content. `class='cue'`
marks a direction as silent; anything without it is spoken. Where a direction and spoken
content shared one span, the fix was to split the span, not to pick a side — marking the
whole thing drops the content, leaving it bare narrates the instruction.

## Stripping a cue can leave a lowercase start or a verbless fragment — leave it

`spokenText()` deletes `em.cue` elements outright before reading the rest of the note
aloud. Two artifacts follow from that, and both are harmless, not bugs to fix:

- The sentence that follows a removed cue can end up starting lowercase (German nouns
  aside, this shows up more in English notes). A synthesized voice renders lowercase
  identically to capitalized, so nothing is heard wrong.
- Removing a cue mid-sentence can leave a verbless fragment behind it — see
  `essential-complexity` slide 3, where stripping *"Ich betone, dass ich das real
  gemacht habe:"* leaves "kanonische Datenmodelle bei der UBS, eigene DSLs bei 3AP und
  LIKE MAGIC." with no verb of its own.

Both are harmless in practice because `spokenText()` always prepends the slide title
before the note body — the title supplies the lead-in a stripped cue would otherwise
have provided. Do not "fix" either symptom by inventing connecting words the author
never wrote; that changes what is said, not just how it parses.

## `lang` describes the source markup, not what a visitor sees

Each deck's `<html lang>` is **`en`**, and that is right, because the source markup is
English: `applyLang()` collects every `[data-de]` element and captures each one's existing
`innerHTML` as its `data-en` before anything is swapped. German is the translation carried
in the attribute, not the other way round. So a crawler that never runs JavaScript sees
English under `lang="en"`, which is exactly what the file says. `applyLang()` then sets
`documentElement.lang` to whichever language is showing.

Two consequences worth knowing before editing a deck: **new translatable text needs only a
`data-de`** — writing a `data-en` by hand is redundant and will be overwritten on load —
and `verify`'s `sourceLang` check fetches the raw file and fails unless the static
attribute reads `en`.

## A link check that trusts the DOM inspects half the site

The rendered DOM is only ever **one language**. German lives in `data-de` as markup that does
not exist until a visitor switches, so `noNewTab`, `sameTab`, `links` and `internalLinks` see
the English half and nothing else.

That is not hypothetical. The privacy page's German credit kept `target='_blank'` — in
**single quotes**, because it is nested inside an attribute — and survived both a source-wide
strip of `target="_blank"` and the check itself. It was found by reading the source, not by a
failing test.

`noNewTab` now parses every `[data-de]` value into a template and inspects the links inside
it, reporting them with a `[de]` suffix. **Any new link check must do the same.** Two things
follow when editing translated markup:

- nested markup uses single quotes, so a source-wide search for `target="_blank"` misses it;
- a translated link and its English original must agree about opening in a new tab. They are
  two separate attributes and nothing pairs them.

## Slide numbers are zero-based everywhere the viewer can see them

The kicker on the slide, the counter in the transport bar, and (for the reference deck
this pattern comes from) the audio filename all agree on the same zero-based number.
`npm run verify`'s `zeroBased` check exists because these two numbers drift independently
the moment one of them is hand-edited.

## `guestgraph.github.io/talks/intro/` is the reference copy for deck features

That deck is where the transport bar, the language toggle, and the narration scaffolding
were worked out first. It lived in a repository of its own, `guestgraph/talks`, until the
talks were merged into the site they are served from — the same move companygraph.io made,
and the same one this repository has always had: decks are folders under the site, not a
second repository copying its chrome. Duplication across these decks and that one is
deliberate, not an oversight to fix later — a shared runtime between repositories would
break the rule directly above it: a deck is one file that works from `file://`. Port a
fix by hand; do not link the two.

## The design system, and why it is a copy

Type and colour are shared across `blust.ch`, `guestgraph.io` and the talks repository.
They share no stylesheet and cannot: a deck has to open from `file://`, so there is
nothing to import. Every page therefore carries its own copy of the token block, fenced
by `design tokens · vN` markers.

- **Brightness is confidence, and each stop has exactly one job.** `--c-weak` a candidate
  considered and not accepted; `--c-mid` anything interactive — links, controls, the brand
  accent; `--c-firm` the resolved thing — the thesis, the current page; `--c-flag` a
  reversal, at most once per page and never decoration. Before adding a colour, ask which
  of the four jobs it is doing. If the answer is "none", it does not belong.
- **Mono means data.** Record values, lengths, language pairs, URLs, code. Not navigation,
  not buttons, not prose. It was on all of those before, which is why it had stopped
  meaning anything. `verify` fails the build if mono appears outside data.
- **Fonts are self-hosted, same origin.** Not a preference: a font CDN sends every
  visitor's IP to a third party, and a bare family name with no `@font-face` — which is
  what these sites shipped for months — silently renders in system-ui instead. Both
  failures are invisible in the source. `verify` measures the rendered text and fails if a
  declared family matches the fallback width.
- **A font this site does not ship cannot be named, not even as a first choice.** The face
  is `Plex Mono` — the name the `@font-face` blocks actually declare. `IBM Plex Mono` is
  what it is called upstream, it is declared nowhere, and no machine has it, so naming it
  first meant the browser fell straight through to whatever mono the visitor's OS had. It
  survived on all four pages and in `favicon.svg` for months, because `fontsLoaded` only
  measures the families a page's spec *lists*, and this one was hiding in an SVG
  `font-family` attribute on the brand mark. `fontsAvailable` is the general rule that
  replaces looking: every family named anywhere on a page — stylesheet or attribute — must
  be `@font-face`'d by that page or be a generic keyword or a platform face. Platform faces
  are allowed and listed in `SYSTEM_FACES`; several are one OS's only — `Segoe UI` is
  Windows, `Menlo` and `SF Mono` are Apple — and that is what a fallback chain is for. The
  failure being caught is the other thing: a name that is on no machine and served from
  nowhere. `favicon.svg` is checked separately, by fetch, because it is the one place the
  mark lives outside a page and no DOM check can reach it — it can load nothing and inherit
  nothing, so it names only generic and platform faces, and diverges from the pages' inline
  copies exactly as its hard-coded hexes do.
- **One display face across both sites: Bricolage Grotesque.** Its weight axis carries each
  page's argument — light where the sentence describes the solved or unresolved half, heavy
  where it lands. blust.ch sets *Building fast is solved* against *Deciding well is not*;
  guestgraph.io sets *Five strangers* against *One guest*.

  It replaced Redaction, whose seven grades of decay were used to make the strangers arrive
  degraded and the guest resolve clean. That is a better idea on paper than in a browser: it
  was read as a page that had failed to load, twice, by the person who commissioned it — and
  on a site whose one genuine bug was a font that never loaded, that is the worst sentence
  type can utter. Weight says the same thing and never needs explaining. Do not reintroduce a
  degraded display face to make this point.

### Changing a token

Edit the block, run `npm run verify`, and it will name any page in **this** repository that
is behind. Nothing can tell you that a sibling repository is behind — that is why the block
carries a version. Bumping `vN` means bumping it in all three repositories and running all
three suites. The check is a habit with a tripwire, not a guarantee.

Both decks under `talks/` carry the system too, and all four pages load their faces from the
**one `fonts/` directory at the root** — `../../fonts/` from a deck, as on both sibling sites.

**Do not give a deck its own `fonts/`.** Nobody is sent a deck folder; what ships is the PDF,
which has the outlines baked in. A per-deck copy buys nothing and has to be kept in step with
the root by hand, with nothing checking that it is.

### The footer carries a version marker, like the tokens

The deck footer is copied across `blust.ch`, `guestgraph.io` and `companygraph.io`, and no
suite can see a sibling — the same gap the token block has. It is fenced by a
`deck footer · vN` marker and `footerVersion` asserts it.

What the marker covers is a **contract, not a look**: the lockup goes to the landing page, the
person to `blust.ch`, the third link to the talks index, and none of them opens in a new tab.
Change any of that and bump `vN` **in all three repositories**, then run all three suites. A
suite fails two ways — a version it does not expect, and no marker at all — so deleting the
fence is not a way around it.

`verify/design.mjs` is byte-identical across the three and holds both `TOKEN_VERSION` and
`FOOTER_VERSION`. Never edit it in one repo alone.

## Slides are a canvas, not a page

A deck lays its slides out once at a fixed height of **900**, and the whole plane is scaled
to the screen — the way a presentation tool does it, not the way a web page does. Two
things that used to be worth re-testing are now guarantees: **a slide can never scroll**,
because the canvas always fits, and **the composition is identical on every screen**,
because there is only one composition.

- **Only the height is fixed.** The width follows the screen's aspect, so the canvas covers
  the viewport exactly and there are never letterbox bars. A fixed 16:9 canvas put 96px of
  black top and bottom on a 4:3 screen, which is the wrong trade on the *minimum* supported
  size.
- **Every length is in `cqmin`, never `vmin`.** `cqmin` is 1% of the canvas's shorter side,
  and since the height is pinned at 900 and any landscape screen is wider than it is tall,
  that is a constant 9px. Type keeps its size and a wider screen buys real width. `vmin`
  did the opposite: it derived width from *viewport height*, so content width could never
  track the frame — at 2560×1080 the slides used 36–51% of the width and the rest was
  margin. That was the bug, and it is invisible unless you measure it.
- **Media needs a ceiling.** `.slide svg, .slide img{max-height:60cqmin}`. Anything sized as
  a fraction of width grows taller as the canvas widens: a square 300×300 diagram in a
  half-width column reached 780px inside a 900px frame on an ultrawide screen and pushed
  the slide into overflow. The cap sits well above any inline icon, so it only bites on a
  figure that was about to break the guarantee.
- **Below the breakpoint the canvas is switched off** — `transform:none`, `container-type:
  normal` — and the deck reflows into the scrolling reading view it always had. That is
  what "minimum supported width 1024" means in practice: canvas above, reflow below.

The scale is driven by one `fit()` function at the end of each deck. Both exporters ride on
it unchanged: the share card renders at 1200×675 and the PDF at 1280×720, and in each case
the canvas fills the frame exactly with no bars.

## Share cards go stale silently, and nothing on the page says so

`og.png` is not a banner someone drew: `npm run og` renders it from the page itself — an
index card is the page, a deck's card is its title slide — so a link preview shows what the
visitor is about to land on. The cost of that is a copy that has to be re-rendered whenever
the page moves, and nothing about a stale card looks wrong. Two of the four here advertised
the site as it read two days earlier, through several commits, and every check passed the
whole time.

- **Three files, one of them the single copy of the knobs.** `og-recipe.mjs` holds the card
  list, the frame and the hide rules and nothing else — it is pure, so `verify/og-recipe.test.mjs`
  can load it; `export-og.mjs` renders and stamps; `og-check.mjs` compares. A knob kept in the
  exporter as well would be a knob that can be edited without the hash moving, which is the one
  failure this mechanism exists to make impossible. All three sibling sites carry this shape.
- **The hash covers every key of a card, sorted, not a hand-written list of them.** That is why
  `settle` and `from` can exist in companygraph's cards and not here without the mechanism
  differing: a knob added later enters the recipe by existing. It also means changing the
  recipe format moves every `og.sha` while the cards themselves stay byte-identical — which is
  what happened when this repository adopted the shared module, and is not a sign anything
  about the pictures changed.
- **`npm run og:check` compares the recipe, never the pixels.** Two machines rasterise the
  same text differently, so a card compared by its bytes reports which machine rendered it.
  The check re-derives a hash of what went *into* the card and compares it with the `og.sha`
  committed beside it. It renders nothing, needs no browser, and runs in CI before `npm ci`.
- **The recipe is the page plus every local file the page names plus the exporter's own
  frame.** Fonts and images count: a font swap changes every card while no HTML changes at
  all. Every page names the root `fonts/`, so perturbing it marks **all four** cards stale —
  the layout described above, observable.
- **A link is not an asset.** The walk skips `<a href>`: the talks index links four
  multi-megabyte PDFs of the two talks, and hashing a link target reported that card stale
  on every `npm run pdf`, over a page that had not moved a pixel. Everything else a page
  names — `<link>`, `<img>`, `url()` in the inline CSS — is an asset and counts. The
  attribute pattern also admits `?` and `#` and strips them afterwards, because excluding
  them from the character class means `href="a.css?v=2"` matches nothing and leaves the
  recipe silently: over-reporting is survivable, under-reporting is the failure this
  mechanism exists to prevent.
- **Both files are committed together.** `og.png` and `og.sha`, in the same commit as the
  page that moved. The stamp is written after the screenshot, so an exporter that dies half
  way leaves the card reported stale rather than reported current.
- **It over-reports and never under-reports, deliberately.** Editing a comment in a page
  marks its card stale even though the render would be identical. Clearing that is `npm run
  og` and a commit — cheap, and the opposite error is a card nobody notices for two days.

## The head is a contract, and `seo` is what holds it

Canonical, description, the `og:` block, `twitter:card` and a JSON-LD graph, on every page.
`verify`'s `seo` check asserts the lot. Three of its assertions exist because the thing they
catch had already shipped green:

- **The canonical is compared against the page's own URL**, not merely against `og:url`.
  Agreeing with `og:url` proves two tags say the same thing, and both can say the same wrong
  thing — a canonical pointing at another page removes this one from the index and hands its
  signals over, silently, which is worse than any tag being absent.
- **Every page points at its own share card.** `card` only asks whether the image resolves at
  its declared size, and a borrowed card does. `/ideas/` advertised the landing page's card,
  and after that was fixed `/privacy/` still did.
- **Structured data has to resolve, not merely parse.** Every `@id` a page references must be
  defined on that page — Google reads `@graph` within one document — and every same-origin URL
  in the graph is fetched. `blust.ch/logo.svg` was named as the publisher's logo for months and
  has never existed.

Two traps worth knowing before editing that check:

- **`page.evaluate` runs in the browser, where `SITE` does not exist**, and it takes exactly
  one argument. Both mistakes were made writing it. Pass `{ url, site }` as an object.
- **Deriving the public origin from `BASE` makes the check vacuous off the default port.** It
  used to rewrite the literal `http://localhost:8000`; run with `127.0.0.1` and the URL filter
  matched nothing, so every graph URL was skipped and the check still printed ✓. Use the `SITE`
  constant.

`PAGES` is the single list: the sitemap's expected URLs derive from it, and the suite fails if
any page lacks `seo: true` — the runner skips a check whose key is undefined, so deleting that
one line would otherwise turn the contract off in silence. The suite also asserts that whatever
is on `BASE` is actually this site: a sibling repository left serving on `:8000` produced a full
run of failures belonging to a site nobody was testing.

**`og:locale` is Open Graph only. No search engine reads it.** It is `en_US`, with
`og:locale:alternate` `de_CH`, and the prose is American to match. Google reads `<html lang>`,
which `sourceLang` fetches cold on every page — `lang` alone cannot, because it reads
`documentElement.lang` after `applyLang()` has already corrected it.

**No `hreflang`.** It names another address for the other language and there is none: one URL
per page, German swapped in at runtime from `data-de`. It becomes correct the day `/de/` URLs
ship, and not before.

**The head contract is a third copy**, shared with `guestgraph.io` and `companygraph.io` and
carrying no `· vN` tripwire, unlike the token block and the deck footer. Port changes by hand
to all three.

## CI

- **`.github/workflows/ci.yml` runs the suite on push to `main` and on every pull request** —
  the same `npm run verify` as above, run by something other than a person remembering to.
- **The job is named `verify` because the status-check context a branch ruleset requires is
  the job id, not the workflow name.** Rename the job and `protect-main` keeps requiring the
  old name, which will never report again — the branch looks protected and silently isn't.
- **The suite drives a real browser against a served page, so the job has to serve one.** It
  checks out, installs Node with the npm cache, `npm ci`, installs Chromium with its system dependencies, starts `python3 -m http.server
  8000` in the background, waits for it to answer, and only then runs `npm run verify`. The
  job carries `timeout-minutes: 10`, because the two ways of hanging it below are not
  hypothetical, and the default is six hours. Started in the foreground, the server step never
  returns. **Backgrounded without redirecting its output, it hangs the same way** — a
  backgrounded process keeps the step's log pipe open and the runner waits on a descriptor
  that never closes, so the output has to go to `/dev/null`, not just to the background.
- **`package-lock.json` is committed, and `.gitignore` used to hide it.** `npm ci` fails
  outright without a lockfile in the tree — this is the first CI run's actual failure, not a
  hypothetical — and `cache: npm` has nothing to key on either. Ignoring it also let the
  Playwright version float, on a suite whose whole job is a deterministic browser. The
  sibling sites commit theirs for the same reason.
- **`npm run test:og` runs beside the card check, and before it.** The check is only worth the
  CI minute if the recipe it compares is right, and a recipe that quietly stops tracking a file
  reports every card current for the wrong reason. The tests build throwaway trees in `tmp`
  rather than asserting against this site's own pages, so they keep meaning something after the
  pages change.
- **The narration check runs first, before anything is installed.** `./tts/generate.py
  --dry-run` bills nothing and needs no key, and it catches the one failure a browser cannot
  see: a note edited without regenerating its clip renders perfectly, passes every DOM
  assertion, and speaks the old words. The step fails on `would write` in that output.
- **`npm run og` and `npm run pdf` never run here.** Both write files this repository commits
  — four share cards and two PDFs per deck — so in CI they would either overwrite the
  committed artifacts or fail on a dirty tree, and neither is a check. `npm run og:check`
  does run, and is the check they are not: see the section above.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- **Merge a pull request with a merge commit — `gh pr merge --merge`, never `--squash`.**
  Squashing is not a history preference here. GitHub *re-authors* a squash commit to the
  account that pressed the button, so a commit made locally under the wrong `user.email`
  lands on the default branch looking correct. That is not hypothetical: it was found in
  `robertblust.github.io`, where the local commit was authored `rob@likemagic.tech` and the
  commit that reached `main` read `robert.blust@flatland.ch`, with nothing anywhere saying
  so. A merge commit preserves the author it was given, which is the point — a wrong
  identity surfaces instead of being laundered.
- **The author is `robert.blust@flatland.ch`, and nothing on GitHub enforces it.** The
  ruleset rule that would — `commit_author_email_pattern`, a metadata restriction — is
  rejected on this plan. Tested, not assumed: an otherwise identical ruleset carrying a
  `deletion` rule was accepted in the same breath. So the identity comes from
  `~/.gitconfig`, where three `includeIf` blocks key it to `~/git/robertblust/`,
  `~/git/guestgraph/` and `~/git/companygraph/` and point at `~/.gitconfig-flatland`. The
  global default stays `rob@likemagic.tech`, which is right for `~/git/likemagic-tech` and
  `~/git/3ap-ag`. A clone made outside those three directories gets the global default and
  no warning, so check `git config user.email` before the first commit in a fresh clone.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
