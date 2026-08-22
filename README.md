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
npm run serve      # python3 -m http.server 8000
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

An earlier draft of this runbook recommended `git cat-file -e <sha>` against this local
repository instead. **That is not sufficient, and must not be reinstated.** `cat-file -e`
only proves an object is reachable from local refs on this disk — it says nothing about
whether it survives. `git remote -v` here is currently empty: nothing has ever been
pushed anywhere. A local object passing `cat-file -e` is fully consistent with that
history existing on exactly one machine — the one about to have its only other copies,
the two source repositories, deleted. Since that deletion is irreversible, a gate that
can pass while the history has a single point of failure is worse than no gate.

The check that actually protects against the deletion requires two steps, **in order**:

1. **Push this repository to GitHub first.** Until `origin` exists and this history is
   on it, there is no second copy to verify against — only local objects that would die
   with this disk.
2. **Verify against the pushed remote, not local `HEAD` and not local objects:**

   ```bash
   git fetch origin
   git merge-base --is-ancestor 0b5acb75e48d2a8ad7132fd1b4abc15bf20dc6ea origin/main
   git merge-base --is-ancestor 77757acea99102d128916e305d9f59e81610d08b origin/main
   ```

Both commands must exit `0`. `--is-ancestor` against `origin/main` confirms each source
repository's original tip commit is not merely present somewhere but actually reachable
from the branch GitHub is serving — which is what has to be true for the history to be
recoverable once the source repositories are gone. Run both, against the remote, only
after pushing, before deleting `robertblust/mental-model` or
`robertblust/essential-complexity` on GitHub.

## Process

- Commits happen when the user asks; suggest a message, don't auto-commit.
- Never mention closed-source predecessor projects — here, in docs, or in commits.
