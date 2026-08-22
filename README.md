# blust.ch

Robert Blust's profile page and two talks. Self-contained, no build step, no external
assets. Working conventions and the traps that break this site silently are in
`CLAUDE.md`.

## Pages

```
/                                profile page — thesis, talks teaser, links
/talks/                          talks index — the descriptions live here
/talks/mental-model/             deck: The Mental Model
/talks/essential-complexity/     deck: Essential Complexity
```

The profile page and the talks index deliberately list the same two talks: the profile
page carries a one-line teaser (title, length, language, link), the talks index carries
the description. Editing a talk means checking both files — see `CLAUDE.md`.

Each deck is bilingual (German content, English via `data-en`), self-contained, and
works from `file://` as well as a local server.

## Commands

```bash
npm install && npx playwright install chromium
npm run serve      # python3 -m http.server 8000 — audio/JS autoplay needs a server, not file://
npm run verify      # Playwright DOM assertions against all four pages, plus the sitemap
npm run og           # regenerate the four 1200×630 og:image share cards
npm run pdf            # regenerate both decks' PDF fallbacks
```

Run `npm run verify` after any change under `index.html`, `talks/`, or `verify/`. Run
`npm run og` and `npm run pdf` after a visual change to either deck or to `index.html` /
`talks/index.html` — the share cards and PDFs are rendered, committed files, not
generated on demand.

## Migration history — read before deleting the source repositories

The two decks were brought into this repository with their git history intact, as
subtree merges. The cut-over runbook's own draft says to confirm this with:

```bash
git log --oneline -- talks/mental-model/
```

**That command proves nothing.** `git log` with a path filter does not follow history
across a subtree merge commit — it shows only the merge itself, not what was merged in,
regardless of whether the history is actually there. A clean-looking one-line result
from that command is not evidence of anything.

The check that actually verifies the history is present is to confirm the two source
repositories' original tip commits still exist as objects in this repository:

```bash
git cat-file -e 0b5acb75e48d2a8ad7132fd1b4abc15bf20dc6ea   # mental-model's original tip
git cat-file -e 77757acea99102d128916e305d9f59e81610d08b   # essential-complexity's original tip
```

Both exiting `0` (no output) means the history is genuinely in this repository. Run both
before deleting `robertblust/mental-model` or `robertblust/essential-complexity` on
GitHub — that step is irreversible, and this is the only check on that runbook that
actually inspects the objects rather than a log formatted around them.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
