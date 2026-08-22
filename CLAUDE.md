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
- **At Hostpoint, only `A`, `AAAA` and the `www` record belong to this site.** `MX` and
  `TXT` are the domain's live mail. Touching them while pointing DNS at GitHub Pages
  stops incoming mail with no error and no bounce anyone would notice — the failure
  shows up as mail that never arrived, days later, from someone who gave up asking.
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

## Every link off the landing page opens in a new tab — including the talks

`github.com`, `linkedin.com`, `3ap.ch` and `likemagic.tech` are outbound and obviously
belong in a new tab. Less obviously, so do the two links to `talks/` — the nav item and
the button. Opening a same-site link in a new tab is normally the wrong instinct, because
it takes the back button away from the reader. It is deliberate here for the same reason
guestgraph.io does it with its own talk link: someone who opens a ten-minute talk has not
finished with the page that sent them, and a deck that swallows the tab it was opened from
is a deck they have to navigate back out of.

The `links` check in `verify/check.mjs` only inspects absolute `http` hrefs, so a relative
`talks/` link slips straight past it. That is what the separate `newTab` check is for.

## Notes live inside HTML attributes, and that bites three specific ways

Speaker notes are `data-notes` / `data-notes-en` attribute values, so anything that ends
the attribute swallows the rest of the tag with it:

- **Nested markup uses single quotes** — `<em class='cue'>`, never `class="cue"`.
- **German quotes must be typographic**, `„…“` (U+201E/U+201C). One straight ASCII `"`
  inside a note ends the attribute early and dumps the rest of the note onto the slide.
- **Never put an HTML comment inside a start tag.** The parser reads it as part of the
  tag's attributes; `data-notes` and everything after is lost. Comments go above the tag.

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

## `guestgraph/talks` is the reference copy for deck features

The intro deck there is where the transport bar, the language toggle, and the narration
scaffolding were worked out first. Duplication across these decks and that one is
deliberate, not an oversight to fix later — a shared runtime between repositories would
break the rule directly above it: a deck is one file that works from `file://`. Port a
fix by hand; do not link the two.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
