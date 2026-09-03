# blust.ch

Robert Blust's profile page and two talks. Self-contained, no build step, no external
assets. Working conventions and the traps that break this site silently are in
`CLAUDE.md`.

## Pages

```
/                                profile page — thesis, links to /talks/
/talks/                          talks index — the descriptions live here
/talks/mental-model/             deck: The Mental Model
/talks/essential-complexity/     deck: Essential Complexity
```

A talk lives in one file. `talks/index.html` is the only page that names a talk; the
profile page links to `/talks/` and lists nothing. Adding or editing a talk is therefore
one edit, not two — see `CLAUDE.md` for why the second one is gone.

Each deck is bilingual (English content, German via `data-de`), self-contained, and
works from `file://` as well as a local server.

## Commands

```bash
npm install && npx playwright install chromium
npm run serve      # python3 -m http.server 8000
npm run verify      # Playwright DOM assertions against all four pages, plus the sitemap
npm run og           # regenerate the four 1200×630 og:image share cards
npm run og:check      # do those cards still show the pages they were rendered from?
npm run test:og        # unit tests for the card recipe the check compares
npm run pdf            # regenerate both decks' PDF fallbacks

./tts/generate.py --dry-run     # narration: what would be billed, and for which slides
./tts/generate.py               # narration: generate what changed, both decks
```

Run `npm run verify` after any change under `index.html`, `talks/`, or `verify/`. Run
`npm run og` and `npm run pdf` after a visual change to either deck or to `index.html` /
`talks/index.html` — the share cards and PDFs are rendered, committed files, not
generated on demand. `npm run og:check` says when a card has fallen behind its page; CI
runs it on every push, so forgetting is caught rather than shipped.

Narration is generated from the speaker notes themselves and cached on a content hash, so
editing one note regenerates one clip. It needs `ELEVENLABS_API_KEY`, which lives in
`~/.zshrc` and is therefore invisible to a non-interactive shell — `CLAUDE.md` has the
one-liner that reaches it, and the rule about never printing it.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
