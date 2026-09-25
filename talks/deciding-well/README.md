# Building fast is solved. Deciding well is not.

A short talk, seven minutes played (eight in German), by **Robert Blust** that sums up a career break, June to September 2026, under the line this site opens with. Building with agentic AI turned out fast and cheap, and that half is shown in numbers git recorded; deciding well stayed the work, and that half is shown by how far the same work can be counted. CompanyGraph, a company's knowledge as one graph for people and agents, is offered as the answer to the gap.

Same approach as the companion talks [mental-model](https://blust.ch/talks/mental-model/) and [essential-complexity](https://blust.ch/talks/essential-complexity/).

## View

**Live:** https://blust.ch/talks/deciding-well/

A self-contained HTML deck (dark theme, bilingual DE/EN).

### Controls

A transport bar along the bottom edge: back to start, previous, play/pause, next, fullscreen, then a DE/EN toggle and speaker notes. Swipe left or right on touch. Arrow, space, page and Home/End keys still drive the deck too — for a presenter remote — but they're not shown anywhere; the buttons are the interface. Play reads the talk aloud from recorded clips in `audio/`, in whichever language is selected, and falls back to the browser's own voice if a clip is missing.

## Contents

- `index.html` – the presentation deck (inline SVG, no external assets)
- `deciding-well-de.pdf` / `deciding-well-en.pdf` – the exported PDF fallback
- `stats.json` – every figure the slides show, as a snapshot of Sep 24, 2026
- `stats.py` – the script that counts them, and `chart.py`, which draws slide 04 from them
- `decisions.json` – every decision the specs record, with its status and a quote from its spec, and `decisions.py`, which checks the quotes and counts them

## The figures

Every number on a slide is read from `stats.json`, and `stats.py` wrote it: commits, pull requests and releases from GitHub, the first date and commit count of the local application tooling, and the token usage of the Claude Code logs. Each count is filtered by a fixed cutoff, Sep 24, 2026 at 22:21 Swiss time, so a later run gives the same figures.

The decisions on slide 07 are not in the model, which has no decision type yet. Agents read the 95 specs at the cutoff and listed each decision with a status (taken, revised, dropped) and a quote; `decisions.py` keeps only a decision whose quote is found in its spec and writes `decisions.json`. The count is of that list, so it is a reading of the prose, and the slide says so.

The scripts are run by hand, never in CI, because `stats.py` needs `gh` signed in and files that exist only on the author’s machine.

```bash
talks/deciding-well/stats.py    # writes stats.json
talks/deciding-well/chart.py    # redraws slide 04 from it
```

## Build the PDF fallback

Run from the repository root:

```bash
npm install
npx playwright install chromium
npm run pdf        # → every deck, both languages: <slug>-de.pdf and <slug>-en.pdf
```

## Serve locally

From the repository root:

```bash
npm run serve      # → http://localhost:8000/talks/deciding-well/
```
