# blust.ch

Robert Blust's profile page and two talks. Self-contained, no bundler, no external assets. Working conventions and the traps that break this site silently are in `AGENTS.md`.

## Pages

```
/                                profile page — thesis, links to /talks/
/talks/                          talks index — the descriptions live here
/talks/mental-model/             deck: The Mental Model
/talks/essential-complexity/     deck: Essential Complexity
/surfaces/                       every place the model is published and how each is made — reads the same model.json as /model/
/team/                           the two profiles and the eight seats they hold — reads the same model.json as /model/
/timeline/                       the experiences as a ledger — reads the same model.json as /model/
```

A talk is named in one place. `talks/index.html` is the only page that names a talk; the profile page links to `/talks/` and lists nothing. Adding or editing a talk is therefore one edit, not two — see `AGENTS.md` for why the second one is gone.

Each deck is bilingual (English content, German via `data-de`), links `../../tokens.css`, `../../deck.css`, `../../deck.js` and the root `fonts/` rather than standing alone, and works from `file://` as well as a local server.

## Commands

```bash
npm install && npx playwright install chromium
npm run serve      # python3 -m http.server 8000
npm run verify      # Playwright DOM assertions against every page, plus the sitemap
npm run og           # regenerate the 1200×630 og:image share cards
npm run og:check      # do those cards still show the pages they were rendered from?
npm run test:og        # unit tests for the card recipe the check compares
npm run pdf            # regenerate both decks' PDF fallbacks

npm run model          # fetch the pinned model and write model.json — needs the network
npm run model:check     # is model.json still what that commit parses to?
npm run pages            # render model.json into every derived page region
npm run pages:check       # do those pages still match model.json?
npm run test:build         # unit tests for the renderers

npm run sitemap            # date each sitemap URL from its page's last commit — run before committing a page
npm run sitemap:check       # are those dates still what git says?

./tts/generate.py --dry-run     # narration: what would be billed, and for which slides
./tts/generate.py               # narration: generate what changed, both decks
```

Run `npm run verify` after any change under `index.html`, `talks/`, or `verify/`. Run `npm run og` and `npm run pdf` after a visual change to either deck or to `index.html` / `talks/index.html` — the share cards and PDFs are rendered, committed files, not generated on demand. `npm run og:check` says when a card has fallen behind its page; CI runs it on every push, so forgetting is caught rather than shipped. Run `npm run model` then `npm run pages` after moving the pin in `source.json`; `model.json` and every page built from it are committed files, not generated on demand.

Narration is generated from the speaker notes themselves and cached on a content hash, so editing one note regenerates one clip. It needs `ELEVENLABS_API_KEY`, which lives in `~/.zshrc` and is therefore invisible to a non-interactive shell — `AGENTS.md` has the one-liner that reaches it, and the rule about never printing it.

## License

[CC BY 4.0](LICENSE) for everything written here: the pages, the talks and their narration, the share cards, the picture, and the scripts that build and check them. Use it, quote it, build on it; credit it. Three kinds of file are not written here and keep their own licenses, each in a text beside it: the faces under `fonts/`, `d3.v7.min.js` and the GitHub mark inlined in `chat.js` come from `@robertblust/design`, whose NOTICE names each one. The license grants no right to a name or a mark: the rb mark and the name stay mine.
