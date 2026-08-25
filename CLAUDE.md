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
- **Decks are self-contained single files that work from `file://`.** No bundler, no
  shared JS, no CDN. A change that only works when served breaks the one thing a deck is
  for: opening it cold, on someone else's machine, with no server running.

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

`github.com`, `linkedin.com`, `3ap.ch` and `likemagic.tech` are outbound and belong in a new
tab. Nothing on this site does any more — not the talks index, and no longer the decks.

Each deck's transport bar has an *All talks* control on the far side of the divider, beside
the language and notes buttons rather than beside play and next: one button away from those,
a misclick mid-talk would leave the deck instead of skipping a slide. The credit in the
bottom-left corner is the same link, in the one corner nobody clicks by accident.

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

Each deck's `<html lang>` is `de`, because the deck's content is German markup with
English carried in `data-en` — `applyLang()` swaps it in on load. The two are not the
same claim: a crawler that runs JavaScript sees English delivered under `lang="en"`; one
that does not sees German under `lang="de"`. Setting the static attribute to `en` would
make the German source lie about its own language before any script has run.

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

Both decks under `talks/` carry the system too, each with its own `fonts/` directory
rather than a shared one at the root. That is deliberate: a deck already keeps `audio/`
and its images beside it, so the folder — not the file — is the unit that has to survive
being copied to another machine. A shared `../../fonts/` would break the moment someone
sent just the talk.

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
- **The narration check runs first, before anything is installed.** `./tts/generate.py
  --dry-run` bills nothing and needs no key, and it catches the one failure a browser cannot
  see: a note edited without regenerating its clip renders perfectly, passes every DOM
  assertion, and speaks the old words. The step fails on `would write` in that output.
- **`npm run og` and `npm run pdf` never run here.** Both write files this repository commits
  — four share cards and two PDFs per deck — so in CI they would either overwrite the
  committed artifacts or fail on a dirty tree, and neither is a check.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.

### Why this rule moved twice

It first said every link off the landing page opens in a new tab, decks included. Then it
said the talks index is an index and stays in the tab, but a deck still gets its own. Now
nothing gets its own tab at all.

None of those were wrong for what existed at the time — a deck really did have no exit, and
opening one in the same tab really did strand the reader. The mistake was writing it down as
a **navigation principle** when it was a **workaround for a missing button**. A principle
invites you to defend it; a workaround invites you to remove the thing that made it
necessary. Once the deck carried its own way out, the rule dissolved on its own.

`verify` asserts both halves together — same-tab links *and* the deck's way out — because
either one alone is a trap.
